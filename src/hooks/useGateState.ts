"use client";

import { useState, useCallback, useMemo } from "react";

type GateStep = "gate" | "nickname" | "unlocked";

interface UseGateStateReturn {
  step: GateStep;
  goToNickname: () => void;
  unlock: (nickname: string) => void;
  close: () => void;
  reset: () => void;
}

/**
 * Hook for managing the gate modal state machine.
 * Transitions: gate -> nickname -> unlocked (callback)
 */
export function useGateState(
  onUnlocked: (nickname: string) => void,
  onClose?: () => void
): UseGateStateReturn {
  const [step, setStep] = useState<GateStep>("gate");

  const goToNickname = useCallback(() => {
    setStep("nickname");
  }, []);

  const unlock = useCallback(
    (nickname: string) => {
      setStep("unlocked");
      onUnlocked(nickname);
    },
    [onUnlocked]
  );

  const close = useCallback(() => {
    setStep("gate");
    onClose?.();
  }, [onClose]);

  const reset = useCallback(() => {
    setStep("gate");
  }, []);

  return useMemo(
    () => ({
      step,
      goToNickname,
      unlock,
      close,
      reset,
    }),
    [step, goToNickname, unlock, close, reset]
  );
}