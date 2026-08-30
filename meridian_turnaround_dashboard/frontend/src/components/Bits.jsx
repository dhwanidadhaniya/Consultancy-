export function StatusPill({ status }) {
  const map = {
    Complete: "good",
    "On Track": "good",
    "At Risk": "warn",
    Delayed: "warn",
    "Not Started": "neutral",
    "Off Track": "bad",
  };
  return <span className={`pill ${map[status] || "neutral"}`}>{status}</span>;
}

export function InsightNote({ title = "Interpretation", children }) {
  return (
    <div className="insight">
      <div className="insight-title">{title}</div>
      {children}
    </div>
  );
}

export function Loading({ label = "Loading data\u2026" }) {
  return <div className="loading-state">{label}</div>;
}

export function ErrorState({ message }) {
  return (
    <div className="error-state">
      Could not reach the backend API. {message ? `(${message})` : ""}
      <br />
      Confirm the backend server is running on port 4000.
    </div>
  );
}

export function PageHeader({ kicker, title, asOf = "FY2025 year-end" }) {
  return (
    <div className="page-header">
      <div>
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
      </div>
      <div className="as-of">Data as of {asOf}</div>
    </div>
  );
}
