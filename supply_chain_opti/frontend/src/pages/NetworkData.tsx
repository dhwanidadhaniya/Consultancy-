import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Supplier, Plant, Warehouse, Customer } from "../types";
import EntityManager, { FieldDef } from "../components/EntityManager";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { Database, Truck, Factory, Warehouse as WarehouseIcon, Users, Server, HardDrive } from "lucide-react";
import StatCard from "../components/StatCard";
import { formatNumber } from "../lib/utils";

type Tab = "suppliers" | "plants" | "warehouses" | "customers";

const supplierFields: FieldDef[] = [
  { key: "name", label: "Supplier Name", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "lat", label: "Latitude", type: "number", step: "0.0001" },
  { key: "lon", label: "Longitude", type: "number", step: "0.0001" },
  { key: "capacity", label: "Capacity (units)", type: "number" },
  { key: "procurement_cost", label: "Procurement Cost (\u20b9/unit)", type: "number" },
  { key: "reliability", label: "Reliability (0–1)", type: "number", step: "0.01" },
  { key: "active", label: "Active Status", type: "checkbox" },
];

const plantFields: FieldDef[] = [
  { key: "name", label: "Plant Name", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "lat", label: "Latitude", type: "number", step: "0.0001" },
  { key: "lon", label: "Longitude", type: "number", step: "0.0001" },
  { key: "capacity", label: "Capacity (units)", type: "number" },
  { key: "production_cost", label: "Production Cost (\u20b9/unit)", type: "number" },
  { key: "fixed_cost", label: "Fixed Facility Cost (\u20b9)", type: "number" },
  { key: "active", label: "Active Status", type: "checkbox" },
];

const warehouseFields: FieldDef[] = [
  { key: "name", label: "Warehouse Name", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "lat", label: "Latitude", type: "number", step: "0.0001" },
  { key: "lon", label: "Longitude", type: "number", step: "0.0001" },
  { key: "capacity", label: "Capacity (units)", type: "number" },
  { key: "fixed_cost", label: "Fixed Facility Cost (\u20b9)", type: "number" },
  { key: "holding_cost", label: "Holding Cost (\u20b9/unit)", type: "number" },
  { key: "active", label: "Active Status", type: "checkbox" },
  { key: "is_potential", label: "Potential Site", type: "checkbox" },
];

const customerFields: FieldDef[] = [
  { key: "name", label: "Customer Cluster", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "lat", label: "Latitude", type: "number", step: "0.0001" },
  { key: "lon", label: "Longitude", type: "number", step: "0.0001" },
  { key: "demand", label: "Regional Demand (units)", type: "number" },
];

export default function NetworkData() {
  const [tab, setTab] = useState<Tab>("suppliers");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const reload = async () => {
    const [s, p, w, c] = await Promise.all([
      api.listSuppliers(),
      api.listPlants(),
      api.listWarehouses(),
      api.listCustomers(),
    ]);
    setSuppliers(s);
    setPlants(p);
    setWarehouses(w);
    setCustomers(c);
  };

  useEffect(() => {
    reload();
  }, []);

  const totalDemand = customers.reduce((sum, c) => sum + c.demand, 0);
  const totalSupplyCap = suppliers.reduce((sum, s) => sum + s.capacity, 0);
  const totalPlantCap = plants.reduce((sum, p) => sum + p.capacity, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={18} className="text-cyan-400" />
            <h1 className="font-display font-extrabold text-2xl text-white">Network Topology Registry</h1>
          </div>
          <p className="text-xs text-cyber-muted">
            Configure raw supply sources, manufacturing plants, distribution centers, and regional demand clusters.
          </p>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Supply Capacity"
          value={`${formatNumber(totalSupplyCap)} units`}
          icon={Truck}
          tone="cyan"
          sub={`${suppliers.length} Active Suppliers`}
        />
        <StatCard
          label="Plant Capacity"
          value={`${formatNumber(totalPlantCap)} units`}
          icon={Factory}
          tone="purple"
          sub={`${plants.length} Production Plants`}
        />
        <StatCard
          label="Distribution Network"
          value={`${warehouses.length} DCs`}
          icon={WarehouseIcon}
          tone="good"
          sub={`${warehouses.filter((w) => w.is_potential).length} Potential expansion sites`}
        />
        <StatCard
          label="Market Demand"
          value={`${formatNumber(totalDemand)} units`}
          icon={Users}
          tone="cyan"
          sub={`${customers.length} Customer Zones`}
        />
      </div>

      {/* Watermelon UI Animated Tabs Navigation */}
      <AnimatedTabs
        activeTab={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "suppliers", label: "Suppliers", icon: Truck, count: suppliers.length },
          { id: "plants", label: "Plants", icon: Factory, count: plants.length },
          { id: "warehouses", label: "Warehouses / DCs", icon: WarehouseIcon, count: warehouses.length },
          { id: "customers", label: "Customer Demand", icon: Users, count: customers.length },
        ]}
      />

      {/* Active Tab Entity Manager */}
      {tab === "suppliers" && (
        <EntityManager<Supplier>
          title="Supply Sources"
          description="Raw material and component suppliers feeding downstream manufacturing facilities."
          fields={supplierFields}
          items={suppliers}
          emptyItem={{ name: "", location: "", lat: 20, lon: 78, capacity: 1000, procurement_cost: 100, reliability: 0.9, active: true }}
          onCreate={async (i) => { await api.createSupplier(i); reload(); }}
          onUpdate={async (id, i) => { await api.updateSupplier(id, i); reload(); }}
          onDelete={async (id) => { await api.deleteSupplier(id); reload(); }}
        />
      )}

      {tab === "plants" && (
        <EntityManager<Plant>
          title="Manufacturing Plants"
          description="Processing facilities that transform components into finished inventory."
          fields={plantFields}
          items={plants}
          emptyItem={{ name: "", location: "", lat: 20, lon: 78, capacity: 3000, production_cost: 200, fixed_cost: 15000, active: true }}
          onCreate={async (i) => { await api.createPlant(i); reload(); }}
          onUpdate={async (id, i) => { await api.updatePlant(id, i); reload(); }}
          onDelete={async (id) => { await api.deletePlant(id); reload(); }}
        />
      )}

      {tab === "warehouses" && (
        <EntityManager<Warehouse>
          title="Warehouses & Fulfillment Centers"
          description="Distribution nodes holding finished inventory. Set 'Potential Site' to test network expansion scenarios."
          fields={warehouseFields}
          items={warehouses}
          emptyItem={{ name: "", location: "", lat: 20, lon: 78, capacity: 3000, fixed_cost: 8000, holding_cost: 5, active: true, is_potential: false }}
          onCreate={async (i) => { await api.createWarehouse(i); reload(); }}
          onUpdate={async (id, i) => { await api.updateWarehouse(id, i); reload(); }}
          onDelete={async (id) => { await api.deleteWarehouse(id); reload(); }}
        />
      )}

      {tab === "customers" && (
        <EntityManager<Customer>
          title="Customer Demand Zones"
          description="Regional demand clusters requiring product fulfillment."
          fields={customerFields}
          items={customers}
          emptyItem={{ name: "", location: "", lat: 20, lon: 78, demand: 1000 }}
          onCreate={async (i) => { await api.createCustomer(i); reload(); }}
          onUpdate={async (id, i) => { await api.updateCustomer(id, i); reload(); }}
          onDelete={async (id) => { await api.deleteCustomer(id); reload(); }}
        />
      )}
    </div>
  );
}
