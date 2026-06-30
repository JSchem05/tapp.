"use server";

import { clearStaffDeviceSession } from "@/lib/device-session";
import { generateStaffCode } from "@/lib/device-codes";
import { getOwnerContext } from "@/lib/merchant-context";
import { createClient } from "@/lib/supabase/server";
import type { PosConnection } from "@/lib/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  await clearStaffDeviceSession();
  redirect("/login");
}

export async function updateMerchantSettings(formData: FormData) {
  const { supabase, merchant } = await getOwnerContext();
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
    .update({
      name,
      logo_url: logoUrl,
      tagline: optionalText(formData, "tagline"),
      phone: optionalText(formData, "phone"),
      website: optionalText(formData, "website"),
      instagram: normalizeInstagram(optionalText(formData, "instagram")),
      address: optionalText(formData, "address"),
      wifi_name: optionalText(formData, "wifi_name"),
      wifi_password: optionalText(formData, "wifi_password"),
      google_review_url: optionalText(formData, "google_review_url"),
      ad_headline: optionalText(formData, "ad_headline"),
      ad_subtext: optionalText(formData, "ad_subtext"),
      ad_cta_label: optionalText(formData, "ad_cta_label"),
      ad_cta_url: optionalText(formData, "ad_cta_url"),
      ad_bg_color: optionalText(formData, "ad_bg_color") ?? "#2563EB",
      loyalty_goal: optionalNumber(formData, "loyalty_goal") ?? 6,
      loyalty_reward: optionalText(formData, "loyalty_reward"),
      show_qr: checkboxOn(formData, "show_qr"),
      show_wifi: checkboxOn(formData, "show_wifi"),
      show_ad: checkboxOn(formData, "show_ad"),
      show_review: checkboxOn(formData, "show_review"),
      show_loyalty: checkboxOn(formData, "show_loyalty"),
      show_email_opt_in: checkboxOn(formData, "show_email_opt_in"),
      show_social: checkboxOn(formData, "show_social"),
      show_info: checkboxOn(formData, "show_info")
    })
    .eq("id", merchant.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/settings?saved=1");
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : null;
}

function optionalNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function checkboxOn(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function normalizeInstagram(value: string | null) {
  if (!value) return null;
  return value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
}

export async function createTag(formData: FormData) {
  const { supabase, merchant } = await getOwnerContext();
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
  const { supabase, merchant } = await getOwnerContext();
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
    .update({ is_latest: true, awaiting_items: false })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", tagId)
    .eq("id", receiptId);

  if (liveError) {
    redirect(`/dashboard?error=${encodeURIComponent(liveError.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?tag=${tagId}`);
}

export async function addStaffMember(formData: FormData) {
  const { supabase, merchant } = await getOwnerContext();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/dashboard/settings?error=Staff%20name%20is%20required");
  }

  const code = await nextUniqueStaffPersonalCode(supabase);

  const { error } = await supabase.from("staff").insert({
    merchant_id: merchant.id,
    name,
    code
  });

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}

export async function deleteStaffMember(formData: FormData) {
  const { supabase, merchant } = await getOwnerContext();
  const staffId = String(formData.get("staff_id") ?? "");

  if (!staffId) {
    redirect("/dashboard/settings?error=Staff%20member%20not%20found");
  }

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("merchant_id", merchant.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}

export async function connectSumUp() {
  const { merchant } = await getOwnerContext();
  const clientId = process.env.SUMUP_CLIENT_ID;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!clientId) {
    redirect("/dashboard/settings?error=Missing%20SUMUP_CLIENT_ID");
  }

  const statePayload = Buffer.from(
    JSON.stringify({
      merchantId: merchant.id,
      nonce: crypto.randomUUID()
    })
  ).toString("base64url");
  const redirectUri = `${appUrl}/api/sumup/callback`;
  const authUrl = new URL("https://api.sumup.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "payments user.app-settings transactions.history");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", statePayload);

  redirect(authUrl.toString());
}

export async function upsertSumUpConnection(input: {
  merchantId: string;
  accessToken: string;
  refreshToken?: string | null;
  externalMerchantId?: string | null;
}) {
  const { supabase, merchant } = await getOwnerContext();
  if (merchant.id !== input.merchantId) {
    throw new Error("Merchant mismatch");
  }

  const existing = await supabase
    .from("pos_connections")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("provider", "sumup")
    .maybeSingle<PosConnection>();

  if (existing.data) {
    const { error } = await supabase
      .from("pos_connections")
      .update({
        access_token: input.accessToken,
        refresh_token: input.refreshToken ?? null,
        external_merchant_id: input.externalMerchantId ?? null
      })
      .eq("id", existing.data.id)
      .eq("merchant_id", merchant.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("pos_connections").insert({
    merchant_id: merchant.id,
    provider: "sumup",
    access_token: input.accessToken,
    refresh_token: input.refreshToken ?? null,
    external_merchant_id: input.externalMerchantId ?? null
  });
  if (error) throw error;
}

async function nextUniqueStaffPersonalCode(
  supabase: Awaited<ReturnType<typeof getOwnerContext>>["supabase"]
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateStaffCode();
    const { data } = await supabase
      .from("staff")
      .select("id")
      .eq("code", code)
      .maybeSingle<{ id: string }>();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique staff code.");
}
