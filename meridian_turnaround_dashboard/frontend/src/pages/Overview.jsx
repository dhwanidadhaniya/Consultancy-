import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { fmtM, fmtPct, fmtDelta } from "../lib/format";
import { Loading, ErrorState, PageHeader } from "../components/Bits";

function ScoreDial({ score, band }) {
  const color = band === "Healthy" ? "var(--good)" : band === "At Risk" ? "var(--warn)" : "var(--bad)";
  return (
    <div className="stat-tile" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div>
        <div className="stat-label">Turnaround Score</div>
        <div className="badge-score" style={{ color }}>{score}<span style={{ fontSize: 15, color: "var(--ink-faint)" }}>/100</span></div>
        <div className="stat-delta" style={{ color }}>{band}</div>
      </div>
    </div>
  );
}

function Tile({ label, value, delta }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className={`stat-delta ${delta.dir}`}>{delta.text}</div>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.kpis().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!data) return <Loading />;

  const { revenue, ebitda, ebitdaMarginPct, cashPosition, totalDebt, marketSharePct } = data;

  return (
    <div>
      <PageHeader kicker="Executive Overview" title="Company Turnaround Summary" />

      <div className="grid grid-kpis section-block">
        <ScoreDial score={data.turnaroundScore} band={data.turnaroundScoreBand} />
        <Tile label="Revenue" value={fmtM(revenue.current)} delta={fmtDelta(revenue.current, revenue.prior, { unit: "M" })} />
        <Tile label="EBITDA" value={fmtM(ebitda.current)} delta={fmtDelta(ebitda.current, ebitda.prior, { unit: "M" })} />
        <Tile label="EBITDA Margin" value={fmtPct(ebitdaMarginPct.current)} delta={fmtDelta(ebitdaMarginPct.current, ebitdaMarginPct.prior, { unit: " pts" })} />
      </div>
      <div className="grid grid-kpis section-block">
        <Tile label="Cash Position" value={fmtM(cashPosition.current)} delta={fmtDelta(cashPosition.current, cashPosition.prior, { unit: "M" })} />
        <Tile label="Total Debt" value={fmtM(totalDebt.current)} delta={fmtDelta(totalDebt.current, totalDebt.prior, { unit: "M", invert: true })} />
        <Tile label="Market Share" value={fmtPct(marketSharePct.current)} delta={fmtDelta(marketSharePct.current, marketSharePct.prior, { unit: " pts" })} />
        <div className="stat-tile" style={{ background: "var(--surface-sunken)", border: "1px dashed var(--border-strong)", boxShadow: "none" }}>
          <div className="stat-label">Leverage</div>
          <div className="stat-value">{(totalDebt.current / ebitda.current).toFixed(1)}x</div>
          <div className="stat-delta down">Debt / EBITDA — covenant risk above 6x</div>
        </div>
      </div>

      <div className="grid grid-3 section-block">
        <div className="card">
          <div className="card-title" style={{ color: "var(--bad)" }}>What is going wrong?</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.diagnosis.whatIsWrong.map((t, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-title" style={{ color: "var(--warn)" }}>Why is it happening?</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.diagnosis.whyItsHappening.map((t, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-title" style={{ color: "var(--good)" }}>What should management do?</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.diagnosis.whatToDo.map((t, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Reading this dashboard</div>
        <p className="muted" style={{ fontSize: 13 }}>
          This is a management-review view of Meridian's FY2025 position. Financials, Operations, and Strategy pages
          diagnose the root causes behind the summary above; the Turnaround Plan, Scenarios, and Implementation pages
          lay out and track the response. Figures are in USD millions unless noted otherwise.
        </p>
      </div>
    </div>
  );
}
