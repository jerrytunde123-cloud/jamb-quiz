import { NextResponse, type NextRequest } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const CACHE_DIR = path.join(process.cwd(), "db", "image-cache");

/**
 * Detect image mime type from magic bytes or URL extension.
 */
function detectMimeType(url: string, buffer: Buffer): string {
  if (buffer.length >= 4) {
    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // GIF: GIF87a or GIF89a
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return "image/gif";
    }
    // WebP: RIFF ... WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      return "image/webp";
    }
  }

  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".svg")) return "image/svg+xml";

  return "image/png";
}

/**
 * Image caching proxy.
 *
 * Downloads question diagrams and figures once from external hosts, caches
 * them on disk in db/image-cache/, and serves them with immutable 1-year
 * caching headers.
 *
 * Benefits:
 *  - 0 hammering on external hosts (fetched only once)
 *  - Served in <5ms directly from the Next.js server
 *  - Immune to third-party outages or broken hotlinking
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl || !imageUrl.startsWith("https://")) {
    return new NextResponse("Invalid image URL", { status: 400 });
  }

  const hash = crypto.createHash("sha256").update(imageUrl).digest("hex").slice(0, 32);
  const filePath = path.join(CACHE_DIR, `${hash}.bin`);
  const metaPath = path.join(CACHE_DIR, `${hash}.json`);

  // 1. Serve from disk cache if present (instant, zero outbound network)
  if (existsSync(filePath) && existsSync(metaPath)) {
    try {
      const [buffer, metaStr] = await Promise.all([
        readFile(filePath),
        readFile(metaPath, "utf8"),
      ]);
      const meta = JSON.parse(metaStr);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": meta.mime || "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      /* fallback to live fetch */
    }
  }

  // 2. Fetch from source host once
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return new NextResponse("Image not found on remote server", { status: 404 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = detectMimeType(imageUrl, buffer);

    // Save to disk cache asynchronously
    try {
      if (!existsSync(CACHE_DIR)) {
        await mkdir(CACHE_DIR, { recursive: true });
      }
      await Promise.all([
        writeFile(filePath, buffer),
        writeFile(
          metaPath,
          JSON.stringify({ mime, url: imageUrl, at: Date.now() })
        ),
      ]);
    } catch (saveErr) {
      console.warn("[image-cache] failed to save to disk:", saveErr);
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[image-cache] fetch failed for", imageUrl, err);
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
