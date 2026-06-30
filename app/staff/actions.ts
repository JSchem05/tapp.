"use server";

import { getStaffContext } from "@/lib/merchant-context";
import type { Tag } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function setReceiptLiveInstant(receiptId: string) {
  const { supabase, merchant } = await getStaffContext();

  const { data: receipt } = await supabase
    .from("receipts")
    .select("id, tag_id")
    .eq("id", receiptId)
    .eq("merchant_id", merchant.id)
    .eq("awaiting_items", false)
    .maybeSingle<{ id: string; tag_id: string }>();

  if (!receipt) {
    throw new Error("Receipt not found.");
  }

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("id", receipt.tag_id)
    .eq("merchant_id", merchant.id)
    .single<Tag>();

  const { error: clearError } = await supabase
    .from("receipts")
    .update({ is_latest: false })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", receipt.tag_id)
    .eq("is_latest", true);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: liveError } = await supabase
    .from("receipts")
    .update({ is_latest: true, awaiting_items: false })
    .eq("merchant_id", merchant.id)
    .eq("id", receipt.id);

  if (liveError) {
    throw new Error(liveError.message);
  }

  if (!tag) {
    throw new Error("Counter not found.");
  }

  revalidatePath("/staff/receipts");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/receipts");

  return { tagLabel: tag.label };
}
