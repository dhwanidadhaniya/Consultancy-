# Supply Chain Network Optimization

A full-stack decision-support tool that optimizes a four-echelon supply chain
network — **Suppliers → Manufacturing Plants → Warehouses → Customers** —
using a real Mixed-Integer Linear Program (MILP), built as a university
Operations & Strategy portfolio project.

> All facility names, locations, capacities and costs are **illustrative
> fictional data** (loosely anchored to real Indian cities so distances, and
> therefore transport costs, come out realistic). This is a coursework
> project, not a real company's network.

## What it does

- Models the network as a real MILP (shipment flows, plant/warehouse
  open/close binaries, capacity, flow-conservation and demand constraints)
  and solves it with [PuLP](https://coin-or.github.io/pulp/) (CBC solver).
- Every number shown in the UI — total cost, cost breakdown, utilization,
  service level, shipment plan — comes directly from that solve. Nothing is
  hard-coded or faked.
- Lets you edit the underlying network data (CRUD on suppliers, plants,
  warehouses, customers), re-run the optimizer, test "what-if" scenarios,
  simulate node failures, and view auto-generated business insights.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS, Recharts, React Flow, Lucide icons |
| Backend | Python, FastAPI, Pandas, NumPy, PuLP |
| Database | SQLite |

## Project structure

```
supply-chain-optimizer/
├── backend/
│   ├── main.py                 FastAPI app + all REST endpoints
│   ├── database.py             SQLite schema + seed data
│   ├── schemas.py              Pydantic models
│   ├── optimization/
│   │   └── milp.py             The MILP model (PuLP)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         NetworkGraph, charts, EntityManager, Sidebar…
│   │   ├── pages/               Dashboard, NetworkData, Optimization,
│   │   │                        ScenarioLab, RiskResilience, Insights
│   │   ├── services/api.ts     REST client + CSV export
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── package.json
│   └── ...vite/tailwind config
└── README.md
```

## Setup & run locally

You'll need Python 3.10+ and Node.js 18+.

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`). A `supply_chain.db` SQLite file is created
automatically on first run and seeded with the sample network.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` requests
to the FastAPI backend on port 8000.

## Suggested walkthrough

1. **Dashboard** — view the raw network map (no optimization run yet).
2. **Network Data** — add, edit or deactivate a supplier/plant/warehouse/customer.
3. **Optimize Network** — click "Optimize Network" to solve the MILP and see
   the cost-minimizing shipment plan, facility open/close decisions, cost
   breakdown and utilization.
4. **Scenario Lab** — bump demand +20%, raise transport cost, or disable a
   warehouse, then compare the scenario against the base case.
5. **Risk & Resilience** — simulate a supplier or plant failure and see the
   cost/service-level impact and any new routes the model had to use.
6. **Network Insights** — read the auto-generated, data-driven observations
   (most expensive route, most/least utilized facility, largest cost driver,
   supplier concentration risk, etc.)
7. Export results to CSV from the Optimize Network page.

## The optimization model

**Decision variables**
- `x[s,p]`, `y[p,w]`, `z[w,c]` — continuous shipment quantities on each leg
- `open_p`, `open_w` — binary facility activation variables
- `unmet[c]` — continuous unmet demand per customer (with a penalty cost, so
  the model only leaves demand unmet when the network is genuinely infeasible
  or uneconomical to fully serve)

**Objective** — minimize the sum of procurement, production, transportation
(distance-based, using haversine distance between facility coordinates),
facility fixed costs, warehouse holding costs, and an unmet-demand penalty.

**Constraints** — supplier/plant/warehouse capacity, flow conservation at
plants and warehouses, and demand satisfaction at each customer cluster.

See `backend/optimization/milp.py` for the full formulation.
