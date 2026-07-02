"use client";

import { completePosOrder } from "@/app/pos/actions";
import type { PosOrderItem } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type QueuedOrderInput = {
  tagId: string;
  staffId?: string | null;
  tableId?: string | null;
  orderId?: string | null;
  items: PosOrderItem[];
  paymentMethod: "card" | "cash";
  status?: "open" | "completed";
};

type QueuedOrder = {
  id: string;
  queuedAt: number;
  attempts: number;
  input: QueuedOrderInput;
};

const STORAGE_KEY = "tapp_pos_offline_orders";
const MAX_ATTEMPTS = 8;
const RETRY_INTERVAL_MS = 20_000;

function readQueue(): QueuedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedOrder[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable — nothing else we can do client-side.
  }
}

export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch|fetch failed|network|connection|load failed|timed? ?out|ERR_INTERNET|ECONNREFUSED/i.test(
    message
  );
}

export function useOfflineOrderQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const flushing = useRef(false);

  const refreshCount = useCallback(() => {
    setPendingCount(readQueue().length);
  }, []);

  const enqueue = useCallback(
    (input: QueuedOrderInput) => {
      const queue = readQueue();
      queue.push({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        queuedAt: Date.now(),
        attempts: 0,
        input
      });
      writeQueue(queue);
      refreshCount();
    },
    [refreshCount]
  );

  const flush = useCallback(async () => {
    if (flushing.current) return;
    const queue = readQueue();
    if (queue.length === 0) {
      refreshCount();
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    flushing.current = true;
    setSyncing(true);
    try {
      for (const entry of queue) {
        try {
          await completePosOrder(entry.input);
          writeQueue(readQueue().filter((queued) => queued.id !== entry.id));
        } catch (error) {
          if (isNetworkError(error)) {
            // Still offline — stop and retry the whole queue later.
            break;
          }
          // Permanent failure (validation etc.). Count the attempt and give
          // up after MAX_ATTEMPTS so one bad order can't loop forever.
          const remaining = readQueue().map((queued) =>
            queued.id === entry.id
              ? { ...queued, attempts: queued.attempts + 1 }
              : queued
          );
          writeQueue(
            remaining.filter(
              (queued) => queued.id !== entry.id || queued.attempts < MAX_ATTEMPTS
            )
          );
        }
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      refreshCount();
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
    void flush();

    const handleOnline = () => void flush();
    window.addEventListener("online", handleOnline);
    const interval = window.setInterval(() => void flush(), RETRY_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.clearInterval(interval);
    };
  }, [flush, refreshCount]);

  return { pendingCount, syncing, enqueue, flush };
}
