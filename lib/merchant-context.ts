import { getStaffDeviceSessionFromCookies } from "@/lib/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Merchant, Staff } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export type OwnerContext = {
  merchant: Merchant;
  supabase: SupabaseClient;
  userId: string;
};

export type StaffContext = {
  merchant: Merchant;
  staff: Staff;
  supabase: SupabaseClient;
};

export type MerchantAccessContext = {
  merchant: Merchant;
  supabase: SupabaseClient;
  staff: Staff | null;
};

export async function getOwnerContext(): Promise<OwnerContext> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .single<Merchant>();

  if (error || !merchant) {
    redirect("/login?error=Merchant%20profile%20not%20found");
  }

  return { merchant, supabase, userId: user.id };
}

export async function getStaffContext(): Promise<StaffContext> {
  const session = await getStaffDeviceSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const [{ data: merchant }, { data: staff }] = await Promise.all([
    admin.from("merchants").select("*").eq("id", session.merchantId).maybeSingle<Merchant>(),
    admin
      .from("staff")
      .select("*")
      .eq("id", session.staffId)
      .eq("merchant_id", session.merchantId)
      .maybeSingle<Staff>()
  ]);

  if (!merchant || !staff) {
    redirect("/login?error=Staff%20session%20expired");
  }

  return { merchant, staff, supabase: admin };
}

export async function getMerchantAccessContext(): Promise<MerchantAccessContext> {
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

    return { merchant, supabase, staff: null };
  }

  const session = await getStaffDeviceSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const [{ data: merchant }, { data: staff }] = await Promise.all([
    admin.from("merchants").select("*").eq("id", session.merchantId).maybeSingle<Merchant>(),
    admin
      .from("staff")
      .select("*")
      .eq("id", session.staffId)
      .eq("merchant_id", session.merchantId)
      .maybeSingle<Staff>()
  ]);

  if (!merchant || !staff) {
    redirect("/login?error=Staff%20session%20expired");
  }

  return { merchant, supabase: admin, staff };
}
