import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/financials", label: "Financials" },
  { to: "/operations", label: "Operations" },
  { to: "/strategy", label: "Strategy" },
  { to: "/plan", label: "Turnaround Plan" },
  { to: "/scenarios", label: "Scenarios" },
  { to: "/implementation", label: "Implementation" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Meridian Fabrication Group</div>
      <div className="sidebar-sub">Turnaround Program &middot; FY2025</div>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <span className="dot" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        Prepared for internal management review.
        <br />
        Data as of FY2025 year-end.
      </div>
    </aside>
  );
}
