"use client";

import { Card } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function PublicReceiptError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public-receipt] render error boundary", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-transparent px-4 py-5 sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <p className="text-3xl font-bold text-ink">Tapp.</p>
          <p className="mt-1 text-sm text-muted">Digital receipt</p>
        </div>
        <Card className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-ink">Receipt could not load</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
            Something went wrong while loading this receipt.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-ink px-4 text-sm font-bold text-white transition hover:bg-black"
          >
            Try again
          </button>
        </Card>
      </div>
    </main>
  );
}
