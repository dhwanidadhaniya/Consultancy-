import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { CostBreakdown } from "../types";
import { formatCurrency } from "../lib/utils";

const NEON_COLORS = ["#00F2FE", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#3B82F6"];

export default function CostBreakdownChart({ data }: { data: CostBreakdown }) {
  const rows = Object.entries(data)
    .filter(([k]) => k !== "unmet_penalty")
    .map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 25, top: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `\u20b9${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: "#F1F5F9", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), "Financial Cost"]}
          cursor={{ fill: "rgba(0, 242, 254, 0.05)" }}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
          {rows.map((_, i) => (
            <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
