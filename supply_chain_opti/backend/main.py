import json
import copy
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_conn, init_db
from schemas import Supplier, Plant, Warehouse, Customer, ScenarioRequest, DisruptionRequest
from optimization.milp import solve_network

app = FastAPI(title="Supply Chain Network Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def row_to_dict(row):
    return dict(row)


def fetch_all(table: str) -> List[dict]:
    with get_conn() as conn:
        rows = conn.execute(f"SELECT * FROM {table}").fetchall()
        return [row_to_dict(r) for r in rows]


def save_last_result(payload: dict):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO last_result (id, payload) VALUES (1, ?) "
            "ON CONFLICT(id) DO UPDATE SET payload = excluded.payload",
            (json.dumps(payload),),
        )


def load_last_result():
    with get_conn() as conn:
        row = conn.execute("SELECT payload FROM last_result WHERE id = 1").fetchone()
        return json.loads(row["payload"]) if row else None


# ---------------------------------------------------------------------------
# network / raw data
# ---------------------------------------------------------------------------

@app.get("/api/network")
def get_network():
    return {
        "suppliers": fetch_all("suppliers"),
        "plants": fetch_all("plants"),
        "warehouses": fetch_all("warehouses"),
        "customers": fetch_all("customers"),
        "last_result": load_last_result(),
    }


# ---------------------------------------------------------------------------
# CRUD: suppliers
# ---------------------------------------------------------------------------

@app.get("/api/suppliers")
def list_suppliers():
    return fetch_all("suppliers")


@app.post("/api/suppliers")
def create_supplier(item: Supplier):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO suppliers (name, location, lat, lon, capacity, procurement_cost, reliability, active) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (item.name, item.location, item.lat, item.lon, item.capacity,
             item.procurement_cost, item.reliability, int(item.active)),
        )
        return {"id": cur.lastrowid}


@app.put("/api/suppliers/{item_id}")
def update_supplier(item_id: int, item: Supplier):
    with get_conn() as conn:
        conn.execute(
            "UPDATE suppliers SET name=?, location=?, lat=?, lon=?, capacity=?, "
            "procurement_cost=?, reliability=?, active=? WHERE id=?",
            (item.name, item.location, item.lat, item.lon, item.capacity,
             item.procurement_cost, item.reliability, int(item.active), item_id),
        )
    return {"ok": True}


@app.delete("/api/suppliers/{item_id}")
def delete_supplier(item_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM suppliers WHERE id=?", (item_id,))
    return {"ok": True}


# ---------------------------------------------------------------------------
# CRUD: plants
# ---------------------------------------------------------------------------

@app.get("/api/plants")
def list_plants():
    return fetch_all("plants")


@app.post("/api/plants")
def create_plant(item: Plant):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO plants (name, location, lat, lon, capacity, production_cost, fixed_cost, active) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (item.name, item.location, item.lat, item.lon, item.capacity,
             item.production_cost, item.fixed_cost, int(item.active)),
        )
        return {"id": cur.lastrowid}


@app.put("/api/plants/{item_id}")
def update_plant(item_id: int, item: Plant):
    with get_conn() as conn:
        conn.execute(
            "UPDATE plants SET name=?, location=?, lat=?, lon=?, capacity=?, "
            "production_cost=?, fixed_cost=?, active=? WHERE id=?",
            (item.name, item.location, item.lat, item.lon, item.capacity,
             item.production_cost, item.fixed_cost, int(item.active), item_id),
        )
    return {"ok": True}


@app.delete("/api/plants/{item_id}")
def delete_plant(item_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM plants WHERE id=?", (item_id,))
    return {"ok": True}


# ---------------------------------------------------------------------------
# CRUD: warehouses
# ---------------------------------------------------------------------------

@app.get("/api/warehouses")
def list_warehouses():
    return fetch_all("warehouses")


@app.post("/api/warehouses")
def create_warehouse(item: Warehouse):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO warehouses (name, location, lat, lon, capacity, fixed_cost, holding_cost, active, is_potential) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (item.name, item.location, item.lat, item.lon, item.capacity,
             item.fixed_cost, item.holding_cost, int(item.active), int(item.is_potential)),
        )
        return {"id": cur.lastrowid}


