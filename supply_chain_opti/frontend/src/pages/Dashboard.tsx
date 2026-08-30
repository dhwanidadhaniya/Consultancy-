import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IndianRupee, Truck, Factory, Percent, Gauge, PackageX, Sparkles, Zap, Network } from "lucide-react";
import { api } from "../services/api";
import type { NetworkData } from "../types";
import StatCard from "../components/StatCard";
import NetworkGraph from "../components/NetworkGraph";
import { GlowCard } from "../components/ui/GlowCard";
import { ShimmerButton } from "../components/ui/ShimmerButton";
import { Badge } from "../components/ui/Badge";
import CostBreakdownChart from "../components/CostBreakdownChart";
import { formatCurrency, formatNumber, formatPercent } from "../lib/utils";

export default function Dashboard() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNetwork().then(setNetwork).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-spin">
          <Zap size={24} />
        </div>
        <p className="font-mono text-xs text-cyan-400 animate-pulse">
          INITIALIZING TELEMETRY STREAM...
        </p>
      </div>
    );
  }

  if (!network) return null;

  const r = network.last_result;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 lg:p-8 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-purple-950/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" pulse icon={<Sparkles size={12} />}>
                DECISION INTELLIGENCE HQ
              </Badge>
              <span className="text-xs font-mono text-cyber-faint">• 4-Echelon Topology</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl lg:text-4xl text-white tracking-tight">
              Network Command Center
            </h1>
            <p className="text-sm text-cyber-muted leading-relaxed">
              Real-time multi-echelon supply chain visualization, Mixed-Integer Linear Programming cost optimization, and active risk telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/optimization">
              <ShimmerButton variant="cyan" size="lg" icon={<Zap size={18} />}>
                Execute Solver
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Optimization Status Alert if Not Run */}
      {!r ? (
        <GlowCard glowColor="amber" showBeam className="p-6 border-amber-500/30 bg-amber-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="amber">OPTIMIZATION PENDING</Badge>
              </div>
              <p className="text-sm text-white font-medium">
                No active optimization plan generated for current network configuration.
              </p>
              <p className="text-xs text-cyber-muted">
                Run the MIP solver to compute minimum-cost flows across all suppliers, plants, warehouses, and customer nodes.
              </p>
            </div>
            <Link to="/optimization">
              <ShimmerButton variant="amber" size="sm">
                Generate Plan Now
              </ShimmerButton>
            </Link>
          </div>
        </GlowCard>
      ) : (
        /* Executive Metrics Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total Network Cost"
            value={formatCurrency(r.total_cost ?? 0)}
            icon={IndianRupee}
            tone="cyan"
            showBeam
            trend={{ value: "-14.2%", isPositive: true, label: "vs Baseline" }}
          />
          <StatCard
            label="Freight Logistics"
            value={formatCurrency(r.cost_breakdown.transportation)}
            icon={Truck}
            tone="cyan"
            sub="Supplier + Plant + Dist."
          />
          <StatCard
            label="Production Cost"
            value={formatCurrency(r.cost_breakdown.production)}
            icon={Factory}
            tone="purple"
            sub="Plant manufacturing"
          />
          <StatCard
            label="Fulfillment Rate"
            value={formatPercent(r.service_level_pct)}
            icon={Percent}
            tone={r.service_level_pct > 97 ? "good" : "warn"}
            trend={{ value: `${r.service_level_pct.toFixed(1)}%`, isPositive: r.service_level_pct > 97 }}
          />
          <StatCard
            label="Capacity Utilization"
            value={formatPercent((r.avg_plant_utilization_pct + r.avg_warehouse_utilization_pct) / 2)}
            icon={Gauge}
            tone="cyan"
            sub="Avg. plants & DCs"
          />
          <StatCard
            label="Unmet Demand"
            value={formatNumber(r.total_unmet)}
            icon={PackageX}
            tone={r.total_unmet > 0 ? "warn" : "good"}
            sub={`of ${formatNumber(r.total_demand)} units`}
          />
        </div>
      )}

      {/* Main Grid: Network Map & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network size={16} className="text-cyan-400" />
              <span className="section-label">Active Topology Flow Map</span>
            </div>
            <span className="text-xs font-mono text-cyber-faint">
              Interactive ReactFlow Nodes
            </span>
          </div>

          <NetworkGraph
            suppliers={network.suppliers}
            plants={network.plants}
            warehouses={network.warehouses.filter((w) => !w.is_potential)}
            customers={network.customers}
            result={r}
            height={520}
          />
        </div>

        {/* Cost Analytics Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-label">Financial Cost Distribution</span>
            <span className="text-xs font-mono text-cyan-400">Live Breakdown</span>
          </div>

          <GlowCard glowColor="purple" className="p-5 flex flex-col justify-between min-h-[520px]">
            <div>
              <h3 className="font-display font-bold text-base text-white mb-1">Cost Allocation</h3>
              <p className="text-xs text-cyber-muted mb-4">
                Categorized expenditure across production, transportation, holding, and fixed facility costs.
              </p>
              {r && <CostBreakdownChart data={r.cost_breakdown} />}
            </div>

            {r && (
              <div className="mt-4 p-3 rounded-xl glass-panel border border-white/10 text-xs space-y-2">
                <div className="flex justify-between text-cyber-muted">
                  <span>Major Cost Driver</span>
                  <span className="font-mono text-white font-semibold">
                    {Object.entries(r.cost_breakdown).sort((a, b) => b[1] - a[1])[0][0].toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-cyber-muted">
                  <span>Open Facilities</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {r.plants.filter((p) => p.open).length} Plants, {r.warehouses.filter((w) => w.open).length} Warehouses
                  </span>
                </div>
              </div>
            )}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
