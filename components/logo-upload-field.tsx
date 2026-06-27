"use client";

/* eslint-disable @next/next/no-img-element */

import { Input, Label } from "@/components/ui";
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
      <div className="flex items-center gap-4">
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
        <Input
          name="logo"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setPreview(URL.createObjectURL(file));
            }
          }}
        />
      </div>
    </div>
  );
}
