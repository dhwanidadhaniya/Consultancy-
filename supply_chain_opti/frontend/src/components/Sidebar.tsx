import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Database,
  SlidersHorizontal,
  FlaskConical,
  ShieldAlert,
  Lightbulb,
  Boxes,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Badge } from "./ui/Badge";

const links = [
  { to: "/", label: "Executive Dashboard", icon: LayoutGrid, tag: "LIVE" },
  { to: "/network-data", label: "Network Topology", icon: Database, count: "48" },
  { to: "/optimization", label: "Solver Command", icon: SlidersHorizontal, tag: "MIP" },
  { to: "/scenario-lab", label: "Scenario Lab", icon: FlaskConical, tag: "SIM" },
  { to: "/risk-resilience", label: "Risk & Resilience", icon: ShieldAlert, alert: true },
  { to: "/insights", label: "AI Insights", icon: Lightbulb, count: "5" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-6 py-6 px-4 border-r border-white/10 glass-panel backdrop-blur-xl relative z-20 min-h-screen">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center shadow-glow-cyan">
          <Boxes size={20} className="text-cyan-400 animate-pulse-glow" />
        </div>
        <div className="leading-tight">
          <h1 className="font-display font-bold text-base text-white tracking-wide">
            OPTIMA<span className="text-cyan-400 font-extrabold">NEX</span>
          </h1>
          <p className="section-label !text-[8.5px] text-cyan-300/70">Supply Chain Control Tower</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 mt-2">
        <div className="px-3 pb-1">
          <span className="section-label text-cyber-faint">Core Navigation</span>
        </div>
        {links.map(({ to, label, icon: Icon, tag, count, alert }) => {
          const isActive =
            to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} className="relative group">
              {isActive && (
                <motion.div
                  layoutId="active-sidebar-pill"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/10 border-l-2 border-cyan-400 rounded-r-xl shadow-glow-cyan"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div
                className={`relative z-10 flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-cyber-muted hover:text-cyber-text hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? "text-cyan-400"
                        : "text-cyber-faint group-hover:text-cyan-400"
                    }`}
                  />
                  <span>{label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {tag && (
                    <span
                      className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                          : "bg-white/5 text-cyber-faint border-white/10"
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                  {count && (
                    <span className="text-[10px] font-mono text-cyber-faint bg-white/5 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  )}
                  {alert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                  <ChevronRight
                    size={14}
                    className={`transition-transform duration-200 opacity-0 group-hover:opacity-100 ${
                      isActive ? "opacity-100 text-cyan-400 translate-x-0.5" : "text-cyber-faint"
                    }`}
                  />
                </div>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Network Health Widget Footer */}
      <div className="mt-auto glass-card p-4 border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-slate-950/40 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            <span className="section-label text-emerald-400">Network Status</span>
          </div>
          <Badge variant="emerald" pulse={false}>
            99.4%
          </Badge>
        </div>
        <p className="text-[11.5px] text-cyber-muted leading-relaxed">
          Active network with <strong className="text-white font-mono">48 nodes</strong> operating under optimal cost policy.
        </p>
      </div>
    </aside>
  );
}
