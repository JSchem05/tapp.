"use server";

import { clearStaffDeviceSession, setStaffDeviceSession } from "@/lib/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Staff } from "@/lib/types";
import { redirect } from "next/navigation";

export async function loginWithStaffCode(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  if (!code) {
    redirect("/device?error=Enter%20your%20code");
  }

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("staff")
    .select("*")
    .eq("code", code)
    .maybeSingle<Staff>();

  if (!staff) {
    redirect("/device?error=Code%20not%20recognised");
  }

  await setStaffDeviceSession({
    staffId: staff.id,
    staffName: staff.name,
    merchantId: staff.merchant_id
  });

  redirect("/staff");
}

export async function logoutStaffDevice() {
  await clearStaffDeviceSession();
  redirect("/login");
}
