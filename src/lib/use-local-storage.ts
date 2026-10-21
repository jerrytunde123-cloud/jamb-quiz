"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Read a value from localStorage that stays in sync with the browser.
 *
 * `useSyncExternalStore` is used instead of `useState` + `useEffect` because
 * the value lives outside React (in localStorage) and reading it must not
 * cause a cascading render.
 */
export function useLocalStorage(key: string, fallback = ""): [string, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      window.addEventListener("storage", onChange);
      window.addEventListener(`local-storage:${key}`, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(`local-storage:${key}`, onChange);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        /* storage unavailable (private mode, quota) — ignore */
      }
      // Notify this tab as well as other tabs.
      window.dispatchEvent(new Event(`local-storage:${key}`));
    },
    [key]
  );

  return [value, setValue];
}
