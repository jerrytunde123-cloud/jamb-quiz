import { NextResponse, type NextRequest } from "next/server";
import { fetchBankVersion, getSubjects } from "@/lib/quiz/service";

export async function GET(request: NextRequest) {
  const [subjects, bank] = await Promise.all([
    getSubjects(),
    fetchBankVersion().catch(() => null),
  ]);

  const etag = bank?.etag ? `"${bank.etag}"` : undefined;
  const clientEtag = request.headers.get("if-none-match");

  if (etag && clientEtag && (clientEtag === etag || clientEtag === bank?.etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  return NextResponse.json(subjects, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ...(etag ? { ETag: etag } : {}),
    },
  });
}
