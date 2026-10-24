"use client";

interface ContinueButtonProps {
  disabled: boolean;
  onClick: () => void;
  label?: string;
}

/**
 * Continue button with lock/unlock icon based on disabled state.
 */
export function ContinueButton({
  disabled,
  onClick,
  label = "Continue to Quiz",
}: ContinueButtonProps) {
  return (
    <button
      className="continue-btn"
      id="continueBtn"
      disabled={disabled}
      onClick={onClick}
      aria-label={disabled ? "Join both channels to continue" : label}
    >
      <i
        className={`fas ${disabled ? "fa-lock" : "fa-unlock"}`}
        style={{ marginRight: 6 }}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}