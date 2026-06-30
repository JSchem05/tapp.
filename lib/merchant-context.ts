import { getDeviceSessionFromCookies, type DeviceRole } from "@/lib/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export type MerchantContext = {
  merchant: Merchant;
  role: DeviceRole;
  supabase: SupabaseClient;
  authType: "supabase" | "device";
  userId?: string;
};

type MerchantContextOptions = {
  requireOwner?: boolean;
  requireStaff?: boolean;
  redirectTo?: string;
};

async function loadMerchantById(merchantId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .maybeSingle<Merchant>();
  if (error || !data) return null;
  return data;
}

export async function getMerchantContext(
  options: MerchantContextOptions = {}
): Promise<MerchantContext> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", user.id)
      .single<Merchant>();

    if (error || !merchant) {
      redirect("/login?error=Merchant%20profile%20not%20found");
    }

    if (options.requireStaff) {
      redirect("/dashboard");
    }

    return {
      merchant,
      role: "owner",
      supabase,
      authType: "supabase",
      userId: user.id
    };
  }

  const deviceSession = await getDeviceSessionFromCookies();
  if (!deviceSession) {
    redirect(options.redirectTo ?? "/device");
  }

  const merchant = await loadMerchantById(deviceSession.merchantId);
  if (!merchant) {
    redirect("/device?error=Business%20session%20expired");
  }

  if (options.requireOwner && deviceSession.role !== "owner") {
    redirect("/staff");
  }

  if (options.requireStaff && deviceSession.role !== "staff") {
    redirect("/dashboard");
  }

  return {
    merchant,
    role: deviceSession.role,
    supabase: createAdminClient(),
    authType: "device"
  };
}

export async function getOwnerContext() {
  return getMerchantContext({ requireOwner: true });
}

export async function getStaffContext() {
  return getMerchantContext({ requireStaff: true });
}
