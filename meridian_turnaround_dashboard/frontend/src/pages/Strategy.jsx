import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from "recharts";
import { api } from "../lib/api";
import { Loading, ErrorState, PageHeader, InsightNote } from "../components/Bits";

function marginColor(m) {
  if (m < 0) return "#9c4234";
  if (m < 10) return "#a97a2f";
  return "#3f7350";
}

export default function Strategy() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.strategy().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!data) return <Loading />;

  const { productProfitability, customerProfitability, marketPosition, swot, rootCauseImpact } = data;

  return (
    <div>
      <PageHeader kicker="Strategic Diagnosis" title="Profitability, Position &amp; Root Causes" />

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Product-Line Margin (%) — Which lines destroy value?</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={productProfitability} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} unit="%" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="product" width={190} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <ReferenceLine x={0} stroke="var(--border-strong)" />
                <Bar dataKey="marginPct" radius={[0, 3, 3, 0]} barSize={22}>
                  {productProfitability.map((p) => <Cell key={p.product} fill={marginColor(p.marginPct)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>
          Custom Tooling &amp; Fixtures is the only product line operating at a loss (-3.2% margin), and has been
          since a 2022 pricing freeze that never accounted for rising engineering cost.
        </InsightNote>
      </div>

      <div className="section-block card">
        <div className="card-title">Product Profitability Detail</div>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th className="num">2025 Revenue</th><th className="num">Margin %</th><th>Trend</th><th>Note</th></tr>
          </thead>
          <tbody>
            {productProfitability.map((p) => (
              <tr key={p.product}>
                <td>{p.product}</td>
                <td className="num">${p.revenue2025.toFixed(1)}M</td>
                <td className="num" style={{ color: marginColor(p.marginPct), fontWeight: 600 }}>{p.marginPct.toFixed(1)}%</td>
                <td className="muted">{p.trend}</td>
                <td className="muted">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-block card">
        <div className="card-title">Customer Profitability &amp; Concentration</div>
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th className="num">2025 Revenue</th><th className="num">Margin %</th><th className="num">% of Revenue</th><th>Note</th></tr>
          </thead>
          <tbody>
            {customerProfitability.map((c) => (
              <tr key={c.customer}>
                <td>{c.customer}</td>
                <td className="num">${c.revenue2025.toFixed(1)}M</td>
                <td className="num" style={{ color: marginColor(c.marginPct), fontWeight: 600 }}>{c.marginPct.toFixed(1)}%</td>
                <td className="num">{c.concentrationPct.toFixed(1)}%</td>
                <td className="muted">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="two-col section-block">
        <div className="card">
          <div className="card-title">Market Position</div>
          <p style={{ fontSize: 13 }}>
            Market share has declined from <strong>{marketPosition.marketShare2021}%</strong> in 2021 to{" "}
            <strong>{marketPosition.marketShare2025}%</strong> in 2025, even as the addressable market has grown
            roughly {marketPosition.marketSizeGrowthPct}% per year — Meridian is losing share in a growing market.
          </p>
          <div className="card-title" style={{ marginTop: 14 }}>Competitive Pressure</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {marketPosition.competitivePressure.map((c, i) => (
              <li key={i} style={{ fontSize: 13, marginBottom: 6 }}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-title">SWOT Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--good)", marginBottom: 5 }}>STRENGTHS</div>
              {swot.strengths.map((s, i) => <div key={i} className="faint" style={{ marginBottom: 5, color: "var(--ink-soft)", fontSize: 12.5 }}>{s}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--bad)", marginBottom: 5 }}>WEAKNESSES</div>
              {swot.weaknesses.map((s, i) => <div key={i} className="faint" style={{ marginBottom: 5, color: "var(--ink-soft)", fontSize: 12.5 }}>{s}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent-2)", marginBottom: 5 }}>OPPORTUNITIES</div>
              {swot.opportunities.map((s, i) => <div key={i} className="faint" style={{ marginBottom: 5, color: "var(--ink-soft)", fontSize: 12.5 }}>{s}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--warn)", marginBottom: 5 }}>THREATS</div>
              {swot.threats.map((s, i) => <div key={i} className="faint" style={{ marginBottom: 5, color: "var(--ink-soft)", fontSize: 12.5 }}>{s}</div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Root Cause &rarr; Business Impact</div>
        {rootCauseImpact.map((r, i) => (
          <div className="root-cause-row" key={i}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.rootCause}</div>
            <div className="root-cause-arrow">&rarr;</div>
            <div>
              <div style={{ fontSize: 13 }}>{r.businessImpact}</div>
              <div className="tag-list" style={{ marginTop: 5 }}>
                <span className="tag">{r.linkedMetric}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
