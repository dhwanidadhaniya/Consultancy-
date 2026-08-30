import { useEffect, useState } from "react";
import { ShieldAlert, Loader2, ArrowRight, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { api } from "../services/api";
import type { NetworkData, DisruptionResponse } from "../types";
import StatCard from "../components/StatCard";
import ComparisonChart from "../components/ComparisonChart";
import { GlowCard } from "../components/ui/GlowCard";
import { ShimmerButton } from "../components/ui/ShimmerButton";
import { Badge } from "../components/ui/Badge";
import { formatPercent } from "../lib/utils";

const nameLookup = (network: NetworkData, kind: string, id: number) => {
  const table = kind === "supplier" ? network.suppliers : kind === "plant" ? network.plants : network.warehouses;
  return table.find((x: any) => x.id === id)?.name ?? `#${id}`;
};

const LEG_KINDS: Record<string, { from: string; to: string }> = {
  supplier_to_plant: { from: "supplier", to: "plant" },
  plant_to_warehouse: { from: "plant", to: "warehouse" },
  warehouse_to_customer: { from: "warehouse", to: "customer" },
};

const resolveRouteName = (network: NetworkData, kind: string, id: number) => {
  if (kind === "customer") {
    return network.customers.find((c) => c.id === id)?.name ?? `#${id}`;
  }
  return nameLookup(network, kind, id);
};

export default function RiskResilience() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [nodeType, setNodeType] = useState<"supplier" | "plant" | "warehouse">("supplier");
  const [nodeId, setNodeId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<DisruptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getNetwork().then((n) => {
      setNetwork(n);
      if (n.suppliers.length) setNodeId(n.suppliers[0].id);
    });
  }, []);

  const options = () => {
    if (!network) return [];
    if (nodeType === "supplier") return network.suppliers;
    if (nodeType === "plant") return network.plants;
    return network.warehouses.filter((w) => !w.is_potential);
  };

  const runDisruption = async () => {
    if (nodeId === null) return;
    setRunning(true);
    setError(null);
    try {
      const res = await api.runDisruption({ node_type: nodeType, node_id: nodeId });
      setResponse(res);
    } catch (e: any) {
      setError(e.message ?? "Disruption simulation failed");
    } finally {
      setRunning(false);
    }
  };

  if (!network) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="font-mono text-xs text-cyber-muted">Connecting to Risk Telemetry Grid...</p>
      </div>
    );
  }

  const totalCap = network.suppliers.reduce((a, s) => a + s.capacity, 0) || 1;
  const riskScores = network.suppliers.map((s) => {
    const concentration = s.capacity / totalCap;
    const risk = (1 - s.reliability) * 0.6 + concentration * 0.4;
    return { name: s.name, risk: Math.round(risk * 100), reliability: s.reliability, cap: s.capacity };
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={20} className="text-rose-400" />
            <h1 className="font-display font-extrabold text-2xl text-white">Risk &amp; Resilience Command</h1>
          </div>
          <p className="text-xs text-cyber-muted">
            Identify single points of failure, monitor supplier vulnerability scores, and simulate catastrophic node outages.
          </p>
        </div>

        <Badge variant="rose" pulse icon={<ShieldAlert size={12} />}>
          ACTIVE MONITORING
        </Badge>
      </header>

      {/* Main Grid: Supplier Risk Heat Map & Disruption Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Vulnerability Matrix */}
        <GlowCard glowColor="rose" className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              <span className="section-label">Supplier Risk Index</span>
            </div>
            <span className="text-xs font-mono text-rose-400">Reliability &amp; Concentration Score</span>
          </div>

          <p className="text-xs text-cyber-muted mb-4">
            Vulnerability index computed from historical supplier SLA reliability and capacity share.
          </p>

          <div className="space-y-4">
            {riskScores.map((r) => (
              <div key={r.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-semibold">{r.name}</span>
                  <span className={r.risk > 40 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                    Risk Score: {r.risk}/100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      r.risk > 45
                        ? "bg-rose-500 shadow-glow-rose"
                        : r.risk > 25
                        ? "bg-amber-400"
                        : "bg-emerald-400 shadow-glow-emerald"
                    }`}
                    style={{ width: `${Math.min(100, r.risk)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-cyber-faint pt-0.5">
                  <span>Reliability: {formatPercent(r.reliability * 100)}</span>
                  <span>Share: {formatPercent((r.cap / totalCap) * 100)}</span>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Node Failure Stress Tester */}
        <GlowCard glowColor="cyan" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-cyan-400" />
                <span className="section-label">Simulate Single Node Blackout</span>
              </div>
              <Badge variant="cyan">MIP Stress Test</Badge>
            </div>

            <p className="text-xs text-cyber-muted mb-6">
              Select any supplier, plant, or warehouse to instantly force its capacity to zero and recalculate optimal rerouting.
            </p>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs text-cyber-muted">
                <span className="font-mono">Select Target Echelon Type</span>
                <select
                  value={nodeType}
                  onChange={(e) => {
                    setNodeType(e.target.value as any);
                    setNodeId(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="supplier">Supplier Node</option>
                  <option value="plant">Manufacturing Plant Node</option>
                  <option value="warehouse">Warehouse / DC Node</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-cyber-muted">
                <span className="font-mono">Select Specific Facility</span>
                <select
                  value={nodeId ?? ""}
                  onChange={(e) => setNodeId(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  {options().map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.location})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="pt-6">
            <ShimmerButton
              variant="rose"
              size="md"
              loading={running}
              icon={<ShieldAlert size={16} />}
              disabled={nodeId === null}
              onClick={runDisruption}
              className="w-full"
            >
              {running ? "Running Disruption Solver..." : "Simulate Facility Failure"}
            </ShimmerButton>
          </div>
        </GlowCard>
      </div>

      {error && (
        <div className="p-4 rounded-xl glass-panel border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Disruption Results */}
      {response && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="section-label">Disruption Telemetry Output</span>
            <Badge variant="rose">
              Target: {nameLookup(network, response.node_type, response.node_id)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Financial Cost Impact"
              value={
                response.comparison.cost_delta_pct !== null
                  ? `${response.comparison.cost_delta_pct > 0 ? "+" : ""}${response.comparison.cost_delta_pct.toFixed(1)}%`
                  : "INFEASIBLE"
              }
              tone="warn"
            />
            <StatCard
              label="Fulfillment SLA Impact"
              value={`${response.comparison.service_level_delta_pts.toFixed(1)} pts`}
              tone={response.comparison.service_level_delta_pts < 0 ? "warn" : "good"}
            />
            <StatCard
              label="Unmet Demand Delta"
              value={`${response.comparison.unmet_delta > 0 ? "+" : ""}${response.comparison.unmet_delta}`}
              tone={response.comparison.unmet_delta > 0 ? "warn" : "good"}
            />
            <StatCard
              label="Disrupted Facility"
              value={nameLookup(network, response.node_type, response.node_id)}
              tone="purple"
            />
          </div>

          {response.disrupted.status === "Optimal" && (
            <GlowCard glowColor="purple" className="p-6">
              <span className="section-label font-bold text-white mb-4 block">
                Pre vs Post Disruption Comparison
              </span>
              <ComparisonChart
                base={response.base}
                scenario={response.disrupted}
                baseLabel="Pre-Outage Normal"
                scenarioLabel="Post-Failure Rerouted"
              />
            </GlowCard>
          )}

          {/* Alternative Rerouting Lanes Visualizer */}
          <GlowCard glowColor="cyan" className="p-6">
            <span className="section-label font-bold text-white mb-3 block">
              Emergency Rerouting Lanes Activated
            </span>

            {Object.values(response.alternative_routes).every((arr) => arr.length === 0) ? (
              <div className="flex items-center gap-2 p-3 rounded-lg glass-panel text-xs text-cyber-muted">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>
                  No emergency rerouting required — existing active lanes possessed sufficient headroom buffer to absorb the shock.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(response.alternative_routes).map(([leg, routes]) => {
                  const kinds = LEG_KINDS[leg] ?? { from: "supplier", to: "plant" };
                  return routes.map((r, i) => (
                    <div
                      key={`${leg}-${i}`}
                      className="p-3 rounded-xl glass-panel border border-cyan-500/20 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-cyber-faint uppercase text-[10px]">{leg.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <span>{resolveRouteName(network, kinds.from, r.from)}</span>
                        <ArrowRight size={14} className="text-cyan-400" />
                        <span>{resolveRouteName(network, kinds.to, r.to)}</span>
                      </div>
                    </div>
                  ));
                })}
              </div>
            )}
          </GlowCard>
        </div>
      )}
    </div>
  );
}
