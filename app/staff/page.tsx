import { PosScreen } from "@/components/pos-screen";
import { loadPosAppData } from "@/lib/pos/app-data";
import { getStaffContext } from "@/lib/merchant-context";

export const dynamic = "force-dynamic";

export default async function StaffPosPage({
  searchParams
}: {
  searchParams?: { view?: string };
}) {
  const { supabase, merchant, staff } = await getStaffContext();
  const data = await loadPosAppData(supabase, merchant, "staff");

  return (
    <PosScreen
      merchant={merchant}
      data={data}
      mode="staff"
      staffName={staff.name}
      initialView={searchParams?.view}
    />
  );
}
