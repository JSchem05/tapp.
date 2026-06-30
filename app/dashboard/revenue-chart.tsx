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
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }}
            tickFormatter={(value) =>
              value === 0 ? "0" : `${Math.round(Number(value) / 1000)}K`
            }
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
          <Bar dataKey="revenue" fill="#333333" radius={[10, 10, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
