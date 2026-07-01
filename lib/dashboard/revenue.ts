import type { Receipt } from "@/lib/types";

export type RevenueReceipt = Pick<Receipt, "created_at" | "total">;

export function getRevenueChartStartDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildRevenueData(receipts: RevenueReceipt[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = getMonthKey(month);

    return {
      key,
      month: new Intl.DateTimeFormat("en-MT", { month: "short" }).format(month),
      revenue: 0
    };
  });
  const revenueByMonth = new Map(months.map((month) => [month.key, month.revenue]));

  receipts.forEach((receipt) => {
    const key = getMonthKey(new Date(receipt.created_at));
    if (!revenueByMonth.has(key)) return;

    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(receipt.total));
  });

  return months.map(({ key, month }) => ({
    month,
    revenue: revenueByMonth.get(key) ?? 0
  }));
}

export function revenueForMonth(receipts: RevenueReceipt[], monthOffset: number) {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const key = getMonthKey(month);

  return receipts
    .filter((receipt) => {
      const created = new Date(receipt.created_at);
      return getMonthKey(created) === key;
    })
    .reduce((sum, receipt) => sum + Number(receipt.total), 0);
}
