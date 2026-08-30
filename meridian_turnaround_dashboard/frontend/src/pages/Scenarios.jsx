import { useEffect, useState, useCallback } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { api } from "../lib/api";
import { Loading, ErrorState, PageHeader, InsightNote } from "../components/Bits";

const SLIDERS = [
  { key: "revenueGrowthPct", label: "Revenue Growth", min: -5, max: 10, step: 0.5, unit: "%", default: 2 },
  { key: "priceChangePct", label: "Price Change", min: -5, max: 8, step: 0.5, unit: "%", default: 1.5 },
  { key: "costReductionPct", label: "Cost Reduction", min: 0, max: 15, step: 0.5, unit: "%", default: 5 },
  { key: "capacityUtilPct", label: "Capacity Utilization Improvement", min: 0, max: 25, step: 1, unit: " pts", default: 12 },
  { key: "wcImprovementPct", label: "Working Capital Improvement", min: 0, max: 25, step: 1, unit: "%", default: 10 },
];

export default function Scenarios() {
  const [inputs, setInputs] = useState(() => Object.fromEntries(SLIDERS.map((s) => [s.key, s.default])));
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback((payload) => {
    setLoading(true);
    api.scenario(payload)
      .then((r) => { setResult(r); setErr(null); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { run(inputs); }, []); // eslint-disable-line

  function handleChange(key, value) {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    run(next);
  }

  const chartData = result ? [
    { metric: "Revenue ($M)", "Base Case": result.baseCase.revenue, "Turnaround Case": result.turnaroundCase.revenue },
    { metric: "EBITDA ($M)", "Base Case": result.baseCase.ebitda, "Turnaround Case": result.turnaroundCase.ebitda },
    { metric: "Cash ($M)", "Base Case": result.baseCase.cashPosition, "Turnaround Case": result.turnaroundCase.cashPosition },
  ] : [];

  return (
    <div>
      <PageHeader kicker="Scenario Simulator" title="Base Case vs. Turnaround Case" />

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Levers (applied to FY2025 baseline)</div>
          {SLIDERS.map((s) => (
            <div className="slider-row" key={s.key}>
              <label>
                <span>{s.label}</span>
                <span className="slider-value">{inputs[s.key]}{s.unit}</span>
              </label>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={inputs[s.key]}
                onChange={(e) => handleChange(s.key, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>

        {err ? <ErrorState message={err} /> : !result ? <Loading /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="stat-tile">
              <div className="stat-label">Turnaround Score — Base Case</div>
              <div className="stat-value" style={{ color: "var(--bad)" }}>{result.baseCase.turnaroundScore}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Turnaround Score — Turnaround Case</div>
              <div className="stat-value" style={{ color: "var(--good)" }}>{result.turnaroundCase.turnaroundScore}</div>
              <div className="stat-delta up">+{result.delta.turnaroundScore} pts vs. base case</div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-chart-note section-block">
            <div className="card">
              <div className="card-title">Projected Outcome — Next 12 Months</div>
              <div className="chart-wrap">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Base Case" fill="#c9c4b5" radius={[3, 3, 0, 0]} barSize={38} />
                    <Bar dataKey="Turnaround Case" fill="#9c5a34" radius={[3, 3, 0, 0]} barSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <InsightNote title="What changes are required for recovery?">
              With no intervention, the base case shows EBITDA margin continuing to compress and cash position
              flat-to-declining. The current lever settings imply an EBITDA margin of{" "}
              {result.turnaroundCase.ebitdaMarginPct.toFixed(1)}% and ${result.turnaroundCase.cashGenerated.toFixed(1)}M
              of cash released from working capital improvement.
            </InsightNote>
          </div>

          <div className="card">
            <div className="card-title">Detail</div>
            <table className="data-table">
              <thead>
                <tr><th>Metric</th><th className="num">Base Case</th><th className="num">Turnaround Case</th><th className="num">Delta</th></tr>
              </thead>
              <tbody>
                <tr><td>Revenue</td><td className="num">${result.baseCase.revenue}M</td><td className="num">${result.turnaroundCase.revenue}M</td><td className="num">{result.delta.revenue >= 0 ? "+" : ""}{result.delta.revenue}M</td></tr>
                <tr><td>EBITDA</td><td className="num">${result.baseCase.ebitda}M</td><td className="num">${result.turnaroundCase.ebitda}M</td><td className="num">{result.delta.ebitda >= 0 ? "+" : ""}{result.delta.ebitda}M</td></tr>
                <tr><td>EBITDA Margin</td><td className="num">{result.baseCase.ebitdaMarginPct}%</td><td className="num">{result.turnaroundCase.ebitdaMarginPct}%</td><td className="num">{result.delta.ebitdaMarginPct >= 0 ? "+" : ""}{result.delta.ebitdaMarginPct} pts</td></tr>
                <tr><td>Cash Position</td><td className="num">${result.baseCase.cashPosition}M</td><td className="num">${result.turnaroundCase.cashPosition}M</td><td className="num">—</td></tr>
                <tr><td>Turnaround Score</td><td className="num">{result.baseCase.turnaroundScore}</td><td className="num">{result.turnaroundCase.turnaroundScore}</td><td className="num">+{result.delta.turnaroundScore}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
