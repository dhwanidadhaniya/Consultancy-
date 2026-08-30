import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Bar,
} from "recharts";
import { api } from "../lib/api";
import { Loading, ErrorState, PageHeader, InsightNote } from "../components/Bits";

export default function Operations() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.operations().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!data) return <Loading />;

  const { years, series, bottlenecks, plantUtilization } = data;

  const util = years.map((y, i) => ({
    year: y,
    "Capacity Utilization %": series.capacityUtilizationPct[i],
    "OEE %": series.oeePct[i],
  }));
  const quality = years.map((y, i) => ({
    year: y,
    "Defect Rate %": series.defectRatePct[i],
    "Rework Cost % of Rev": series.reworkCostPctOfRevenue[i],
  }));
  const delivery = years.map((y, i) => ({
    year: y,
    "On-Time Delivery %": series.onTimeDeliveryPct[i],
    "Supplier On-Time %": series.supplierOnTimePct[i],
  }));
  const inventoryLead = years.map((y, i) => ({
    year: y,
    "Inventory Days": series.inventoryDaysOnHand[i],
    "Lead Time (days)": series.leadTimeDays[i],
  }));

  return (
    <div>
      <PageHeader kicker="Operational Diagnosis" title="Capacity, Quality &amp; Delivery Performance" />

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Capacity Utilization vs. OEE (%)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={util} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Capacity Utilization %" stroke="#34506a" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="OEE %" stroke="#9c5a34" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote title="Is excess capacity driving the problem?">
          Utilization has fallen 22 points since 2021, largely from the loss of the Bratislava VW program in 2024.
          OEE has fallen even faster than utilization, indicating equipment effectiveness is degrading independent
          of volume.
        </InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Defect Rate &amp; Rework Cost (%)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <ComposedChart data={quality} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Defect Rate %" fill="#e3c9ad" radius={[3, 3, 0, 0]} barSize={26} />
                <Line type="monotone" dataKey="Rework Cost % of Rev" stroke="#9c4234" strokeWidth={2.2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>
          Defect rate has more than doubled since 2021 and rework cost has tripled as a share of revenue, tracking
          the age of the Dayton machining equipment.
        </InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">On-Time Delivery Performance (%)</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={delivery} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[75, 100]} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="On-Time Delivery %" stroke="#3f7350" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Supplier On-Time %" stroke="#8b9186" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>
          OTD has fallen from 96% to 82%, below most OEM supplier-panel thresholds (typically 90%+). Two customers
          have placed Meridian on formal supplier improvement plans as a result.
        </InsightNote>
      </div>

      <div className="grid grid-chart-note section-block">
        <div className="card">
          <div className="card-title">Inventory Days &amp; Lead Time</div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={inventoryLead} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Inventory Days" stroke="#9c5a34" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Lead Time (days)" stroke="#34506a" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <InsightNote>
          Both metrics have worsened in lockstep, consistent with the absence of a formal sales &amp; operations
          planning process referenced in the strategic diagnosis.
        </InsightNote>
      </div>

      <div className="section-block card">
        <div className="card-title">Plant-Level Utilization</div>
        <table className="data-table">
          <thead>
            <tr><th>Plant</th><th className="num">Utilization</th><th className="num">OEE</th><th>Note</th></tr>
          </thead>
          <tbody>
            {plantUtilization.map((p) => (
              <tr key={p.plant}>
                <td>{p.plant}</td>
                <td className="num">{p.utilization}%</td>
                <td className="num">{p.oee}%</td>
                <td className="muted">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title">Major Operational Bottlenecks</div>
        {bottlenecks.map((b) => (
          <div key={b.area} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.area}</div>
            <div className="muted" style={{ fontSize: 13, margin: "3px 0" }}>{b.detail}</div>
            <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{b.impact}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
