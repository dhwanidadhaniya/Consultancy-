# Meridian Fabrication Group — Turnaround Dashboard

A management-review dashboard diagnosing a struggling mid-sized precision metal
manufacturer and laying out a 3-stage turnaround plan, built with a
React/Vite frontend and a small Express API backend.

## Stack

- **Frontend:** React + Vite, React Router, Recharts, plain CSS (design tokens in `src/styles/global.css`)
- **Backend:** Node.js + Express, serving synthetic-but-internally-consistent company data from `backend/data/*.js`
- **No database** — data lives in structured JS modules, which keeps the project easy to read and modify

## Running it

Requires Node.js 18+.

**Option A — one command from the project root:**

```bash
npm run install:all
npm run dev
```

This starts the API on `http://localhost:4000` and the frontend on `http://localhost:5173`
(with the Vite dev server proxying `/api/*` to the backend).

**Option B — two terminals:**

```bash
# Terminal 1
cd backend
npm install
npm start        # http://localhost:4000

# Terminal 2
cd frontend
npm install
npm run dev       # http://localhost:5173
```

Open `http://localhost:5173` in a browser.

## Project structure

```
turnaround/
  backend/
    data/company.js        # financials, operations, strategic diagnosis, turnaround score
    data/initiatives.js     # 3-stage turnaround plan + implementation tracker records
    server.js                # Express API (7 endpoints, incl. scenario simulator)
  frontend/
    src/pages/               # Overview, Financials, Operations, Strategy,
                              # TurnaroundPlan, Scenarios, Implementation
    src/components/          # Sidebar, shared UI bits (pills, insight notes, states)
    src/lib/                 # API client + formatting helpers
    src/styles/global.css    # design tokens + all component styling
```

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/company` | Company profile, plants, products, segments |
| `GET /api/kpis` | Executive KPIs + turnaround score + diagnosis summary |
| `GET /api/financials` | 5-year financial time series + interpretation notes |
| `GET /api/operations` | Operational metrics + plant-level utilization + bottlenecks |
| `GET /api/strategy` | Product/customer profitability, SWOT, root-cause → impact |
| `GET /api/initiatives` | Turnaround plan initiatives + implementation tracker |
| `POST /api/scenario` | Scenario simulator — base case vs. turnaround case |
