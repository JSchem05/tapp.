import type { PosData } from "@/lib/pos/data";
import { loadPosData } from "@/lib/pos/data";
import {
  buildRevenueData,
  getRevenueChartStartDate,
  revenueForMonth,
  type RevenueReceipt
} from "@/lib/dashboard/revenue";
import type {
  Merchant,
  OpenTableOrder,
  PosConnection,
  Receipt,
  RestaurantTable,
  Staff,
  Tag
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PosView =
  | "pos"
  | "tables"
  | "receipts"
  | "analytics"
  | "settings";

export type PosAppData = {
  pos: PosData;
  tables: RestaurantTable[];
  openOrders: OpenTableOrder[];
  receipts: Receipt[];
  tags: Tag[];
  staffById: Record<string, string>;
  analytics: {
    totalRevenue: number;
    receiptsToday: number;
    avgTransaction: number;
    counterCount: number;
    monthlyRevenue: number;
    chartData: Array<{ month: string; revenue: number }>;
  };
  settings: {
    tags: Tag[];
    staff: Staff[];
    sumupConnection: PosConnection | null;
  };
};

export async function loadPosAppData(
  supabase: SupabaseClient,
  merchant: Merchant,
  mode: "owner" | "staff"
): Promise<PosAppData> {
  const pos = await loadPosData(supabase, merchant.id);
  const chartStartDate = getRevenueChartStartDate();
  const todayKey = new Date().toISOString().slice(0, 10);

  const [
    { data: tables },
    { data: openOrders },
    { data: allReceipts },
    { data: staffReceipts },
    { data: revenueReceipts },
    { data: staffMembers },
    { data: sumupConnection }
  ] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .returns<RestaurantTable[]>(),
    supabase
      .from("orders")
      .select("id, table_id, staff_id, items, created_at")
      .eq("merchant_id", merchant.id)
      .eq("status", "open")
      .not("table_id", "is", null)
      .returns<OpenTableOrder[]>(),
    mode === "owner"
      ? supabase
          .from("receipts")
          .select("*")
          .eq("merchant_id", merchant.id)
          .order("created_at", { ascending: false })
          .returns<Receipt[]>()
      : Promise.resolve({ data: [] as Receipt[] }),
    supabase
      .from("receipts")
      .select("*")
      .eq("merchant_id", merchant.id)
      .gte("created_at", `${todayKey}T00:00:00.000Z`)
      .order("created_at", { ascending: false })
      .returns<Receipt[]>(),
    mode === "owner"
      ? supabase
          .from("receipts")
          .select("created_at,total")
          .eq("merchant_id", merchant.id)
          .gte("created_at", chartStartDate.toISOString())
          .returns<RevenueReceipt[]>()
      : Promise.resolve({ data: [] as RevenueReceipt[] }),
    supabase.from("staff").select("id, name").eq("merchant_id", merchant.id),
    mode === "owner"
      ? supabase
          .from("pos_connections")
          .select("*")
          .eq("merchant_id", merchant.id)
          .eq("provider", "sumup")
          .maybeSingle<PosConnection>()
      : Promise.resolve({ data: null as PosConnection | null })
  ]);

  const staffById = Object.fromEntries(
    (staffMembers ?? []).map((member) => [member.id, member.name])
  );

  const receipts =
    mode === "owner" ? allReceipts ?? [] : staffReceipts ?? [];
  const chartReceipts = revenueReceipts ?? [];
  const totalRevenue = receipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
  const receiptsToday = receipts.filter((receipt) =>
    receipt.created_at.startsWith(todayKey)
  ).length;

  return {
    pos,
    tables: tables ?? [],
    openOrders: openOrders ?? [],
    receipts,
    tags: pos.tags,
    staffById,
    analytics: {
      totalRevenue,
      receiptsToday,
      avgTransaction: receipts.length ? totalRevenue / receipts.length : 0,
      counterCount: pos.tags.length,
      monthlyRevenue: revenueForMonth(chartReceipts, 0),
      chartData: buildRevenueData(chartReceipts)
    },
    settings: {
      tags: pos.tags,
      staff: pos.staff,
      sumupConnection: sumupConnection ?? null
    }
  };
}
