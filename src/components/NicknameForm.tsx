"use client";

import { useEffect, useRef } from "react";

interface NicknameFormProps {
  initialValue: string;
  onSubmit: (nickname: string) => void;
  onChange: (value: string) => void;
  subjectName: string;
}

/**
 * Nickname input form with auto-focus and Enter key submission.
 */
export function NicknameForm({
  initialValue,
  onSubmit,
  onChange,
  subjectName,
}: NicknameFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit(e.currentTarget.value);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3>Enter Your Nickname</h3>
      <p>This will appear on the {subjectName} leaderboard.</p>
      <input
        ref={inputRef}
        id="nicknameInput"
        className="nickname-input"
        maxLength={20}
        placeholder="e.g. Scholar01"
        value={initialValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="nickname"
        aria-label="Your nickname for the leaderboard"
      />
      <button className="continue-btn" onClick={() => onSubmit(initialValue)}>
        Start Quiz <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} aria-hidden="true" />
      </button>
    </div>
  );
}