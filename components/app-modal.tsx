"use client";

import { useModalLifecycle } from "@/lib/use-modal-lifecycle";
import { cn } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ModalScrollContext = createContext<React.RefObject<HTMLDivElement> | null>(null);

export function AppModal({
  open,
  onClose,
  resetKey,
  overlayClassName,
  containerClassName,
  zIndexClassName,
  ariaLabelledBy,
  children
}: {
  open: boolean;
  onClose: () => void;
  resetKey?: string | number | null;
  overlayClassName?: string;
  containerClassName?: string;
  zIndexClassName?: string;
  ariaLabelledBy?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const bodyScrollRef = useModalLifecycle<HTMLDivElement>(open, resetKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <ModalScrollContext.Provider value={bodyScrollRef}>
      <div
        className={cn("modal-overlay", zIndexClassName, overlayClassName)}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={cn("modal-container shadow-lift", containerClassName)}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
        >
          {children}
        </div>
      </div>
    </ModalScrollContext.Provider>,
    document.body
  );
}

export function AppModalHeader({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("modal-header", className)}>{children}</div>;
}

export function AppModalBody({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useContext(ModalScrollContext);

  return (
    <div ref={scrollRef ?? undefined} className={cn("modal-body", className)}>
      {children}
    </div>
  );
}

export function AppModalFooter({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("modal-footer", className)}>{children}</div>;
}
