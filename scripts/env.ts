/**
 * Minimal .env loader for the CLI scripts.
 *
 * Next.js loads `.env.local` and `.env` itself, but standalone scripts do
 * not, so we replicate that behaviour here. Precedence (highest first):
 *
 *   1. real environment variables
 *   2. `.env.local`
 *   3. `.env`
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/** Lowest priority first, so later files overwrite earlier ones. */
const FILES = [".env", ".env.local"];

const values = new Map<string, string>();

for (const file of FILES) {
  const full = path.join(process.cwd(), file);
  if (!existsSync(full)) continue;

  for (const line of readFileSync(full, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) values.set(key, value);
  }
}

values.forEach((value, key) => {
  if (!(key in process.env)) process.env[key] = value;
});
