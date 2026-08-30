import { useEffect, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, PieChart, Pie, Cell,
} from "recharts";
import { api } from "../lib/api";
import { Loading, ErrorState, PageHeader, InsightNote } from "../components/Bits";

const COST_COLORS = ["#9c5a34", "#34506a", "#a97a2f", "#3f7350", "#9c4234", "#8b9186"];

export default function Financials() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.financials().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!data) return <Loading />;

  const { years, series, insights } = data;
  const revEbitda = years.map((y, i) => ({
    year: y,
    Revenue: series.revenue[i],
    EBITDA: series.ebitda[i],
    "EBITDA Margin %": series.ebitdaMarginPct[i],
  }));
  const marginTrend = years.map((y, i) => ({
    year: y,
    "Gross Margin %": series.grossMarginPct[i],
    "EBITDA Margin %": series.ebitdaMarginPct[i],
  }));
  const cashDebt = years.map((y, i) => ({
    year: y,
    Cash: series.cashPosition[i],
    Debt: series.totalDebt[i],
    "Operating Cash Flow": series.operatingCashFlow[i],
  }));
  const wc = years.map((y, i) => ({
    year: y,
    Inventory: series.inventoryValue[i],
    Receivables: series.receivables[i],
    Payables: -series.payables[i],
  }));
  const costData = Object.entries(series.costBreakdown2025).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <PageHeader kicker="Financial Diagnosis" title="Revenue, Margin &amp; Cash Trends" />

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Revenue vs. EBITDA ($M)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <ComposedChart data={revEbitda} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Revenue" fill="#c9c4b5" radius={[3, 3, 0, 0]} barSize={28} />
                <Line type="monotone" dataKey="EBITDA" stroke="#9c5a34" strokeWidth={2.4} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>{insights.revenueTrend}</InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Gross Margin vs. EBITDA Margin (%)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <ComposedChart data={marginTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Gross Margin %" stroke="#34506a" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="EBITDA Margin %" stroke="#9c4234" strokeWidth={2.2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>{insights.grossMargin} {insights.ebitda}</InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Cash Position vs. Total Debt ($M)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <ComposedChart data={cashDebt} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Cash" stroke="#3f7350" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Debt" stroke="#9c4234" strokeWidth={2.2} dot={{ r: 3 }} />
                <Bar dataKey="Operating Cash Flow" fill="#d7d2c2" radius={[3, 3, 0, 0]} barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>{insights.cashFlow} {insights.debt}</InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Working Capital Components ($M)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={wc} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Inventory" stackId="a" fill="#9c5a34" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Receivables" stackId="a" fill="#34506a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Payables" stackId="a" fill="#c9c4b5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>{insights.workingCapital}</InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">2025 Cost Structure ($M)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={costData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={1.5}>
                  {costData.map((entry, i) => (
                    <Cell key={entry.name} fill={COST_COLORS[i % COST_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote title="Where can management cut costs?">
          Raw materials and direct labor make up nearly two-thirds of cost of goods sold. Scrap &amp; rework at $5.9M
          is the fastest-growing line item and the most directly addressable through the automated-inspection
          initiative on the Turnaround Plan.
        </InsightNote>
      </div>
    </div>
  );
}
