import type {
  NetworkData,
  Supplier,
  Plant,
  Warehouse,
  Customer,
  OptimizationResult,
  ScenarioResponse,
  DisruptionResponse,
  Insight,
} from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getNetwork: () => request<NetworkData>("/network"),

  listSuppliers: () => request<Supplier[]>("/suppliers"),
  createSupplier: (s: Omit<Supplier, "id">) =>
    request<{ id: number }>("/suppliers", { method: "POST", body: JSON.stringify(s) }),
  updateSupplier: (id: number, s: Omit<Supplier, "id">) =>
    request<{ ok: boolean }>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(s) }),
  deleteSupplier: (id: number) => request<{ ok: boolean }>(`/suppliers/${id}`, { method: "DELETE" }),

  listPlants: () => request<Plant[]>("/plants"),
  createPlant: (p: Omit<Plant, "id">) =>
    request<{ id: number }>("/plants", { method: "POST", body: JSON.stringify(p) }),
  updatePlant: (id: number, p: Omit<Plant, "id">) =>
    request<{ ok: boolean }>(`/plants/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  deletePlant: (id: number) => request<{ ok: boolean }>(`/plants/${id}`, { method: "DELETE" }),

  listWarehouses: () => request<Warehouse[]>("/warehouses"),
  createWarehouse: (w: Omit<Warehouse, "id">) =>
    request<{ id: number }>("/warehouses", { method: "POST", body: JSON.stringify(w) }),
  updateWarehouse: (id: number, w: Omit<Warehouse, "id">) =>
    request<{ ok: boolean }>(`/warehouses/${id}`, { method: "PUT", body: JSON.stringify(w) }),
  deleteWarehouse: (id: number) => request<{ ok: boolean }>(`/warehouses/${id}`, { method: "DELETE" }),

  listCustomers: () => request<Customer[]>("/customers"),
  createCustomer: (c: Omit<Customer, "id">) =>
    request<{ id: number }>("/customers", { method: "POST", body: JSON.stringify(c) }),
  updateCustomer: (id: number, c: Omit<Customer, "id">) =>
    request<{ ok: boolean }>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(c) }),
  deleteCustomer: (id: number) => request<{ ok: boolean }>(`/customers/${id}`, { method: "DELETE" }),

  optimize: () => request<OptimizationResult>("/optimize", { method: "POST" }),

  runScenario: (payload: object) =>
    request<ScenarioResponse>("/scenario", { method: "POST", body: JSON.stringify(payload) }),

  runDisruption: (payload: object) =>
    request<DisruptionResponse>("/disruption", { method: "POST", body: JSON.stringify(payload) }),

  getInsights: () => request<{ insights: Insight[] }>("/insights"),
};

export function toCSV(result: OptimizationResult): string {
  const lines: string[] = [];
  lines.push("Supply Chain Network Optimization - Results Export");
  lines.push("");
  lines.push("Metric,Value");
  lines.push(`Status,${result.status}`);
  lines.push(`Total Cost,${result.total_cost}`);
  lines.push(`Service Level (%),${result.service_level_pct}`);
  lines.push(`Total Demand,${result.total_demand}`);
  lines.push(`Total Unmet Demand,${result.total_unmet}`);
  lines.push(`Avg Plant Utilization (%),${result.avg_plant_utilization_pct}`);
  lines.push(`Avg Warehouse Utilization (%),${result.avg_warehouse_utilization_pct}`);
  lines.push("");
  lines.push("Cost Component,Amount (INR)");
  Object.entries(result.cost_breakdown).forEach(([k, v]) => lines.push(`${k},${v}`));
  lines.push("");
  lines.push("Shipment Plan");
  lines.push("Leg,From ID,To ID,Quantity");
  result.shipments.supplier_to_plant.forEach((s) =>
    lines.push(`Supplier->Plant,${s.from},${s.to},${s.qty}`)
  );
  result.shipments.plant_to_warehouse.forEach((s) =>
    lines.push(`Plant->Warehouse,${s.from},${s.to},${s.qty}`)
  );
  result.shipments.warehouse_to_customer.forEach((s) =>
    lines.push(`Warehouse->Customer,${s.from},${s.to},${s.qty}`)
  );
  return lines.join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
