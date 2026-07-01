"use client";

import { useEffect, useRef } from "react";

let lockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

export function useModalLifecycle<T extends HTMLElement>(
  active = true,
  resetKey?: string | number | null
) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (!active) return;

    const resetScroll = () => {
      const node = scrollRef.current;
      if (!node) return;
      node.scrollTop = 0;
      node.scrollLeft = 0;
      node.scrollTo({ top: 0, left: 0 });
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [active, resetKey]);

  useEffect(() => {
    if (!active) return;

    lockDocumentScroll();
    return unlockDocumentScroll;
  }, [active]);

  return scrollRef;
}

function lockDocumentScroll() {
  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  lockCount += 1;
}

function unlockDocumentScroll() {
  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }
}
