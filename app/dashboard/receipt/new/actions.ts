"use server";

import { getOwnerContext } from "@/lib/merchant-context";
import { VAT_RATE, calculateReceiptTotals, roundMoney } from "@/lib/money";
import type { PaymentMethod, Receipt, ReceiptItem, Staff, Tag } from "@/lib/types";
import { redirect } from "next/navigation";

const PAYMENT_METHODS = new Set(["Card", "Cash", "Other"]);

export async function createReceipt(formData: FormData) {
  const { supabase, merchant } = await getOwnerContext();
  const tagId = String(formData.get("tag_id") ?? "");
  const paymentMethod = String(formData.get("payment_method") ?? "Card");
  const rawItems = String(formData.get("items") ?? "[]");
  const awaitingReceiptId = String(formData.get("awaiting_receipt_id") ?? "");
  const lockedTotal = Number(formData.get("locked_total") ?? NaN);
  const staffPinCode = String(formData.get("staff_pin_code") ?? "").trim();

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
  let staffId: string | null = null;
  if (staffPinCode) {
    if (!/^\d{4}$/.test(staffPinCode)) {
      redirect("/dashboard/receipt/new?error=Staff%20PIN%20must%20be%204%20digits");
    }
    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("merchant_id", merchant.id)
      .eq("pin_code", staffPinCode)
      .maybeSingle<Staff>();
    if (!staff) {
      redirect("/dashboard/receipt/new?error=Staff%20PIN%20was%20not%20recognized");
    }
    staffId = staff.id;
  }

  const { error: updateError } = await supabase
    .from("receipts")
    .update({ is_latest: false })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", tag.id)
    .eq("is_latest", true);

  if (updateError) {
    redirect(`/dashboard/receipt/new?error=${encodeURIComponent(updateError.message)}`);
  }

  if (awaitingReceiptId) {
    const { data: awaitingReceipt } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", awaitingReceiptId)
      .eq("merchant_id", merchant.id)
      .eq("awaiting_items", true)
      .single<Receipt>();

    if (!awaitingReceipt) {
      redirect("/dashboard/receipt/new?error=Awaiting%20receipt%20was%20not%20found");
    }

    const chargedTotal = Number.isFinite(lockedTotal) ? roundMoney(lockedTotal) : roundMoney(Number(awaitingReceipt.total));
    const chargedSubtotal = roundMoney(chargedTotal / (1 + VAT_RATE));
    const chargedVat = roundMoney(chargedTotal - chargedSubtotal);
    const { data: receipt, error: completeError } = await supabase
      .from("receipts")
      .update({
        items,
        subtotal: chargedSubtotal,
        vat: chargedVat,
        total: chargedTotal,
        payment_method: paymentMethod as PaymentMethod,
        staff_id: staffId,
        awaiting_items: false,
        is_latest: true
      })
      .eq("id", awaitingReceipt.id)
      .eq("merchant_id", merchant.id)
      .eq("tag_id", tag.id)
      .select("id")
      .single<{ id: string }>();

    if (completeError || !receipt) {
      redirect(
        `/dashboard/receipt/new?error=${encodeURIComponent(
          completeError?.message ?? "Awaiting receipt could not be completed"
        )}`
      );
    }

    redirect(`/dashboard/receipt/new?receipt=${receipt.id}`);
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
      staff_id: staffId,
      awaiting_items: false,
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
