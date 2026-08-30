export interface Supplier {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
  capacity: number;
  procurement_cost: number;
  reliability: number;
  active: boolean | number;
}

export interface Plant {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
  capacity: number;
  production_cost: number;
  fixed_cost: number;
  active: boolean | number;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
  capacity: number;
  fixed_cost: number;
  holding_cost: number;
  active: boolean | number;
  is_potential: boolean | number;
}

export interface Customer {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
  demand: number;
}

export interface Shipment {
  from: number;
  to: number;
  from_type: string;
  to_type: string;
  qty: number;
}

export interface FacilityDecision {
  id: number;
  name: string;
  open: boolean;
  throughput: number;
  capacity: number;
  utilization_pct: number;
}

export interface SupplierUsage {
  id: number;
  name: string;
  throughput: number;
  capacity: number;
  utilization_pct: number;
}

export interface CustomerService {
  id: number;
  name: string;
  demand: number;
  served: number;
  unmet: number;
}

export interface CostBreakdown {
  procurement: number;
  production: number;
  transportation: number;
  facility: number;
  holding: number;
  unmet_penalty: number;
}

export interface OptimizationResult {
  status: string;
  total_cost: number | null;
  cost_breakdown: CostBreakdown;
  service_level_pct: number;
  total_demand: number;
  total_unmet: number;
  avg_plant_utilization_pct: number;
  avg_warehouse_utilization_pct: number;
  plants: FacilityDecision[];
  warehouses: FacilityDecision[];
  suppliers: SupplierUsage[];
  customers: CustomerService[];
  shipments: {
    supplier_to_plant: Shipment[];
    plant_to_warehouse: Shipment[];
    warehouse_to_customer: Shipment[];
  };
}

export interface NetworkData {
  suppliers: Supplier[];
  plants: Plant[];
  warehouses: Warehouse[];
  customers: Customer[];
  last_result: OptimizationResult | null;
}

export interface ComparisonMetrics {
  cost_delta_pct: number | null;
  service_level_delta_pts: number;
  unmet_delta: number;
  plant_utilization_delta_pts: number;
  warehouse_utilization_delta_pts: number;
}

export interface ScenarioResponse {
  label: string;
  base: OptimizationResult;
  scenario: OptimizationResult;
  comparison: ComparisonMetrics;
}

export interface DisruptionResponse {
  node_type: string;
  node_id: number;
  base: OptimizationResult;
  disrupted: OptimizationResult;
  comparison: ComparisonMetrics;
  alternative_routes: Record<string, { from: number; to: number }[]>;
}

export interface Insight {
  type: string;
  title: string;
  detail: string;
}
