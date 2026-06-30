"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function RevenueChart({
  data
}: {
  data: { month: string; revenue: number }[];
}) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 0);
  const yAxisMax = getNiceAxisMax(maxRevenue);
  const yAxisTicks = getAxisTicks(yAxisMax);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          barCategoryGap="32%"
          data={data}
          margin={{ top: 8, right: 10, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            interval={0}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            allowDecimals={false}
            domain={[0, yAxisMax]}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }}
            tickFormatter={formatAxisValue}
            ticks={yAxisTicks}
            width={54}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 41, 0.04)" }}
            contentStyle={{
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              boxShadow: "var(--shadow)"
            }}
            formatter={(value) => [`€${Number(value).toFixed(2)}`, "Revenue"]}
          />
          <Bar
            dataKey="revenue"
            fill="#333333"
            maxBarSize={46}
            radius={[10, 10, 4, 4]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function getNiceAxisMax(maxRevenue: number) {
  if (maxRevenue <= 0) return 100;

  const roughStep = maxRevenue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceMultiplier =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const niceStep = niceMultiplier * magnitude;

  return Math.max(niceStep * 4, 4);
}

function getAxisTicks(maxValue: number) {
  const step = maxValue / 4;
  return Array.from({ length: 5 }, (_, index) => Math.round(step * index));
}

function formatAxisValue(value: number) {
  if (value >= 1000) {
    return `${Number(value / 1000).toLocaleString("en-MT", {
      maximumFractionDigits: value % 1000 === 0 ? 0 : 1
    })}K`;
  }

  return `${value}`;
}
