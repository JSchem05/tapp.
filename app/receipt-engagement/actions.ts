"use server";

import { createPublicClient } from "@/lib/supabase/public";

type JoinReceiptOffersResult = {
  ok: boolean;
  message: string;
};

export async function joinReceiptOffers({
  merchantId,
  email
}: {
  merchantId: string;
  email: string;
}): Promise<JoinReceiptOffersResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!merchantId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = createPublicClient();
  const { error } = await supabase.from("customers").insert({
    merchant_id: merchantId,
    email: normalizedEmail
  });

  if (!error) {
    return { ok: true, message: "You're on the list." };
  }

  if (error.code === "23505") {
    return { ok: true, message: "You're already on the list." };
  }

  console.error("[receipt-opt-in] customer insert failed", error);
  return { ok: false, message: "Could not join right now. Try again soon." };
}