@app.put("/api/warehouses/{item_id}")
def update_warehouse(item_id: int, item: Warehouse):
    with get_conn() as conn:
        conn.execute(
            "UPDATE warehouses SET name=?, location=?, lat=?, lon=?, capacity=?, "
            "fixed_cost=?, holding_cost=?, active=?, is_potential=? WHERE id=?",
            (item.name, item.location, item.lat, item.lon, item.capacity,
             item.fixed_cost, item.holding_cost, int(item.active), int(item.is_potential), item_id),
        )
    return {"ok": True}


@app.delete("/api/warehouses/{item_id}")
def delete_warehouse(item_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM warehouses WHERE id=?", (item_id,))
    return {"ok": True}


# ---------------------------------------------------------------------------
# CRUD: customers
# ---------------------------------------------------------------------------

@app.get("/api/customers")
def list_customers():
    return fetch_all("customers")


@app.post("/api/customers")
def create_customer(item: Customer):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO customers (name, location, lat, lon, demand) VALUES (?, ?, ?, ?, ?)",
            (item.name, item.location, item.lat, item.lon, item.demand),
        )
        return {"id": cur.lastrowid}


@app.put("/api/customers/{item_id}")
def update_customer(item_id: int, item: Customer):
    with get_conn() as conn:
        conn.execute(
            "UPDATE customers SET name=?, location=?, lat=?, lon=?, demand=? WHERE id=?",
            (item.name, item.location, item.lat, item.lon, item.demand, item_id),
        )
    return {"ok": True}


