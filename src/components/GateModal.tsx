"use client";

import { ReactNode } from "react";

interface GateModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Modal wrapper for the gate flow. Handles backdrop click to close.
 */
export function GateModal({
  isOpen,
  onClose,
  children,
  className = "",
}: GateModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className={`gate ${className}`} id="gate" onClick={handleBackdropClick} onTouchStart={handleBackdropClick}>
      <div className="gate-card" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
        {onClose && (
          <button
            type="button"
            className="close-x"
            onClick={onClose}
            title="Close modal"
            aria-label="Close"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}