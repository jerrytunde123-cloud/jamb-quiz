"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "jamb_recent_subjects";
export const MAX_RECENTS = 4;

const EVENT_NAME = "local-storage:recent_subjects";

/** Read the stored array of recent subject slugs safely. */
export function getRecentSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === "string" && Boolean(s));
    }
  } catch {
    /* ignore corrupt localStorage */
  }
  return [];
}

/** Record a subject slug as recently accessed. Moves it to the front. */
export function addRecentSubject(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const current = getRecentSlugs();
    const updated = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX_RECENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    /* ignore storage quota errors */
  }
}

/** Clear all recently practiced subjects. */
export function clearRecentSubjects(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    /* ignore */
  }
}

/**
 * Reactive React hook that listens for changes to recent subjects
 * using useSyncExternalStore (safe for concurrent rendering, no cascading renders).
 */
export function useRecentSlugs(): [string[], (slug: string) => void, () => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener(EVENT_NAME, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(EVENT_NAME, onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
    } catch {
      return "[]";
    }
  }, []);

  const getServerSnapshot = useCallback(() => "[]", []);

  const rawJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let slugs: string[] = [];
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      slugs = parsed.filter((s): s is string => typeof s === "string" && Boolean(s));
    }
  } catch {
    slugs = [];
  }

  return [slugs, addRecentSubject, clearRecentSubjects];
}
