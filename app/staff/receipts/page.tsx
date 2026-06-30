import { StaffReceiptsList } from "@/app/staff/receipts/staff-receipts-list";
import { getStaffContext } from "@/lib/merchant-context";
import type { Receipt, Tag } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffReceiptsPage() {
  const { supabase, merchant } = await getStaffContext();
  const todayKey = new Date().toISOString().slice(0, 10);

  const [{ data: receipts }, { data: tags }] = await Promise.all([
    supabase
      .from("receipts")
      .select("*")
      .eq("merchant_id", merchant.id)
      .gte("created_at", `${todayKey}T00:00:00.000Z`)
      .order("created_at", { ascending: false })
      .returns<Receipt[]>(),
    supabase
      .from("tags")
      .select("*")
      .eq("merchant_id", merchant.id)
      .returns<Tag[]>()
  ]);

  return (
    <StaffReceiptsList receipts={receipts ?? []} tags={tags ?? []} />
  );
}
