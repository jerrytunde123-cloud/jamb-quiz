import dns from "node:dns";
import { createClient, type Client } from "@libsql/client";

// Ensure IPv4 first if environment has IPv6 routing/NAT64 quirks
if (typeof dns?.setDefaultResultOrder === "function") {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Ignore in edge environments
  }
}
if (typeof dns?.lookup === "function") {
  const origLookup = dns.lookup;
  // @ts-expect-error Monkey patching dns.lookup to force IPv4 when IPv6 route is broken
  dns.lookup = function (hostname: string, options: unknown, callback: unknown) {
    if (typeof options === "function") {
      callback = options;
      options = { family: 4 };
    } else if (typeof options === "object" && options !== null) {
      options = { ...options, family: 4 };
    } else if (typeof options === "number") {
      options = 4;
    }
    // @ts-expect-error call original lookup
    return origLookup.call(this, hostname, options, callback);
  };
}

/**
 * Unified Database access for Turso Cloud (production) and local libSQL (development).
 * Both use @libsql/client seamlessly.
 */
const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const isLocal = url.startsWith("file:") || url === "";

const client: Client = createClient({
  url: url || "file:./dev.db",
  authToken,
});

/** True when a real (remote) database is configured. */
export const isConfigured = Boolean(url) && !isLocal;

/** True when the app is running against a local database file. */
export const isLocalDatabase = isLocal;

/**
 * libSQL rejects `null` bind values, so they are converted to an empty
 * string.
 */
function normaliseParams(params: unknown[]): unknown[] {
  return params.map((p) => (p === null || p === undefined ? "" : p));
}

/** Run a SELECT and return all rows. */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await client.execute({
    sql,
    args: normaliseParams(params) as never[],
  });
  return (result.rows ?? []) as T[];
}

/** Run a SELECT and return the first row (or null). */
export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length ? rows[0] : null;
}

/** Run an INSERT/UPDATE/DELETE. */
export async function run(sql: string, params: unknown[] = []): Promise<void> {
  await client.execute({ sql, args: normaliseParams(params) as never[] });
}

/** Run several statements atomically (all succeed or all roll back). */
export async function transaction(
  statements: { sql: string; args?: unknown[] }[]
): Promise<void> {
  await client.batch(
    statements.map((s) => ({
      sql: s.sql,
      args: normaliseParams(s.args ?? []) as never[],
    })),
    "write"
  );
}

/**
 * Like {@link query}, but returns an empty result instead of throwing when the
 * database is temporarily unreachable.
 */
export async function safeQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    return await query<T>(sql, params);
  } catch (err) {
    console.error("[db] query failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/** Like {@link queryOne}, but returns null instead of throwing. */
export async function safeQueryOne<T>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await safeQuery<T>(sql, params);
  return rows.length ? rows[0] : null;
}
