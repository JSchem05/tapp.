"use server";

import { clearDeviceSession, setDeviceSession } from "@/lib/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginWithDeviceCode(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  if (!code) {
    redirect("/device?error=Enter%20your%20business%20code");
  }

  const admin = createAdminClient();
  const { data: ownerMatch } = await admin
    .from("merchants")
    .select("id")
    .eq("owner_code", code)
    .maybeSingle<{ id: string }>();

  if (ownerMatch) {
    await setDeviceSession({ merchantId: ownerMatch.id, role: "owner" });
    redirect("/dashboard");
  }

  const { data: staffMatch } = await admin
    .from("merchants")
    .select("id")
    .eq("staff_code", code)
    .maybeSingle<{ id: string }>();

  if (staffMatch) {
    await setDeviceSession({ merchantId: staffMatch.id, role: "staff" });
    redirect("/staff");
  }

  redirect("/device?error=Code%20not%20recognised");
}

export async function logoutDevice() {
  const supabase = createClient();
  await supabase.auth.signOut();
  await clearDeviceSession();
  redirect("/device");
}