@app.delete("/api/customers/{item_id}")
def delete_customer(item_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM customers WHERE id=?", (item_id,))
    return {"ok": True}


# ---------------------------------------------------------------------------
# optimization
# ---------------------------------------------------------------------------

def _active_entities():
    suppliers = [s for s in fetch_all("suppliers") if s["active"]]
    plants = [p for p in fetch_all("plants") if p["active"]]
    warehouses = [w for w in fetch_all("warehouses") if w["active"] and not w["is_potential"]]
    customers = fetch_all("customers")
    return suppliers, plants, warehouses, customers


@app.post("/api/optimize")
def optimize():
    suppliers, plants, warehouses, customers = _active_entities()
    if not (suppliers and plants and warehouses and customers):
        raise HTTPException(400, "Network needs at least one active supplier, plant, warehouse and customer.")
    result = solve_network(suppliers, plants, warehouses, customers)
    save_last_result(result)
    return result


# ---------------------------------------------------------------------------
# scenario lab
# ---------------------------------------------------------------------------

@app.post("/api/scenario")
def run_scenario(req: ScenarioRequest):
    suppliers, plants, warehouses, customers = _active_entities()
    if not (suppliers and plants and warehouses and customers):
        raise HTTPException(400, "Network needs at least one active supplier, plant, warehouse and customer.")

    base_result = solve_network(suppliers, plants, warehouses, customers)

    # build the scenario variant of the network
    scen_suppliers = copy.deepcopy(suppliers)
    scen_plants = copy.deepcopy(plants)
    scen_warehouses = copy.deepcopy(warehouses)
    scen_customers = copy.deepcopy(customers)

    for s in scen_suppliers:
        s["capacity"] = s["capacity"] * req.supplier_capacity_multiplier
    for w in scen_warehouses:
        w["capacity"] = w["capacity"] * req.warehouse_capacity_multiplier
    for c in scen_customers:
        c["demand"] = max(0.0, c["demand"] * (1 + req.demand_change_pct / 100.0))

    scen_suppliers = [s for s in scen_suppliers if s["id"] not in req.disabled_supplier_ids]
    scen_warehouses = [w for w in scen_warehouses if w["id"] not in req.disabled_warehouse_ids]

    if req.activate_potential_warehouse_ids:
        all_wh = {w["id"]: w for w in fetch_all("warehouses")}
        for wid in req.activate_potential_warehouse_ids:
            if wid in all_wh:
                wh = dict(all_wh[wid])
                if wh["id"] not in [w["id"] for w in scen_warehouses]:
                    scen_warehouses.append(wh)

    if not scen_suppliers or not scen_warehouses:
        raise HTTPException(400, "Scenario leaves no active suppliers or warehouses to solve against.")

    scenario_result = solve_network(
        scen_suppliers, scen_plants, scen_warehouses, scen_customers,
        transport_cost_multiplier=req.transport_cost_multiplier,
    )

    comparison = _compare(base_result, scenario_result)

    return {
        "label": req.label,
        "base": base_result,
        "scenario": scenario_result,
        "comparison": comparison,
    }


# ---------------------------------------------------------------------------
# risk & resilience: node disruption simulation
# ---------------------------------------------------------------------------

@app.post("/api/disruption")
def run_disruption(req: DisruptionRequest):
    suppliers, plants, warehouses, customers = _active_entities()
    if not (suppliers and plants and warehouses and customers):
        raise HTTPException(400, "Network needs at least one active supplier, plant, warehouse and customer.")

    base_result = solve_network(suppliers, plants, warehouses, customers)

    d_suppliers = copy.deepcopy(suppliers)
    d_plants = copy.deepcopy(plants)
    d_warehouses = copy.deepcopy(warehouses)

    if req.node_type == "supplier":
        d_suppliers = [s for s in d_suppliers if s["id"] != req.node_id]
    elif req.node_type == "plant":
        d_plants = [p for p in d_plants if p["id"] != req.node_id]
    elif req.node_type == "warehouse":
        d_warehouses = [w for w in d_warehouses if w["id"] != req.node_id]
    else:
        raise HTTPException(400, "node_type must be supplier, plant or warehouse")

    if not d_suppliers or not d_plants or not d_warehouses:
        disrupted_result = {
            "status": "Infeasible",
            "total_cost": None,
            "cost_breakdown": {},
            "service_level_pct": 0,
            "total_demand": sum(c["demand"] for c in customers),
            "total_unmet": sum(c["demand"] for c in customers),
            "avg_plant_utilization_pct": 0,
            "avg_warehouse_utilization_pct": 0,
            "plants": [], "warehouses": [], "suppliers": [], "customers": [],
            "shipments": {"supplier_to_plant": [], "plant_to_warehouse": [], "warehouse_to_customer": []},
        }
    else:
        disrupted_result = solve_network(d_suppliers, d_plants, d_warehouses, customers)

    comparison = _compare(base_result, disrupted_result)

    # identify which alternate routes appeared in the disrupted solve that
    # weren't used in the base solve, as a simple "alternative routes" signal
    def route_set(result, leg):
        return {(r["from"], r["to"]) for r in result["shipments"][leg]}

    alt_routes = {}
    for leg in ["supplier_to_plant", "plant_to_warehouse", "warehouse_to_customer"]:
        base_routes = route_set(base_result, leg)
        new_routes = route_set(disrupted_result, leg) - base_routes
        alt_routes[leg] = [{"from": f, "to": t} for f, t in new_routes]

    return {
        "node_type": req.node_type,
        "node_id": req.node_id,
        "base": base_result,
        "disrupted": disrupted_result,
        "comparison": comparison,
        "alternative_routes": alt_routes,
    }


def _compare(base: dict, other: dict) -> dict:
    def delta(a, b):
        if a in (None, 0):
            return None
        return round((b - a) / a * 100, 2) if a else None

    return {
        "cost_delta_pct": delta(base["total_cost"], other["total_cost"]) if other.get("total_cost") is not None else None,
        "service_level_delta_pts": round((other["service_level_pct"] - base["service_level_pct"]), 2),
        "unmet_delta": round((other["total_unmet"] - base["total_unmet"]), 2),
        "plant_utilization_delta_pts": round(
            (other["avg_plant_utilization_pct"] - base["avg_plant_utilization_pct"]), 2
        ),
        "warehouse_utilization_delta_pts": round(
            (other["avg_warehouse_utilization_pct"] - base["avg_warehouse_utilization_pct"]), 2
        ),
    }


# ---------------------------------------------------------------------------
# strategic insights (derived from the last optimization run)
# ---------------------------------------------------------------------------

@app.get("/api/insights")
def get_insights():
    result = load_last_result()
    if not result:
        raise HTTPException(400, "Run an optimization first (POST /api/optimize).")

    suppliers = {s["id"]: s for s in fetch_all("suppliers")}
    plants = {p["id"]: p for p in fetch_all("plants")}
    warehouses = {w["id"]: w for w in fetch_all("warehouses")}
    customers = {c["id"]: c for c in fetch_all("customers")}

    name_lookup = {
        "supplier": suppliers, "plant": plants, "warehouse": warehouses, "customer": customers
    }

    insights = []

    # most expensive route (recompute an approximate per-route cost using distance)
    from optimization.milp import haversine_km, TRANSPORT_RATE
    all_shipments = (
        [(*s.values(),) for s in []]  # placeholder, unused
    )

    def route_cost(leg_key, from_map, to_map):
        best = None
        for r in result["shipments"][leg_key]:
            f = from_map.get(r["from"])
            t = to_map.get(r["to"])
            if not f or not t:
                continue
            dist = haversine_km(f["lat"], f["lon"], t["lat"], t["lon"])
            cost = dist * TRANSPORT_RATE * r["qty"]
            if best is None or cost > best[0]:
                best = (cost, f["name"], t["name"], r["qty"])
        return best

    candidates = [
        route_cost("supplier_to_plant", suppliers, plants),
        route_cost("plant_to_warehouse", plants, warehouses),
        route_cost("warehouse_to_customer", warehouses, customers),
    ]
    candidates = [c for c in candidates if c]
    if candidates:
        best = max(candidates, key=lambda c: c[0])
        insights.append({
            "type": "most_expensive_route",
            "title": "Most expensive route",
            "detail": f"{best[1]} \u2192 {best[2]} carries the highest transportation cost on the network "
                      f"at roughly \u20b9{best[0]:,.0f} for {best[3]:,.0f} units.",
        })

    # highest / lowest utilized facility
    all_facilities = (
        [{"name": p["name"], "util": p["utilization_pct"], "kind": "plant"} for p in result["plants"] if p["open"]]
        + [{"name": w["name"], "util": w["utilization_pct"], "kind": "warehouse"} for w in result["warehouses"] if w["open"]]
    )
    if all_facilities:
        highest = max(all_facilities, key=lambda f: f["util"])
        lowest = min(all_facilities, key=lambda f: f["util"])
        insights.append({
            "type": "highest_utilized_facility",
            "title": "Highest-utilized facility",
            "detail": f"{highest['name']} is running at {highest['util']:.1f}% of capacity, "
                      f"the tightest {highest['kind']} in the network.",
        })
        insights.append({
            "type": "underutilized_facility",
            "title": "Underutilized facility",
            "detail": f"{lowest['name']} is running at only {lowest['util']:.1f}% of capacity, "
                      f"suggesting spare {lowest['kind']} capacity worth reviewing.",
        })

    # largest cost component
    cb = result["cost_breakdown"]
    if cb:
        largest_component = max(cb.items(), key=lambda kv: kv[1])
        insights.append({
            "type": "largest_cost_component",
            "title": "Largest cost component",
            "detail": f"{largest_component[0].replace('_', ' ').title()} is the single largest cost bucket "
                      f"at \u20b9{largest_component[1]:,.0f}, worth targeting first for savings.",
        })

    # largest potential saving: compare open facilities' utilization vs low-util ones
    if all_facilities:
        low_util = [f for f in all_facilities if f["util"] < 40]
        if low_util:
            f = min(low_util, key=lambda x: x["util"])
            insights.append({
                "type": "largest_potential_saving",
                "title": "Largest potential saving",
                "detail": f"{f['name']} is under 40% utilized ({f['util']:.1f}%) \u2014 consolidating its "
                          f"volume elsewhere could avoid its fixed operating cost in future scenarios.",
            })

    # supplier dependency
    if result["suppliers"]:
        top_supplier = max(result["suppliers"], key=lambda s: s["throughput"])
        total_supply = sum(s["throughput"] for s in result["suppliers"]) or 1
        share = top_supplier["throughput"] / total_supply * 100
        insights.append({
            "type": "supplier_dependency",
            "title": "Supplier dependency",
            "detail": f"{top_supplier['name']} supplies {share:.1f}% of total input volume, "
                      f"a concentration risk if that supplier is disrupted.",
        })

    # recommended facility changes
    closed = [p["name"] for p in result["plants"] if not p["open"]] + [w["name"] for w in result["warehouses"] if not w["open"]]
    if closed:
        insights.append({
            "type": "recommended_facility_change",
            "title": "Recommended facility change",
            "detail": f"The model recommends keeping {', '.join(closed)} closed under current demand \u2014 "
                      f"their fixed costs outweigh the network benefit.",
        })
    elif all_facilities and min(f["util"] for f in all_facilities) < 35:
        f = min(all_facilities, key=lambda x: x["util"])
        insights.append({
            "type": "recommended_facility_change",
            "title": "Recommended facility change",
            "detail": f"Consider testing a scenario with {f['name']} closed \u2014 "
                      f"it is currently underused at {f['util']:.1f}%.",
        })

    return {"insights": insights}


@app.get("/")
def root():
    return {
        "message": "Supply Chain Network Optimizer API",
        "docs": "/docs",
    }
