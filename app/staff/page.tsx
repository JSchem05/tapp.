import { PosScreen } from "@/components/pos-screen";
import { loadPosData } from "@/lib/pos/data";
import { getStaffContext } from "@/lib/merchant-context";

export const dynamic = "force-dynamic";

export default async function StaffPosPage() {
  const { supabase, merchant, staff } = await getStaffContext();
  const data = await loadPosData(supabase, merchant.id);

  return (
    <PosScreen
      merchantName={merchant.name}
      staffName={staff.name}
      data={data}
      mode="staff"
    />
  );
}
