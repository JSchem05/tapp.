"use server";

import { getAuthedMerchant } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function logout() {
  const { supabase } = await getAuthedMerchant();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateMerchantSettings(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const name = String(formData.get("name") ?? "").trim();
  const logo = formData.get("logo");

  if (!name) {
    redirect("/dashboard/settings?error=Business%20name%20is%20required");
  }

  let logoUrl = merchant.logo_url;

  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) {
      redirect("/dashboard/settings?error=Logo%20must%20be%20an%20image");
    }

    const extension = logo.name.split(".").pop()?.toLowerCase() ?? "png";
    const logoPath = `${merchant.id}/logo-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(logoPath, logo, {
        upsert: true,
        contentType: logo.type
      });

    if (uploadError) {
      redirect(`/dashboard/settings?error=${encodeURIComponent(uploadError.message)}`);
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(logoPath);
    logoUrl = data.publicUrl;
  }

  const { error } = await supabase
    .from("merchants")
    .update({ name, logo_url: logoUrl })
    .eq("id", merchant.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/settings?saved=1");
}

export async function createTag(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const label = String(formData.get("label") ?? "").trim();
  const rawCode = String(formData.get("tag_code") ?? "").trim();
  const tagCode =
    rawCode ||
    label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 10);

  if (!label || !tagCode) {
    redirect("/dashboard?error=Add%20a%20label%20and%20tag%20code");
  }

  const { error } = await supabase.from("tags").insert({
    merchant_id: merchant.id,
    label,
    tag_code: tagCode.toUpperCase()
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?tag_added=1");
}

export async function setReceiptLive(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const receiptId = String(formData.get("receipt_id") ?? "");
  const tagId = String(formData.get("tag_id") ?? "");

  if (!receiptId || !tagId) {
    redirect("/dashboard?error=Receipt%20or%20tag%20missing");
  }

  const { error: clearError } = await supabase
    .from("receipts")
    .update({ is_latest: false })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", tagId)
    .eq("is_latest", true);

  if (clearError) {
    redirect(`/dashboard?error=${encodeURIComponent(clearError.message)}`);
  }

  const { error: liveError } = await supabase
    .from("receipts")
    .update({ is_latest: true })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", tagId)
    .eq("id", receiptId);

  if (liveError) {
    redirect(`/dashboard?error=${encodeURIComponent(liveError.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?tag=${tagId}`);
}
