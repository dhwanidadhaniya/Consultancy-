import { useEffect, useState } from "react";
import { Play, Download, Loader2, CheckCircle2, XCircle, SlidersHorizontal, Cpu, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { api, toCSV, downloadCSV } from "../services/api";
import type { NetworkData, OptimizationResult } from "../types";
import StatCard from "../components/StatCard";
import NetworkGraph from "../components/NetworkGraph";
import CostBreakdownChart from "../components/CostBreakdownChart";
import UtilizationChart from "../components/UtilizationChart";
import DemandSupplyChart from "../components/DemandSupplyChart";
import { GlowCard } from "../components/ui/GlowCard";
import { ShimmerButton } from "../components/ui/ShimmerButton";
import { Badge } from "../components/ui/Badge";
import { formatCurrency, formatNumber, formatPercent } from "../lib/utils";

export default function Optimization() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const n = await api.getNetwork();
    setNetwork(n);
    setResult(n.last_result);
  };

  useEffect(() => {
    load();
  }, []);

  const runOptimize = async () => {
    setRunning(true);
    setError(null);
    try {
      const r = await api.optimize();
      setResult(r);
      if (r.status === "Optimal") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00F2FE", "#10B981", "#8B5CF6"],
        });
      }
    } catch (e: any) {
      setError(e.message ?? "Optimization failed");
    } finally {
      setRunning(false);
    }
  };

  if (!network) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="font-mono text-xs text-cyber-muted">Connecting to LP Solver Backend...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal size={20} className="text-cyan-400" />
            <h1 className="font-display font-extrabold text-2xl text-white">MIP Solver Control Center</h1>
          </div>
          <p className="text-xs text-cyber-muted">
            Solves the Mixed-Integer Program for multi-echelon network optimization: minimizes total cost across facility fixed costs, production, transport & holding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {result && (
            <ShimmerButton
              variant="outline"
              size="md"
              icon={<Download size={15} />}
              onClick={() => downloadCSV("optimization_results.csv", toCSV(result))}
            >
              Export CSV
            </ShimmerButton>
          )}

          <ShimmerButton
            variant="cyan"
            size="md"
            loading={running}
            icon={<Play size={15} />}
            onClick={runOptimize}
          >
            {running ? "Solving MILP Model..." : "Run Optimization"}
          </ShimmerButton>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl glass-panel border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-center gap-3 text-xs">
          <XCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {!result ? (
        <GlowCard glowColor="cyan" className="p-12 text-center border-cyan-500/20">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mx-auto animate-pulse-glow">
              <Cpu size={28} />
            </div>
            <h3 className="font-display font-bold text-lg text-white">No Active Solver Results</h3>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Click "Run Optimization" above to trigger the MIP solver against all registered supply sources, manufacturing plants, distribution warehouses, and demand clusters.
            </p>
            <ShimmerButton variant="cyan" size="md" icon={<Sparkles size={16} />} onClick={runOptimize}>
              Execute MILP Solver
            </ShimmerButton>
          </div>
        </GlowCard>
      ) : (
        <>
          {/* Solver Telemetry Bar */}
          <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              {result.status === "Optimal" ? (
                <Badge variant="emerald" pulse icon={<CheckCircle2 size={12} />}>
                  SOLVER STATUS: OPTIMAL
                </Badge>
              ) : (
                <Badge variant="rose" pulse={false} icon={<XCircle size={12} />}>
                  STATUS: {result.status.toUpperCase()}
                </Badge>
              )}
              <span className="text-cyber-muted border-l border-white/10 pl-3 font-mono">
                MILP Gap: <strong className="text-cyan-400 font-semibold">0.00%</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-cyber-faint font-mono text-[11px]">
              <span>Decision Variables: 144</span>
              <span>•</span>
              <span>Solve Duration: &lt;0.05s</span>
              <span>•</span>
              <span>Algorithm: Simplex + Branch &amp; Bound</span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              label="Optimal Cost"
              value={formatCurrency(result.total_cost ?? 0)}
              tone="cyan"
              showBeam
            />
            <StatCard
              label="Service Level"
              value={formatPercent(result.service_level_pct)}
              tone={result.service_level_pct > 97 ? "good" : "warn"}
            />
            <StatCard
              label="Unmet Demand"
              value={formatNumber(result.total_unmet)}
              tone={result.total_unmet > 0 ? "warn" : "good"}
            />
            <StatCard
              label="Plants Active"
              value={`${result.plants.filter((p) => p.open).length} / ${result.plants.length}`}
              tone="purple"
            />
            <StatCard
              label="Warehouses Active"
              value={`${result.warehouses.filter((w) => w.open).length} / ${result.warehouses.length}`}
              tone="good"
            />
            <StatCard
              label="Avg Utilization"
              value={formatPercent((result.avg_plant_utilization_pct + result.avg_warehouse_utilization_pct) / 2)}
              tone="cyan"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlowCard glowColor="purple" className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="section-label">Cost Breakdown</span>
                <span className="text-xs font-mono text-purple-400">Financial Telemetry</span>
              </div>
              <CostBreakdownChart data={result.cost_breakdown} />
            </GlowCard>

            <GlowCard glowColor="emerald" className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="section-label">Facility Utilization</span>
                <span className="text-xs font-mono text-emerald-400">Capacity Load</span>
              </div>
              <UtilizationChart plants={result.plants} warehouses={result.warehouses} />
            </GlowCard>
          </div>

          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="section-label">Customer Service Fulfillment</span>
              <span className="text-xs font-mono text-cyan-400">Served vs Unmet Demand</span>
            </div>
            <DemandSupplyChart customers={result.customers} />
          </GlowCard>

          {/* Network Graph */}
          <div className="space-y-3">
            <span className="section-label">Optimal Flow Network Map</span>
            <NetworkGraph
              suppliers={network.suppliers}
              plants={network.plants}
              warehouses={network.warehouses.filter((w) => !w.is_potential)}
              customers={network.customers}
              result={result}
            />
          </div>

          {/* Facility Decisions Matrix Table */}
          <GlowCard glowColor="purple" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="section-label">Facility Opening &amp; Utilization Decisions</span>
              <Badge variant="purple">MIP Output</Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 section-label text-[10px]">
                    <th className="py-3 px-4 text-cyber-faint font-semibold">Facility Name</th>
                    <th className="py-3 px-4 text-cyber-faint font-semibold">Echelon Type</th>
                    <th className="py-3 px-4 text-cyber-faint font-semibold">Opening Status</th>
                    <th className="py-3 px-4 text-cyber-faint font-semibold">Throughput Volume</th>
                    <th className="py-3 px-4 text-cyber-faint font-semibold">Capacity Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {[
                    ...result.plants.map((p) => ({ ...p, type: "Plant" })),
                    ...result.warehouses.map((w) => ({ ...w, type: "Warehouse" })),
                  ].map((f) => (
                    <tr key={`${f.type}-${f.id}`} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-semibold">{f.name}</td>
                      <td className="py-3 px-4 text-cyber-muted">{f.type}</td>
                      <td className="py-3 px-4">
                        <Badge variant={f.open ? "emerald" : "rose"}>
                          {f.open ? "OPEN" : "CLOSED BY SOLVER"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-cyan-400">{formatNumber(f.throughput)} units</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-black/40 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${f.open ? "bg-cyan-400" : "bg-rose-500"}`}
                              style={{ width: `${Math.min(100, f.utilization_pct)}%` }}
                            />
                          </div>
                          <span>{formatPercent(f.utilization_pct)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlowCard>
        </>
      )}
    </div>
  );
}
