"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

type BottomSheetProps = {
  title: string;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
  children: ReactNode;
};

export const BottomSheet = ({
  title,
  onClose,
  returnFocusTo,
  children,
}: BottomSheetProps) => {
  const sheetReference = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetReference.current?.focus();

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      returnFocusTo?.focus();
    };
  }, [onClose, returnFocusTo]);

  return (
    <div
      className="sheet-overlay"
      onPointerDown={(pointerEvent) => {
        if (pointerEvent.target === pointerEvent.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="bottom-sheet"
        ref={sheetReference}
        role="dialog"
        tabIndex={-1}
      >
        <div aria-hidden="true" className="bottom-sheet-handle" />
        <header className="bottom-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button
            aria-label={`關閉${title}`}
            className="bottom-sheet-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
};
