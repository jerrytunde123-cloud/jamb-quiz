/**
 * Apply pending files in db/migrations, in filename order, once each.
 *
 * Usage:  npm run db:migrate
 */
import "./env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { query, run } from "../src/lib/turso";
import { splitStatements } from "./sql";

async function main() {
  await run(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name       TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL DEFAULT (datetime('now'))
     )`
  );

  const rows = await query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(path.join(dir, file), "utf8");
    for (const statement of splitStatements(sql)) await run(statement);
    await run("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
    console.log(`✓ ${file}`);
    count++;
  }

  console.log(count ? `\nApplied ${count} migration(s).` : "No pending migrations.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
