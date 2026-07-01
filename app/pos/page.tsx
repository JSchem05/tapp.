import { PosScreen } from "@/components/pos-screen";
import { loadPosAppData } from "@/lib/pos/app-data";
import { getOwnerContext } from "@/lib/merchant-context";

export const dynamic = "force-dynamic";

export default async function PosPage({
  searchParams
}: {
  searchParams?: {
    view?: string;
    tab?: string;
    tag?: string;
    error?: string;
    saved?: string;
  };
}) {
  const { supabase, merchant } = await getOwnerContext();
  const data = await loadPosAppData(supabase, merchant, "owner");

  return (
    <PosScreen
      merchant={merchant}
      data={data}
      mode="owner"
      searchParams={searchParams}
    />
  );
}
