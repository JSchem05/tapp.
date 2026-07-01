"use client";

import { RevenueChart } from "@/app/dashboard/revenue-chart";
import { formatCurrency } from "@/lib/money";

export function PosAnalyticsPanel({
  merchantName,
  totalRevenue,
  receiptsToday,
  avgTransaction,
  counterCount,
  monthlyRevenue,
  chartData
}: {
  merchantName: string;
  totalRevenue: number;
  receiptsToday: number;
  avgTransaction: number;
  counterCount: number;
  monthlyRevenue: number;
  chartData: Array<{ month: string; revenue: number }>;
}) {
  return (
    <div className="h-full overflow-y-auto bg-cream px-6 py-6">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Overview for {merchantName}</p>
      </div>

      <section className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          dark
          label="Total Revenue"
          trend={`+${formatCurrency(monthlyRevenue)} this month`}
          value={formatCurrency(totalRevenue)}
        />
        <StatCard
          label="Receipts today"
          trend={`${receiptsToday} recorded today`}
          value={String(receiptsToday)}
        />
        <StatCard
          label="Avg transaction"
          trend="Across all receipts"
          value={formatCurrency(avgTransaction)}
        />
        <StatCard
          label="Active counters"
          trend={`${counterCount} ready for NFC`}
          value={String(counterCount)}
        />
      </section>

      <section className="rounded-[16px] border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-5 text-base font-semibold text-ink">Total Revenue</h2>
        <RevenueChart data={chartData} />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  dark = false
}: {
  label: string;
  value: string;
  trend: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[16px] p-6 ${
        dark
          ? "bg-ink text-white"
          : "border border-line bg-white text-ink shadow-soft"
      }`}
    >
      <p className={`text-[13px] font-medium ${dark ? "text-white/60" : "text-muted"}`}>
        {label}
      </p>
      <p className={`mt-3 font-bold leading-none ${dark ? "text-[32px]" : "text-[28px]"}`}>
        {value}
      </p>
      <p className={`mt-3 text-xs font-semibold ${dark ? "text-emerald-400" : "text-sage"}`}>
        {trend}
      </p>
    </section>
  );
}
