"""
milp.py
Real Mixed-Integer Linear Program for the 4-echelon network:

    Suppliers -> Plants -> Warehouses -> Customers

Decision variables
-------------------
x[s,p]   continuous >= 0   units shipped supplier s -> plant p
y[p,w]   continuous >= 0   units shipped plant p -> warehouse w
z[w,c]   continuous >= 0   units shipped warehouse w -> customer c
open_p   binary            1 if plant p is operating
open_w   binary            1 if warehouse w is operating
unmet[c] continuous >= 0   demand at customer c that goes unserved

Objective (minimize)
---------------------
  sum(x[s,p] * procurement_cost[s])                      procurement
+ sum(y[p,w] * production_cost[p])                        production
+ sum(x[s,p] * transport_rate * dist(s,p))                transport S->P
+ sum(y[p,w] * transport_rate * dist(p,w))                transport P->W
+ sum(z[w,c] * transport_rate * dist(w,c))                transport W->C
+ sum(open_p * plant_fixed_cost[p])                       facility cost (plants)
+ sum(open_w * warehouse_fixed_cost[w])                   facility cost (warehouses)
+ sum(y[p,w] summed per warehouse * holding_cost[w])       inventory/holding
+ sum(unmet[c] * UNMET_PENALTY)                            unmet-demand penalty

Constraints
-----------
- Supplier capacity:            sum_p x[s,p] <= capacity[s]
- Plant capacity + activation:  sum_w y[p,w] <= capacity[p] * open_p
- Plant flow conservation:      sum_s x[s,p] == sum_w y[p,w]           (per plant)
- Warehouse capacity+activation:sum_c z[w,c] <= capacity[w] * open_w
- Warehouse flow conservation:  sum_p y[p,w] == sum_c z[w,c]           (per warehouse)
- Demand satisfaction:          sum_w z[w,c] + unmet[c] == demand[c]

This is solved with PuLP's bundled CBC solver. No numbers shown in the UI are
fabricated -- everything downstream is derived from this solve's variable
values.
"""

import math
from typing import List, Dict, Any
import pulp

UNMET_PENALTY = 5000.0       # cost per unit of unmet demand, used to force the
                              # model to prefer serving demand whenever feasible
