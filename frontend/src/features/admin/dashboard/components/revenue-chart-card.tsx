"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenueChartPoint = {
  name: string;
  revenue: number;
};

type RevenueChartCardProps = {
  data: RevenueChartPoint[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function RevenueChartCard({ data }: RevenueChartCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
          Doanh thu 7 ngày qua
        </h3>
        <select className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <option>Tuần này</option>
          <option>Tháng này</option>
        </select>
      </div>
      <div className="h-[250px] w-full md:h-72">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={data}
            margin={{ bottom: 5, left: 0, right: 20, top: 5 }}
          >
            <CartesianGrid
              className="dark:stroke-slate-800"
              stroke="#f0f0f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="name"
              dy={10}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              dx={-10}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(value: number) => `${value / 1000000}M`}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                color: "#fff",
              }}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
            />
            <Line
              activeDot={{ fill: "#f97316", r: 8, strokeWidth: 0 }}
              dataKey="revenue"
              dot={{ fill: "#fff", r: 4, strokeWidth: 2 }}
              stroke="#f97316"
              strokeWidth={4}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
