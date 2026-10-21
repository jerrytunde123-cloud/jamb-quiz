/**
 * Split a .sql file into statements.
 *
 * Comments are stripped line by line *before* splitting on ";", so a semicolon
 * inside a comment cannot cut a statement in half. The schema and migrations
 * have no triggers or BEGIN...END blocks, so a plain split is safe.
 */
export function splitStatements(sql: string): string[] {
  return sql
    .split("\n")
    .map((line) => {
      const comment = line.indexOf("--");
      return comment === -1 ? line : line.slice(0, comment);
    })
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}
