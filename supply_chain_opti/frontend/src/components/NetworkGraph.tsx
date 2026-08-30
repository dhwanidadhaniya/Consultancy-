import { useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  Edge,
  Node,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Factory, Warehouse as WarehouseIcon, Truck, Users, Activity, ChevronRight, X } from "lucide-react";
import type {
  Supplier,
  Plant,
  Warehouse,
  Customer,
  OptimizationResult,
} from "../types";
import { Badge } from "./ui/Badge";
import { formatCurrency, formatNumber, formatPercent } from "../lib/utils";

interface Props {
  suppliers: Supplier[];
  plants: Plant[];
  warehouses: Warehouse[];
  customers: Customer[];
  result: OptimizationResult | null;
  height?: number;
}

type NodeKind = "supplier" | "plant" | "warehouse" | "customer";

interface DetailInfo {
  kind: NodeKind;
  name: string;
  location: string;
  capacity?: number;
  throughput?: number;
  utilization?: number;
  costRate?: number;
  costLabel?: string;
  incoming?: number;
  outgoing?: number;
  open?: boolean;
  demand?: number;
  served?: number;
  unmet?: number;
}

const ICONS: Record<NodeKind, any> = {
  supplier: Truck,
  plant: Factory,
  warehouse: WarehouseIcon,
  customer: Users,
};

const KIND_COLORS: Record<NodeKind, { border: string; bg: string; text: string; glow: string }> = {
  supplier: {
    border: "border-cyan-400/40 hover:border-cyan-400 shadow-glow-cyan",
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    glow: "bg-cyan-400",
  },
  plant: {
    border: "border-purple-400/40 hover:border-purple-400 shadow-glow-purple",
    bg: "bg-purple-950/40",
    text: "text-purple-400",
    glow: "bg-purple-400",
  },
  warehouse: {
    border: "border-emerald-400/40 hover:border-emerald-400 shadow-glow-emerald",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    glow: "bg-emerald-400",
  },
  customer: {
    border: "border-amber-400/40 hover:border-amber-400 shadow-card",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    glow: "bg-amber-400",
  },
};

function EchelonNode({
  data,
}: NodeProps<{
  label: string;
  kind: NodeKind;
  dimmed: boolean;
  isOpen?: boolean;
  onClick: () => void;
}>) {
  const Icon = ICONS[data.kind];
  const colors = KIND_COLORS[data.kind];

  return (
    <div
      onClick={data.onClick}
      className={`relative px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer ${
        colors.bg
      } ${colors.border} ${
        data.dimmed ? "opacity-30 scale-95" : "opacity-100 hover:scale-105"
      } w-[165px] group`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-cyan-400 !w-2 !h-2 !border-0 shadow-glow-cyan"
      />

      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-black/40 ${colors.text} shrink-0`}>
          <Icon size={14} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
            {data.label}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.glow} animate-pulse`} />
            <span className="text-[9.5px] font-mono text-cyber-faint capitalize">
              {data.kind}
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyan-400 !w-2 !h-2 !border-0 shadow-glow-cyan"
      />
    </div>
  );
}

const nodeTypes = { echelon: EchelonNode };

