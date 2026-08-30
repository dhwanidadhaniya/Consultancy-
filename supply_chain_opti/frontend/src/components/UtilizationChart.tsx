import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from "recharts";
import type { FacilityDecision } from "../types";
import { formatPercent } from "../lib/utils";

export default function UtilizationChart({ plants, warehouses }: { plants: FacilityDecision[]; warehouses: FacilityDecision[] }) {
  const rows = [
    ...plants.map((p) => ({ name: p.name, util: p.open ? p.utilization_pct : 0, open: p.open, kind: "Plant" })),
    ...warehouses.map((w) => ({ name: w.name, util: w.open ? w.utilization_pct : 0, open: w.open, kind: "Warehouse" })),
  ];

  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={rows} margin={{ left: 0, right: 12, top: 10, bottom: 35 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10.5, fill: "#94A3B8", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          angle={-25}
          textAnchor="end"
          interval={0}
          height={65}
        />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <ReferenceLine y={100} stroke="#F43F5E" strokeDasharray="4 4" label={{ value: "100% Max", fill: "#F43F5E", fontSize: 10, position: "top" }} />
        <Tooltip
          formatter={(v: number, _n, p: any) => [formatPercent(v), p.payload.open ? "Utilization" : "Closed by MIP Solver"]}
          cursor={{ fill: "rgba(0, 242, 254, 0.05)" }}
        />
        <Bar dataKey="util" radius={[6, 6, 0, 0]} barSize={26}>
          {rows.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={!entry.open ? "#F43F5E" : entry.kind === "Plant" ? "#8B5CF6" : "#10B981"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
