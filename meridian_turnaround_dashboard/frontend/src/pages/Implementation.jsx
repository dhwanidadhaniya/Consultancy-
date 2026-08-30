import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { api } from "../lib/api";
import { Loading, ErrorState, PageHeader, StatusPill } from "../components/Bits";

const STATUS_COLORS = {
  Complete: "#3f7350",
  "On Track": "#6f9b7c",
  "At Risk": "#a97a2f",
  Delayed: "#9c4234",
  "Not Started": "#a9a496",
};

export default function Implementation() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    api.initiatives().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!data) return <Loading />;

  const statusChart = Object.entries(data.summary.byStatus).map(([name, value]) => ({ name, value }));
  const statuses = ["All", ...Object.keys(data.summary.byStatus)];
  const list = filter === "All" ? data.list : data.list.filter((i) => i.status === filter);

  return (
    <div>
      <PageHeader kicker="Implementation Tracker" title="Initiative Progress &amp; Realized Benefit" />

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Status Mix Across All Initiatives</div>
          <div className="chart-wrap short">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {statusChart.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name] || "#ccc"} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Benefit Realization</div>
          <p style={{ fontSize: 13 }}>
            Of the <strong>${data.summary.totalExpectedBenefit.toFixed(1)}M</strong> in expected annual benefit across
            all 15 initiatives, <strong>${data.summary.totalActualBenefit.toFixed(1)}M</strong> has been realized so
            far — expected, given most Recover and Transform-stage initiatives are still in early execution.
          </p>
          <p className="faint">
            Not every initiative is on track: two are currently flagged At Risk and one Stabilize-stage item has
            slipped behind schedule (see table below).
          </p>
        </div>
      </div>

      <div className="filter-bar">
        {statuses.map((s) => (
          <button key={s} className={`filter-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Initiative</th>
              <th>Owner</th>
              <th>Deadline</th>
              <th style={{ width: 120 }}>Progress</th>
              <th className="num">Expected / yr</th>
              <th className="num">Actual / yr</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td style={{ fontWeight: 500 }}>{i.initiative}</td>
                <td className="muted">{i.owner}</td>
                <td className="muted">{i.timeline}</td>
                <td>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${i.progressPct}%` }} />
                  </div>
                  <div className="faint" style={{ marginTop: 3 }}>{i.progressPct}%</div>
                </td>
                <td className="num">${i.expectedBenefitAnnual.toFixed(1)}M</td>
                <td className="num">${i.actualBenefit.toFixed(1)}M</td>
                <td><StatusPill status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
