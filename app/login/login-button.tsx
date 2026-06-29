"use client";

import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";

export function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4 text-sm font-bold text-white transition hover:bg-clay hover:shadow-lift disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Logging in..." : "Log in"}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
