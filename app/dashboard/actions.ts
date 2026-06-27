"use server";

import { getAuthedMerchant } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logout() {
  const { supabase } = await getAuthedMerchant();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateMerchantSettings(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/dashboard/settings?error=Business%20name%20is%20required");
  }

  const { error } = await supabase
    .from("merchants")
    .update({ name })
    .eq("id", merchant.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/settings?saved=1");
}
