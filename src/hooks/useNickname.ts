"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "jamb-quiz-nickname";

/**
 * Hook for managing user nickname with localStorage persistence.
 * Uses lazy initialization to avoid SSR mismatch and setState-in-effect.
 */
export function useNickname(): [
  string,
  (value: string) => void,
  () => string
] {
  // Lazy initializer - runs once on mount, reads from localStorage synchronously
  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  // Hydrated is true on client, false on server (SSR)
  const [hydrated] = useState(() => typeof window !== "undefined");

  const setNicknameValue = useCallback((value: string) => {
    setNickname(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage errors (private browsing, etc.)
    }
  }, []);

  const getFinalNickname = useCallback((): string => {
    return nickname.trim() || "Anonymous";
  }, [nickname]);

  // Return nickname only after hydration to avoid SSR mismatch
  return [hydrated ? nickname : "", setNicknameValue, getFinalNickname];
}