/**
 * Lightweight Admin Authorization.
 * Authenticates against ADMIN_KEY in environment variables.
 */
export function getAdminKey(): string {
  return (process.env.ADMIN_KEY || "921d41819e9e90fde2e21521c8e4279d").trim();
}

export function isValidAdminKey(candidate?: string | null): boolean {
  if (!candidate) return false;
  return candidate.trim() === getAdminKey();
}
