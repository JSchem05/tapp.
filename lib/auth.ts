import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/lib/types";
import { redirect } from "next/navigation";

export async function getAuthedMerchant() {
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

  return { supabase, user, merchant };
}