export default function NetworkGraph({
  suppliers,
  plants,
  warehouses,
  customers,
  result,
  height = 520,
}: Props) {
  const [selected, setSelected] = useState<DetailInfo | null>(null);

  const layout = useMemo(() => {
    const colX = { supplier: 30, plant: 320, warehouse: 610, customer: 900 };
    const gapY = 70;

    const buildCol = (items: { id: number; name: string }[], kind: NodeKind, x: number): Node[] =>
      items.map((it, i) => ({
        id: `${kind}-${it.id}`,
        type: "echelon",
        position: { x, y: i * gapY + 20 },
        data: { label: it.name, kind, dimmed: false, onClick: () => {} },
        draggable: false,
      }));

    return [
      ...buildCol(suppliers, "supplier", colX.supplier),
      ...buildCol(plants, "plant", colX.plant),
      ...buildCol(warehouses, "warehouse", colX.warehouse),
      ...buildCol(customers, "customer", colX.customer),
    ];
  }, [suppliers, plants, warehouses, customers]);

  const maxQty = useMemo(() => {
    if (!result) return 1;
    const all = [
      ...result.shipments.supplier_to_plant,
      ...result.shipments.plant_to_warehouse,
      ...result.shipments.warehouse_to_customer,
    ];
    return Math.max(1, ...all.map((s) => s.qty));
  }, [result]);

  const edges: Edge[] = useMemo(() => {
    if (!result) return [];
    const mk = (
      legKey: keyof OptimizationResult["shipments"],
      fromKind: NodeKind,
      toKind: NodeKind,
      color: string
    ) =>
      result.shipments[legKey].map((s) => ({
        id: `${fromKind}-${s.from}-${toKind}-${s.to}`,
        source: `${fromKind}-${s.from}`,
        target: `${toKind}-${s.to}`,
        style: {
          strokeWidth: Math.max(1.5, (s.qty / maxQty) * 7),
          stroke: color,
          opacity: 0.75,
        },
        animated: true,
      }));

    return [
      ...mk("supplier_to_plant", "supplier", "plant", "#00F2FE"),
      ...mk("plant_to_warehouse", "plant", "warehouse", "#8B5CF6"),
      ...mk("warehouse_to_customer", "warehouse", "customer", "#10B981"),
    ];
  }, [result, maxQty]);

  const buildDetail = useCallback(
    (kind: NodeKind, id: number): DetailInfo | null => {
      if (kind === "supplier") {
        const s = suppliers.find((x) => x.id === id);
        if (!s) return null;
        const usage = result?.suppliers.find((x) => x.id === id);
        return {
          kind,
          name: s.name,
          location: s.location,
          capacity: s.capacity,
          throughput: usage?.throughput ?? 0,
          utilization: usage?.utilization_pct ?? 0,
          costRate: s.procurement_cost,
          costLabel: "Procurement cost / unit",
          outgoing: usage?.throughput ?? 0,
        };
      }
      if (kind === "plant") {
        const p = plants.find((x) => x.id === id);
        if (!p) return null;
        const d = result?.plants.find((x) => x.id === id);
        const incoming =
          result?.shipments.supplier_to_plant
            .filter((s) => s.to === id)
            .reduce((a, s) => a + s.qty, 0) ?? 0;
        return {
          kind,
          name: p.name,
          location: p.location,
          capacity: p.capacity,
          throughput: d?.throughput ?? 0,
          utilization: d?.utilization_pct ?? 0,
          costRate: p.production_cost,
          costLabel: "Production cost / unit",
          incoming,
          outgoing: d?.throughput ?? 0,
          open: d?.open,
        };
      }
      if (kind === "warehouse") {
        const w = warehouses.find((x) => x.id === id);
        if (!w) return null;
        const d = result?.warehouses.find((x) => x.id === id);
        const incoming =
          result?.shipments.plant_to_warehouse
            .filter((s) => s.to === id)
            .reduce((a, s) => a + s.qty, 0) ?? 0;
        return {
          kind,
          name: w.name,
          location: w.location,
          capacity: w.capacity,
          throughput: d?.throughput ?? 0,
          utilization: d?.utilization_pct ?? 0,
          costRate: w.holding_cost,
          costLabel: "Holding cost / unit",
          incoming,
          outgoing: d?.throughput ?? 0,
          open: d?.open,
        };
      }
      const c = customers.find((x) => x.id === id);
      if (!c) return null;
      const d = result?.customers.find((x) => x.id === id);
      return {
        kind,
        name: c.name,
        location: c.location,
        demand: c.demand,
        served: d?.served ?? 0,
        unmet: d?.unmet ?? 0,
        incoming: d?.served ?? 0,
      };
    },
    [suppliers, plants, warehouses, customers, result]
  );

  const nodesWithClick = useMemo(
    () =>
      layout.map((n) => {
        const [kind, idStr] = n.id.split("-");
        const id = Number(idStr);
        return {
          ...n,
          data: {
            ...n.data,
            onClick: () => setSelected(buildDetail(kind as NodeKind, id)),
          },
        };
      }),
    [layout, buildDetail]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Graph Area */}
      <div className="glass-card relative overflow-hidden flex-1 rounded-2xl border border-white/10" style={{ height }}>
        {/* Graph Legend Overlay */}
        <div className="absolute top-3 left-4 z-10 flex items-center gap-4 px-3 py-1.5 rounded-xl glass-panel text-[11px] font-mono border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span className="text-cyber-muted">Suppliers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-glow-purple" />
            <span className="text-cyber-muted">Plants</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
            <span className="text-cyber-muted">Warehouses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-cyber-muted">Customers</span>
          </div>
        </div>

        <ReactFlow
          nodes={nodesWithClick}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnScroll={true}
        >
          <Background color="rgba(255, 255, 255, 0.05)" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Facility Detail Sidebar Inspector */}
      <div className="glass-card p-5 w-full lg:w-80 shrink-0 flex flex-col justify-between rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              <span className="section-label">Node Telemetry</span>
            </div>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg text-cyber-faint hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {!selected ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-3 animate-pulse-glow">
                <ChevronRight size={20} />
              </div>
              <p className="text-sm font-medium text-white mb-1">Select Network Node</p>
              <p className="text-xs text-cyber-muted max-w-[200px] leading-relaxed">
                Click any facility node in the network graph to inspect real-time capacity, utilization, and flow telemetry.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{selected.name}</h3>
                  <Badge variant={selected.open === false ? "rose" : "emerald"}>
                    {selected.open === false ? "CLOSED" : "ACTIVE"}
                  </Badge>
                </div>
                <p className="text-xs text-cyber-muted mt-0.5">{selected.location}</p>
              </div>

              {/* Utilization Progress Bar */}
              {selected.utilization !== undefined && (
                <div className="glass-panel p-3 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-cyber-muted font-mono">Utilization Rate</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {formatPercent(selected.utilization)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selected.utilization > 90
                          ? "bg-rose-500 shadow-glow-rose"
                          : selected.utilization > 70
                          ? "bg-amber-400"
                          : "bg-cyan-400 shadow-glow-cyan"
                      }`}
                      style={{ width: `${Math.min(100, selected.utilization)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Metric Breakdown Table */}
              <div className="flex flex-col gap-2.5 text-xs">
                {selected.capacity !== undefined && (
                  <MetricRow label="Design Capacity" value={formatNumber(selected.capacity)} />
                )}
                {selected.throughput !== undefined && (
                  <MetricRow label="Current Throughput" value={formatNumber(selected.throughput)} highlighted />
                )}
                {selected.incoming !== undefined && (
                  <MetricRow label="Incoming Flow" value={formatNumber(selected.incoming)} />
                )}
                {selected.outgoing !== undefined && (
                  <MetricRow label="Outgoing Flow" value={formatNumber(selected.outgoing)} />
                )}
                {selected.costRate !== undefined && (
                  <MetricRow
                    label={selected.costLabel ?? "Cost / unit"}
                    value={formatCurrency(selected.costRate)}
                  />
                )}
                {selected.demand !== undefined && (
                  <MetricRow label="Total Demand" value={formatNumber(selected.demand)} />
                )}
                {selected.served !== undefined && (
                  <MetricRow label="Fulfilled Demand" value={formatNumber(selected.served)} />
                )}
                {selected.unmet !== undefined && selected.unmet > 0 && (
                  <MetricRow label="Unmet Shortage" value={formatNumber(selected.unmet)} warn />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  warn,
  highlighted,
}: {
  label: string;
  value: string;
  warn?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5">
      <span className="text-cyber-muted font-mono text-[11px]">{label}</span>
      <span
        className={`font-mono font-semibold ${
          warn
            ? "text-rose-400 text-glow-rose"
            : highlighted
            ? "text-cyan-400 text-glow-cyan"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
