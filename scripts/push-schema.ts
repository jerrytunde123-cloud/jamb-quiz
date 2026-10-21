/**
 * Apply db/schema.sql to the configured Turso database.
 *
 * Usage:  npm run db:push
 */
import "./env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { run } from "../src/lib/turso";
import { splitStatements } from "./sql";

async function main() {
  const sql = await readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8");

  const statements = splitStatements(sql);

  for (const statement of statements) {
    await run(statement);
    console.log(`✓ ${statement.split("\n")[0].slice(0, 60)}`);
  }
  console.log(`\nApplied ${statements.length} statements.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Schema push failed:", err);
    process.exit(1);
  });