TRANSPORT_RATE = 0.42        # cost per unit per km, keeps route costs realistic


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def solve_network(
    suppliers: List[Dict[str, Any]],
    plants: List[Dict[str, Any]],
    warehouses: List[Dict[str, Any]],
    customers: List[Dict[str, Any]],
    transport_cost_multiplier: float = 1.0,
) -> Dict[str, Any]:
    """Builds and solves the MILP. Every list item is a dict with the
    fields defined in schemas.py (already filtered to 'active' entities
    by the caller). Returns a fully-populated result dict."""

    S = [s["id"] for s in suppliers]
    P = [p["id"] for p in plants]
    W = [w["id"] for w in warehouses]
    C = [c["id"] for c in customers]

    s_map = {s["id"]: s for s in suppliers}
    p_map = {p["id"]: p for p in plants}
    w_map = {w["id"]: w for w in warehouses}
    c_map = {c["id"]: c for c in customers}

    rate = TRANSPORT_RATE * transport_cost_multiplier

    def dist(a, b):
        return haversine_km(a["lat"], a["lon"], b["lat"], b["lon"])

    prob = pulp.LpProblem("SupplyChainNetworkOptimization", pulp.LpMinimize)

    x = {(s, p): pulp.LpVariable(f"x_{s}_{p}", lowBound=0) for s in S for p in P}
    y = {(p, w): pulp.LpVariable(f"y_{p}_{w}", lowBound=0) for p in P for w in W}
    z = {(w, c): pulp.LpVariable(f"z_{w}_{c}", lowBound=0) for w in W for c in C}
    open_p = {p: pulp.LpVariable(f"open_p_{p}", cat="Binary") for p in P}
    open_w = {w: pulp.LpVariable(f"open_w_{w}", cat="Binary") for w in W}
    unmet = {c: pulp.LpVariable(f"unmet_{c}", lowBound=0) for c in C}

    # ---- Objective ----
    procurement_cost = pulp.lpSum(x[s, p] * s_map[s]["procurement_cost"] for s in S for p in P)
    production_cost = pulp.lpSum(y[p, w] * p_map[p]["production_cost"] for p in P for w in W)

    transport_sp = pulp.lpSum(x[s, p] * rate * dist(s_map[s], p_map[p]) for s in S for p in P)
    transport_pw = pulp.lpSum(y[p, w] * rate * dist(p_map[p], w_map[w]) for p in P for w in W)
    transport_wc = pulp.lpSum(z[w, c] * rate * dist(w_map[w], c_map[c]) for w in W for c in C)
    transport_cost = transport_sp + transport_pw + transport_wc

    facility_cost = (
        pulp.lpSum(open_p[p] * p_map[p]["fixed_cost"] for p in P)
        + pulp.lpSum(open_w[w] * w_map[w]["fixed_cost"] for w in W)
    )

    holding_cost = pulp.lpSum(
        pulp.lpSum(y[p, w] for p in P) * w_map[w]["holding_cost"] for w in W
    )

    unmet_penalty = pulp.lpSum(unmet[c] * UNMET_PENALTY for c in C)

    prob += (
        procurement_cost
        + production_cost
        + transport_cost
        + facility_cost
        + holding_cost
        + unmet_penalty
    )

    # ---- Constraints ----
    for s in S:
        prob += pulp.lpSum(x[s, p] for p in P) <= s_map[s]["capacity"], f"supplier_cap_{s}"

    for p in P:
        prob += pulp.lpSum(y[p, w] for w in W) <= p_map[p]["capacity"] * open_p[p], f"plant_cap_{p}"
        prob += pulp.lpSum(x[s, p] for s in S) == pulp.lpSum(y[p, w] for w in W), f"plant_flow_{p}"

    for w in W:
        prob += pulp.lpSum(z[w, c] for c in C) <= w_map[w]["capacity"] * open_w[w], f"wh_cap_{w}"
        prob += pulp.lpSum(y[p, w] for p in P) == pulp.lpSum(z[w, c] for c in C), f"wh_flow_{w}"

    for c in C:
        prob += pulp.lpSum(z[w, c] for w in W) + unmet[c] == c_map[c]["demand"], f"demand_{c}"

    # ---- Solve ----
    solver = pulp.PULP_CBC_CMD(msg=0)
    prob.solve(solver)

    status = pulp.LpStatus[prob.status]

    def v(var):
        val = var.value()
        return round(val, 3) if val is not None else 0.0

    shipments_sp = [
        {"from": s, "to": p, "from_type": "supplier", "to_type": "plant", "qty": v(x[s, p])}
        for s in S for p in P if v(x[s, p]) > 1e-6
    ]
    shipments_pw = [
        {"from": p, "to": w, "from_type": "plant", "to_type": "warehouse", "qty": v(y[p, w])}
        for p in P for w in W if v(y[p, w]) > 1e-6
    ]
    shipments_wc = [
        {"from": w, "to": c, "from_type": "warehouse", "to_type": "customer", "qty": v(z[w, c])}
        for w in W for c in C if v(z[w, c]) > 1e-6
    ]

    total_demand = sum(c_map[c]["demand"] for c in C)
    total_unmet = sum(v(unmet[c]) for c in C)
    served = total_demand - total_unmet
    service_level = (served / total_demand * 100) if total_demand > 0 else 100.0

    plant_decisions = [
        {
            "id": p,
            "name": p_map[p]["name"],
            "open": bool(round(open_p[p].value() or 0)),
            "throughput": v(pulp.lpSum(y[p, w] for w in W)),
            "capacity": p_map[p]["capacity"],
            "utilization_pct": round(
                (v(pulp.lpSum(y[p, w] for w in W)) / p_map[p]["capacity"] * 100)
                if p_map[p]["capacity"] > 0 else 0, 2
            ),
        }
        for p in P
    ]

    warehouse_decisions = [
        {
            "id": w,
            "name": w_map[w]["name"],
            "open": bool(round(open_w[w].value() or 0)),
            "throughput": v(pulp.lpSum(z[w, c] for c in C)),
            "capacity": w_map[w]["capacity"],
            "utilization_pct": round(
                (v(pulp.lpSum(z[w, c] for c in C)) / w_map[w]["capacity"] * 100)
                if w_map[w]["capacity"] > 0 else 0, 2
            ),
        }
        for w in W
    ]

    supplier_usage = [
        {
            "id": s,
            "name": s_map[s]["name"],
            "throughput": v(pulp.lpSum(x[s, p] for p in P)),
            "capacity": s_map[s]["capacity"],
            "utilization_pct": round(
                (v(pulp.lpSum(x[s, p] for p in P)) / s_map[s]["capacity"] * 100)
                if s_map[s]["capacity"] > 0 else 0, 2
            ),
        }
        for s in S
    ]

    customer_service = [
        {
            "id": c,
            "name": c_map[c]["name"],
            "demand": c_map[c]["demand"],
            "served": round(c_map[c]["demand"] - v(unmet[c]), 3),
            "unmet": v(unmet[c]),
        }
        for c in C
    ]

    cost_breakdown = {
        "procurement": round(pulp.value(procurement_cost) or 0, 2),
        "production": round(pulp.value(production_cost) or 0, 2),
        "transportation": round(pulp.value(transport_cost) or 0, 2),
        "facility": round(pulp.value(facility_cost) or 0, 2),
        "holding": round(pulp.value(holding_cost) or 0, 2),
        "unmet_penalty": round(pulp.value(unmet_penalty) or 0, 2),
    }

    total_cost = round(pulp.value(prob.objective) or 0, 2)

    avg_plant_util = (
        sum(pd["utilization_pct"] for pd in plant_decisions if pd["open"]) / max(1, sum(1 for pd in plant_decisions if pd["open"]))
    )
    avg_wh_util = (
        sum(wd["utilization_pct"] for wd in warehouse_decisions if wd["open"]) / max(1, sum(1 for wd in warehouse_decisions if wd["open"]))
    )

    return {
        "status": status,
        "total_cost": total_cost,
        "cost_breakdown": cost_breakdown,
        "service_level_pct": round(service_level, 2),
        "total_demand": total_demand,
        "total_unmet": round(total_unmet, 2),
        "avg_plant_utilization_pct": round(avg_plant_util, 2),
        "avg_warehouse_utilization_pct": round(avg_wh_util, 2),
        "plants": plant_decisions,
        "warehouses": warehouse_decisions,
        "suppliers": supplier_usage,
        "customers": customer_service,
        "shipments": {
            "supplier_to_plant": shipments_sp,
            "plant_to_warehouse": shipments_pw,
            "warehouse_to_customer": shipments_wc,
        },
    }
