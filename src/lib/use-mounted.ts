"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true only after the component has mounted on the client.
 *
 * Uses `useSyncExternalStore` so that:
 * 1. Server snapshot returns `false`.
 * 2. Client hydration snapshot returns `false` (exact match, preventing hydration mismatches).
 * 3. Immediately after hydration, returns `true` and renders client-only elements.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
