import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { CustomerService } from "../types";
import { formatNumber } from "../lib/utils";

export default function DemandSupplyChart({ customers }: { customers: CustomerService[] }) {
  const rows = customers.map((c) => ({ name: c.name, Served: c.served, Unmet: c.unmet }));

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
          tickFormatter={formatNumber}
          tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number, name: string) => [formatNumber(v), name]}
          cursor={{ fill: "rgba(0, 242, 254, 0.05)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#F1F5F9", paddingTop: 10 }} />
        <Bar dataKey="Served" stackId="a" fill="#00F2FE" radius={[0, 0, 0, 0]} barSize={28} />
        <Bar dataKey="Unmet" stackId="a" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
