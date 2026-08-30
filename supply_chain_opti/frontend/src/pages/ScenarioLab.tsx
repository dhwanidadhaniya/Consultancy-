import { useEffect, useState } from "react";
import { FlaskConical, Loader2, Play, Sparkles, AlertTriangle, Zap } from "lucide-react";
import { api } from "../services/api";
import type { NetworkData, ScenarioResponse } from "../types";
import ComparisonChart from "../components/ComparisonChart";
import StatCard from "../components/StatCard";
import { GlowCard } from "../components/ui/GlowCard";
import { ShimmerButton } from "../components/ui/ShimmerButton";
import { Badge } from "../components/ui/Badge";

export default function ScenarioLab() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [demandPct, setDemandPct] = useState(0);
  const [transportMult, setTransportMult] = useState(1);
  const [supplierCapMult, setSupplierCapMult] = useState(1);
  const [warehouseCapMult, setWarehouseCapMult] = useState(1);
  const [disabledSuppliers, setDisabledSuppliers] = useState<number[]>([]);
  const [disabledWarehouses, setDisabledWarehouses] = useState<number[]>([]);
  const [activatePotential, setActivatePotential] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<ScenarioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getNetwork().then(setNetwork);
  }, []);

  const toggle = (arr: number[], setArr: (v: number[]) => void, id: number) => {
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const runScenario = async (overrides?: any) => {
    setRunning(true);
    setError(null);
    try {
      const payload = {
        demand_change_pct: overrides?.demandPct ?? demandPct,
        transport_cost_multiplier: overrides?.transportMult ?? transportMult,
        supplier_capacity_multiplier: overrides?.supplierCapMult ?? supplierCapMult,
        warehouse_capacity_multiplier: overrides?.warehouseCapMult ?? warehouseCapMult,
        disabled_supplier_ids: overrides?.disabledSuppliers ?? disabledSuppliers,
        disabled_warehouse_ids: overrides?.disabledWarehouses ?? disabledWarehouses,
        activate_potential_warehouse_ids: overrides?.activatePotential ?? activatePotential,
        label: overrides?.label ?? "Scenario",
      };
      const res = await api.runScenario(payload);
      setResponse(res);
    } catch (e: any) {
      setError(e.message ?? "Scenario simulation failed");
    } finally {
      setRunning(false);
    }
  };

  if (!network) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="font-mono text-xs text-cyber-muted">Initializing Simulation Sandbox...</p>
      </div>
    );
  }

  const potentialWarehouses = network.warehouses.filter((w) => w.is_potential);

  const applyPreset = (presetName: string) => {
    if (presetName === "fuel") {
      setTransportMult(1.35);
      setDemandPct(0);
      setSupplierCapMult(1);
      setWarehouseCapMult(1);
      runScenario({ transportMult: 1.35, label: "Fuel Spike +35%" });
    } else if (presetName === "demand") {
      setDemandPct(20);
      setTransportMult(1);
      setSupplierCapMult(1);
      setWarehouseCapMult(1);
      runScenario({ demandPct: 20, label: "Peak Demand +20%" });
    } else if (presetName === "blackout") {
      const firstSupp = network.suppliers[0]?.id;
      if (firstSupp) {
        setDisabledSuppliers([firstSupp]);
        runScenario({ disabledSuppliers: [firstSupp], label: "Supplier Outage" });
      }
    } else if (presetName === "expansion") {
      const firstPot = potentialWarehouses[0]?.id;
      if (firstPot) {
        setActivatePotential([firstPot]);
        runScenario({ activatePotential: [firstPot], label: "New DC Expansion" });
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={20} className="text-cyan-400" />
            <h1 className="font-display font-extrabold text-2xl text-white">Scenario Simulation Lab</h1>
          </div>
          <p className="text-xs text-cyber-muted">
            Stress-test your network against inflation, demand surges, supplier outages, and facility expansion opportunities.
          </p>
        </div>

        <ShimmerButton
          variant="cyan"
          size="md"
          loading={running}
          icon={<Play size={15} />}
          onClick={() => runScenario()}
        >
          {running ? "Simulating..." : "Run Custom Simulation"}
        </ShimmerButton>
      </header>

      {/* Preset Scenario Quick Launcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PresetCard
          title="Fuel Cost Surge (+35%)"
          desc="Simulates global diesel inflation impact on freight legs."
          badge="MACRO"
          onClick={() => applyPreset("fuel")}
        />
        <PresetCard
          title="Peak Season Demand (+20%)"
          desc="Stress-tests network capacity during Q4 holiday volume spike."
          badge="DEMAND"
          onClick={() => applyPreset("demand")}
        />
        <PresetCard
          title="Primary Supplier Outage"
          desc="Blacks out tier-1 supplier to evaluate inventory buffer resilience."
          badge="RISK"
          onClick={() => applyPreset("blackout")}
        />
        <PresetCard
          title="Activate New Potential DC"
          desc="Tests opening a new distribution center site."
          badge="EXPANSION"
          onClick={() => applyPreset("expansion")}
        />
      </div>

      {/* Control Panel Grid */}
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-cyan-400" />
            <span className="section-label">Simulation Knobs &amp; Disruption Parameters</span>
          </div>
          <Badge variant="cyan">Interactive Sliders</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sliders Column */}
          <div className="space-y-5">
            <SliderField
              label="Regional Demand Shift"
              valueText={`${demandPct > 0 ? "+" : ""}${demandPct}%`}
              min={-30}
              max={30}
              value={demandPct}
              onChange={setDemandPct}
            />
            <SliderField
              label="Freight / Transport Cost Multiplier"
              valueText={`${transportMult.toFixed(2)}x`}
              min={0.5}
              max={2}
              step={0.05}
              value={transportMult}
              onChange={setTransportMult}
            />
            <SliderField
              label="Supplier Capacity Factor"
              valueText={`${supplierCapMult.toFixed(2)}x`}
              min={0.3}
              max={1.5}
              step={0.05}
              value={supplierCapMult}
              onChange={setSupplierCapMult}
            />
            <SliderField
              label="Warehouse Capacity Factor"
              valueText={`${warehouseCapMult.toFixed(2)}x`}
              min={0.3}
              max={1.5}
              step={0.05}
              value={warehouseCapMult}
              onChange={setWarehouseCapMult}
            />
          </div>

          {/* Disruption Toggle Chips Column */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono text-cyber-muted mb-2">Blackout Supplier Facility (Disruption)</p>
              <div className="flex flex-wrap gap-2">
                {network.suppliers.map((s) => (
                  <Chip
                    key={s.id}
                    active={disabledSuppliers.includes(s.id)}
                    variant="rose"
                    onClick={() => toggle(disabledSuppliers, setDisabledSuppliers, s.id)}
                  >
                    {s.name}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-mono text-cyber-muted mb-2">Simulate Distribution Center Shutdown</p>
              <div className="flex flex-wrap gap-2">
                {network.warehouses
                  .filter((w) => !w.is_potential)
                  .map((w) => (
                    <Chip
                      key={w.id}
                      active={disabledWarehouses.includes(w.id)}
                      variant="rose"
                      onClick={() => toggle(disabledWarehouses, setDisabledWarehouses, w.id)}
                    >
                      {w.name}
                    </Chip>
                  ))}
              </div>
            </div>

            {potentialWarehouses.length > 0 && (
              <div>
                <p className="text-xs font-mono text-cyber-muted mb-2">Test Potential Expansion Site Activation</p>
                <div className="flex flex-wrap gap-2">
                  {potentialWarehouses.map((w) => (
                    <Chip
                      key={w.id}
                      active={activatePotential.includes(w.id)}
                      variant="emerald"
                      onClick={() => toggle(activatePotential, setActivatePotential, w.id)}
                    >
                      + {w.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlowCard>

      {error && (
        <div className="p-4 rounded-xl glass-panel border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Comparison Section */}
      {response && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="section-label">Simulation Output &amp; Delta Metrics</span>
            <Badge variant="cyan">Scenario vs Baseline</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Cost Delta"
              value={
                response.comparison.cost_delta_pct !== null
                  ? `${response.comparison.cost_delta_pct > 0 ? "+" : ""}${response.comparison.cost_delta_pct.toFixed(1)}%`
                  : "—"
              }
              tone={response.comparison.cost_delta_pct && response.comparison.cost_delta_pct > 0 ? "warn" : "good"}
              trend={{
                value: `${response.comparison.cost_delta_pct?.toFixed(1)}%`,
                isPositive: (response.comparison.cost_delta_pct ?? 0) <= 0,
              }}
            />
            <StatCard
              label="Service Level Delta"
              value={`${response.comparison.service_level_delta_pts > 0 ? "+" : ""}${response.comparison.service_level_delta_pts.toFixed(1)} pts`}
              tone={response.comparison.service_level_delta_pts < 0 ? "warn" : "good"}
            />
            <StatCard
              label="Unmet Demand Delta"
              value={`${response.comparison.unmet_delta > 0 ? "+" : ""}${response.comparison.unmet_delta}`}
              tone={response.comparison.unmet_delta > 0 ? "warn" : "good"}
            />
            <StatCard
              label="Plant Load Delta"
              value={`${response.comparison.plant_utilization_delta_pts > 0 ? "+" : ""}${response.comparison.plant_utilization_delta_pts.toFixed(1)} pts`}
              tone="purple"
            />
            <StatCard
              label="DC Load Delta"
              value={`${response.comparison.warehouse_utilization_delta_pts > 0 ? "+" : ""}${response.comparison.warehouse_utilization_delta_pts.toFixed(1)} pts`}
              tone="cyan"
            />
          </div>

          <GlowCard glowColor="purple" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="section-label font-bold text-white">Baseline vs Scenario Metric Comparison</span>
            </div>
            <ComparisonChart
              base={response.base}
              scenario={response.scenario}
              baseLabel="Base Baseline"
              scenarioLabel="Simulated Scenario"
            />
          </GlowCard>
        </div>
      )}
    </div>
  );
}

function PresetCard({
  title,
  desc,
  badge,
  onClick,
}: {
  title: string;
  desc: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-4 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <Badge variant="cyan" pulse={false}>
            {badge}
          </Badge>
          <Sparkles size={14} className="text-cyber-faint group-hover:text-cyan-400 transition-colors" />
        </div>
        <h4 className="font-display font-bold text-sm text-white group-hover:text-cyan-300 transition-colors mt-2">
          {title}
        </h4>
        <p className="text-[11.5px] text-cyber-muted leading-relaxed">{desc}</p>
      </div>

      <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
        Run Scenario &rarr;
      </span>
    </div>
  );
}

function SliderField({
  label,
  valueText,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-cyber-muted">{label}</span>
        <span className="font-bold text-cyan-400">{valueText}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none bg-black/50 accent-cyan-400 cursor-pointer"
      />
    </div>
  );
}

function Chip({
  active,
  variant = "rose",
  onClick,
  children,
}: {
  active: boolean;
  variant?: "rose" | "emerald";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeStyles =
    variant === "rose"
      ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-rose"
      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-glow-emerald";

  return (
    <button
      onClick={onClick}
      className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all ${
        active ? activeStyles : "border-white/10 bg-black/40 text-cyber-muted hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
