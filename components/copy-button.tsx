"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { SecondaryButton } from "@/components/ui";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <SecondaryButton
      type="button"
      onClick={copy}
      className="h-9 px-3"
      title={value ? `Copy ${value}` : undefined}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span>{copied ? "Copied" : label}</span>
    </SecondaryButton>
  );
}
