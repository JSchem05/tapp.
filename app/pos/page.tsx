import { PosScreen } from "@/components/pos-screen";
import { loadPosData } from "@/lib/pos/data";
import { getOwnerContext } from "@/lib/merchant-context";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const { supabase, merchant } = await getOwnerContext();
  const data = await loadPosData(supabase, merchant.id);

  return <PosScreen merchantName={merchant.name} data={data} mode="owner" />;
}
