import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorState, PageHeader, StatusPill } from "../components/Bits";
import { priorityClass } from "../lib/format";

const STAGE_INFO = {
  Stabilize: { window: "0–3 months", desc: "Cash preservation, cost controls, working capital." },
  Recover: { window: "3–9 months", desc: "Pricing, product mix, productivity, customer profitability." },
  Transform: { window: "9–18 months", desc: "Operating model, portfolio, supply chain and growth strategy." },
};

export default function TurnaroundPlan() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [stage, setStage] = useState("All");

  useEffect(() => {
    api.initiatives().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!data) return <Loading />;

  const stages = ["All", "Stabilize", "Recover", "Transform"];
  const list = stage === "All" ? data.list : data.byStage[stage];

  return (
    <div>
      <PageHeader kicker="Turnaround Strategy" title="Three-Stage Turnaround Plan" />

      <div className="grid grid-3 section-block">
        {Object.entries(STAGE_INFO).map(([name, info]) => (
          <div className="card" key={name}>
            <div className="card-title">{name.toUpperCase()} &middot; {info.window}</div>
            <p style={{ fontSize: 13 }}>{info.desc}</p>
            <div className="faint">{data.byStage[name].length} initiatives &middot; ${data.byStage[name].reduce((s, i) => s + i.expectedBenefitAnnual, 0).toFixed(1)}M expected annual benefit</div>
          </div>
        ))}
      </div>

      <div className="grid grid-kpis section-block">
        <div className="stat-tile">
          <div className="stat-label">Total Initiatives</div>
          <div className="stat-value">{data.summary.totalInitiatives}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Total Investment</div>
          <div className="stat-value">${data.summary.totalCost.toFixed(1)}M</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Expected Annual Benefit</div>
          <div className="stat-value">${data.summary.totalExpectedBenefit.toFixed(1)}M</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Realized to Date</div>
          <div className="stat-value">${data.summary.totalActualBenefit.toFixed(1)}M</div>
        </div>
      </div>

      <div className="filter-bar">
        {stages.map((s) => (
          <button key={s} className={`filter-chip ${stage === s ? "active" : ""}`} onClick={() => setStage(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Initiative</th>
              <th>Stage</th>
              <th>Owner</th>
              <th>Timeline</th>
              <th className="num">Cost</th>
              <th className="num">Benefit / yr</th>
              <th>Priority</th>
              <th>KPI</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{i.initiative}</div>
                  <div className="faint" style={{ maxWidth: 320 }}>{i.rationale}</div>
                </td>
                <td className="muted">{i.stage}</td>
                <td className="muted">{i.owner}</td>
                <td className="muted">{i.timeline}</td>
                <td className="num">${i.cost.toFixed(1)}M</td>
                <td className="num">${i.expectedBenefitAnnual.toFixed(1)}M</td>
                <td className={priorityClass(i.priority)}>{i.priority}</td>
                <td className="muted">{i.kpi}</td>
                <td><StatusPill status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
