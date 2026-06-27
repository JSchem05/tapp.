"use server";

import { getAuthedMerchant } from "@/lib/auth";
import { calculateReceiptTotals } from "@/lib/money";
import type { PaymentMethod, ReceiptItem, Tag } from "@/lib/types";
import { redirect } from "next/navigation";

const PAYMENT_METHODS = new Set(["Card", "Cash", "Other"]);

export async function createReceipt(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const tagId = String(formData.get("tag_id") ?? "");
  const paymentMethod = String(formData.get("payment_method") ?? "Card");
  const rawItems = String(formData.get("items") ?? "[]");

  if (!tagId) {
    redirect("/dashboard/receipt/new?error=Select%20an%20NFC%20puck");
  }

  if (!PAYMENT_METHODS.has(paymentMethod)) {
    redirect("/dashboard/receipt/new?error=Choose%20a%20valid%20payment%20method");
  }

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("id", tagId)
    .eq("merchant_id", merchant.id)
    .single<Tag>();

  if (!tag) {
    redirect("/dashboard/receipt/new?error=Selected%20tag%20was%20not%20found");
  }

  let parsedItems: ReceiptItem[];
  try {
    parsedItems = JSON.parse(rawItems) as ReceiptItem[];
  } catch {
    redirect("/dashboard/receipt/new?error=Receipt%20items%20could%20not%20be%20read");
  }

  const items = parsedItems
    .map((item) => ({
      name: String(item.name ?? "").trim(),
      qty: Number(item.qty),
      price: Number(item.price)
    }))
    .filter((item) => item.name && item.qty > 0 && item.price >= 0);

  if (items.length === 0) {
    redirect("/dashboard/receipt/new?error=Add%20at%20least%20one%20receipt%20item");
  }

  const totals = calculateReceiptTotals(items);

  const { error: updateError } = await supabase
    .from("receipts")
    .update({ is_latest: false })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", tag.id)
    .eq("is_latest", true);

  if (updateError) {
    redirect(`/dashboard/receipt/new?error=${encodeURIComponent(updateError.message)}`);
  }

  const { data: receipt, error: insertError } = await supabase
    .from("receipts")
    .insert({
      merchant_id: merchant.id,
      tag_id: tag.id,
      items,
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
      payment_method: paymentMethod as PaymentMethod,
      is_latest: true
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !receipt) {
    redirect(
      `/dashboard/receipt/new?error=${encodeURIComponent(
        insertError?.message ?? "Receipt could not be saved"
      )}`
    );
  }

  redirect(`/dashboard/receipt/new?receipt=${receipt.id}`);
}
