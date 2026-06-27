"use client";

/* eslint-disable @next/next/no-img-element */

import { Label } from "@/components/ui";
import { ImagePlus } from "lucide-react";
import { useState } from "react";

export function LogoUploadField({
  currentLogoUrl,
  merchantName
}: {
  currentLogoUrl?: string | null;
  merchantName: string;
}) {
  const [preview, setPreview] = useState(currentLogoUrl ?? "");

  return (
    <div className="space-y-3">
      <Label>Business logo</Label>
      <label className="flex cursor-pointer flex-col items-center gap-4 rounded-[20px] border border-dashed border-line bg-[#FAF8F4] p-6 text-center transition hover:border-amber hover:bg-[#FFF9F1] sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-cream text-amber">
          {preview ? (
            <img
              src={preview}
              alt={`${merchantName} logo preview`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-7 w-7" />
          )}
        </div>
        <span className="min-w-0">
          <span className="block text-sm font-extrabold text-ink">
            Drop a logo here or choose a file
          </span>
          <span className="mt-1 block text-sm text-muted">
            PNG, JPG, or WebP. It appears on customer receipts.
          </span>
        </span>
        <input
          name="logo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setPreview(URL.createObjectURL(file));
            }
          }}
        />
      </label>
    </div>
  );
}
