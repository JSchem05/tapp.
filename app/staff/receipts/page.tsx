import { StaffReceiptsList } from "@/app/staff/receipts/staff-receipts-list";
import { getStaffContext } from "@/lib/merchant-context";
import type { Receipt, Staff, Tag } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function StaffReceiptsPage() {
  const { supabase, merchant } = await getStaffContext();
  const baseUrl = getBaseUrl();
  const todayKey = new Date().toISOString().slice(0, 10);

  const [{ data: receipts }, { data: tags }, { data: staffMembers }] = await Promise.all([
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
      .returns<Tag[]>(),
    supabase
      .from("staff")
      .select("id, name")
      .eq("merchant_id", merchant.id)
      .returns<Pick<Staff, "id" | "name">[]>()
  ]);

  const staffById = Object.fromEntries(
    (staffMembers ?? []).map((member) => [member.id, member.name])
  );

  return (
    <StaffReceiptsList
      merchantName={merchant.name}
      receipts={receipts ?? []}
      tags={tags ?? []}
      staffById={staffById}
      baseUrl={baseUrl}
    />
  );
}
