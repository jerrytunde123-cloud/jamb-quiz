"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import type { Channel } from "@/lib/constants";

type ChannelStatus = "idle" | "pending" | "done";

interface UseWhatsAppChannelReturn {
  status: ChannelStatus;
  secondsLeft: number;
  join: () => void;
  reset: () => void;
}

const COUNTDOWN_SECONDS = 5;

/**
 * Hook for managing a single WhatsApp channel join flow.
 * Handles countdown timer and status transitions.
 */
export function useWhatsAppChannel(): UseWhatsAppChannelReturn {
  const [status, setStatus] = useState<ChannelStatus>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef(false);

  // Complete the join - defined first so effects can reference it
  const completeJoin = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = false;
    setSecondsLeft(0);
    setStatus("done");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle visibility change - complete pending when user returns
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && pendingRef.current) {
        completeJoin();
      }
    };
    const onFocus = () => {
      if (pendingRef.current) {
        completeJoin();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
    };
  }, [completeJoin]);

  const join = useCallback(() => {
    if (status !== "idle") return;

    pendingRef.current = true;
    setStatus("pending");
    setSecondsLeft(COUNTDOWN_SECONDS);

    let sec = COUNTDOWN_SECONDS;
    timerRef.current = setInterval(() => {
      sec--;
      if (sec <= 0) {
        completeJoin();
      } else {
        setSecondsLeft(sec);
      }
    }, 1000);
  }, [status, completeJoin]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = false;
    setStatus("idle");
    setSecondsLeft(0);
  }, []);

  return { status, secondsLeft, join, reset };
}

/**
 * Hook for managing multiple WhatsApp channels at once.
 * Manages all channel states internally.
 */
export function useWhatsAppChannels(channels: readonly Channel[]) {
  // Lazy initialization - build initial state from channels array
  const [channelStates, setChannelStates] = useState<
    Record<string, { status: ChannelStatus; secondsLeft: number }>
  >(() => {
    const initial: Record<string, { status: ChannelStatus; secondsLeft: number }> = {};
    channels.forEach((c) => {
      initial[c.id] = { status: "idle", secondsLeft: 0 };
    });
    return initial;
  });

  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const pendingRef = useRef<Set<string>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearInterval(t));
      timersRef.current = {};
    };
  }, []);

  // Handle visibility change - complete pending when user returns
  useEffect(() => {
    const completePending = () => {
      pendingRef.current.forEach((chId) => {
        const timer = timersRef.current[chId];
        if (timer) {
          clearInterval(timer);
          delete timersRef.current[chId];
        }
        pendingRef.current.delete(chId);
        setChannelStates((prev) => ({
          ...prev,
          [chId]: { status: "done", secondsLeft: 0 },
        }));
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") completePending();
    };
    const onFocus = () => completePending();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
    };
  }, []);

  const joinChannel = useCallback(
    (channelId: Channel["id"]) => {
      setChannelStates((prev) => {
        const current = prev[channelId];
        if (current && (current.status === "pending" || current.status === "done")) {
          return prev;
        }

        pendingRef.current.add(channelId);

        let sec = COUNTDOWN_SECONDS;
        const next = { ...prev, [channelId]: { status: "pending" as ChannelStatus, secondsLeft: sec } };

        const timer = setInterval(() => {
          sec--;
          if (sec <= 0) {
            clearInterval(timer);
            delete timersRef.current[channelId];
            pendingRef.current.delete(channelId);
            setChannelStates((p) => ({ ...p, [channelId]: { status: "done", secondsLeft: 0 } }));
          } else {
            setChannelStates((p) => ({ ...p, [channelId]: { status: "pending" as ChannelStatus, secondsLeft: sec } }));
          }
        }, 1000);

        timersRef.current[channelId] = timer;

        return next;
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    Object.values(timersRef.current).forEach((t) => clearInterval(t));
    timersRef.current = {};
    pendingRef.current.clear();
    setChannelStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { status: "idle", secondsLeft: 0 };
      });
      return next;
    });
  }, []);

  const allReady = channels.every((c) => channelStates[c.id]?.status === "done");
  const anyPending = channels.some((c) => channelStates[c.id]?.status === "pending");

  return {
    channels: channels.map((c) => ({
      ...c,
      status: channelStates[c.id]?.status ?? ("idle" as ChannelStatus),
      secondsLeft: channelStates[c.id]?.secondsLeft ?? 0,
    })),
    allReady,
    anyPending,
    joinChannel,
    resetAll,
  };
}