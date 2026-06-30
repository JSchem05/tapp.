import { getStaffDeviceSessionFromCookies } from "@/lib/device-session";
import { createClient } from "@/lib/supabase/server";

export async function resolveMerchantIdForReceiptApi(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  const staffSession = await getStaffDeviceSessionFromCookies();
  return staffSession?.merchantId ?? null;
}
