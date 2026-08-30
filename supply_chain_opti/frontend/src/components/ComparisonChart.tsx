import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { OptimizationResult } from "../types";

export default function ComparisonChart({
  base,
  scenario,
  baseLabel = "Base Baseline",
  scenarioLabel = "Simulated Scenario",
}: {
  base: OptimizationResult;
  scenario: OptimizationResult;
  baseLabel?: string;
  scenarioLabel?: string;
}) {
  const rows = [
    {
      metric: "Total Cost (\u20b9k)",
      [baseLabel]: Math.round((base.total_cost ?? 0) / 1000),
      [scenarioLabel]: Math.round((scenario.total_cost ?? 0) / 1000),
    },
    {
      metric: "Service Level (%)",
      [baseLabel]: Number(base.service_level_pct.toFixed(1)),
      [scenarioLabel]: Number(scenario.service_level_pct.toFixed(1)),
    },
    {
      metric: "Plant Util (%)",
      [baseLabel]: Number(base.avg_plant_utilization_pct.toFixed(1)),
      [scenarioLabel]: Number(scenario.avg_plant_utilization_pct.toFixed(1)),
    },
    {
      metric: "Warehouse Util (%)",
      [baseLabel]: Number(base.avg_warehouse_utilization_pct.toFixed(1)),
      [scenarioLabel]: Number(scenario.avg_warehouse_utilization_pct.toFixed(1)),
    },
    {
      metric: "Unmet Demand",
      [baseLabel]: base.total_unmet,
      [scenarioLabel]: scenario.total_unmet,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={rows} margin={{ left: 0, right: 12, top: 10, bottom: 45 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
        <XAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          angle={-20}
          textAnchor="end"
          interval={0}
          height={65}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "rgba(0, 242, 254, 0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#F1F5F9", paddingTop: 10 }} />
        <Bar dataKey={baseLabel} fill="#38BDF8" radius={[6, 6, 0, 0]} barSize={20} />
        <Bar dataKey={scenarioLabel} fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
