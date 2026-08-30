# Market Entry & Location Strategy Platform

An interactive consulting tool that scores and ranks candidate expansion locations for a company, models the financial case (NPV / IRR / payback / sensitivity), and generates a consulting-style recommendation — all from a handful of company inputs (industry, budget, risk appetite, candidate locations).

Built as a portfolio project to demonstrate a management-consulting-style market-entry framework (location scoring + DCF valuation + scenario analysis) as a working product, not just a slide deck.

---

## What it does

- **Company & project setup** — enter a company name, industry, target country/region, budget and candidate locations; the platform auto-generates sensible starting weights and financial ratios for that industry.
- **Location scoring** — ranks candidate locations on 7 weighted dimensions (market opportunity, cost, infrastructure, supply chain, talent, competitive intensity, risk), with every weight editable and every score auditable ("view calculation").
- **Financial model** — builds a multi-year revenue/EBITDA/FCF projection and computes NPV, IRR, payback period and ROI from capex, growth, margin, opex and discount-rate assumptions.
- **Scenario & sensitivity** — bull/bear/base case toggles and a tornado chart showing which assumption moves NPV the most.
- **Insight engine** — a rule-based narrative layer that turns the scored data into a plain-English recommendation (ENTER / CONDITIONAL ENTRY / DO NOT ENTER), key drivers, key risks, and trade-offs — regenerated automatically whenever the underlying data changes.
- **AI-assisted data entry (optional)** — upload a financial statement (PDF/text) and have Claude extract DCF assumptions into the model; or trigger a live web-search call to have Claude research real-world location scores instead of using the deterministic starter estimates.

Every number in the tool is a fully editable starting point, not a locked answer — nothing is presented as verified market research unless it was AI-researched or manually entered, and both cases are labeled in the UI.

---

## Tech stack

- **React** (hooks-based, no external state library)
- **Recharts** for the radar chart, tornado/bar chart and financial trend lines
- **Tailwind CSS** utility classes for styling
- **Anthropic API** (`claude-sonnet-4-6`) for the two optional AI-assisted features (financial-statement extraction and location research with web search)

---

## Project structure

```
├── marketEntryEngine.js      # Data model, scoring/DCF math, Claude API integration
├── MarketEntryPlatform.jsx   # React app: state, UI, charts, tables, insight narrative
└── README.md
```

The project is deliberately split into a **logic/engine layer** and a **UI/application layer**:

| File | Responsibility |
|---|---|
| `marketEntryEngine.js` | Industry presets, scoring weights, the location-scoring formula, the DCF engine (NPV/IRR/payback), and all Claude API calls (prompt construction, document extraction, web-research). Pure functions and constants — no JSX, easy to unit test or later move behind a real backend/API route. |
| `MarketEntryPlatform.jsx` | The React component tree: all hooks/state, dashboard tabs, charts, tables, and the rule-based insight/recommendation narrative. Imports everything it needs from `marketEntryEngine.js`. |

`MarketEntryPlatform.jsx` imports from `./marketEntryEngine`, so both files must live in the same directory.

---

## Getting started

This repo currently ships the two source files above; to run them locally you need a small React build wrapper. The quickest path is Vite:

```bash
# 1. scaffold a React app
npm create vite@latest market-entry-platform -- --template react
cd market-entry-platform

# 2. install dependencies
npm install recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. copy in the project files
cp path/to/marketEntryEngine.js src/
cp path/to/MarketEntryPlatform.jsx src/

# 4. render it from src/App.jsx
```

```jsx
// src/App.jsx
import MarketEntryPlatform from "./MarketEntryPlatform";

export default function App() {
  return <MarketEntryPlatform />;
}
```

Make sure Tailwind's `content` config in `tailwind.config.js` includes `./src/**/*.{js,jsx}`, and that `src/index.css` has the standard `@tailwind base; @tailwind components; @tailwind utilities;` directives.

```bash
npm run dev
```

### API key / backend note

`marketEntryEngine.js` currently calls `https://api.anthropic.com/v1/messages` **directly from the browser**. That's fine for a sandboxed demo environment where the key is injected at runtime, but it is **not safe for a real deployment** — it would expose your Anthropic API key to anyone who opens dev tools. Before shipping this publicly, route `callClaude()` through a small backend endpoint (e.g. a Node/Express or serverless function) that holds the API key server-side and forwards requests. The two AI-assisted features (`extractFinancialsFromStatement`, `researchLocationScores`) are isolated in `marketEntryEngine.js` specifically so this swap is a one-file change.

---

## How the scoring works

Each location gets a 0–100 raw score on 7 dimensions. Cost, competitive intensity and risk are entered as "level" scores (higher = worse) and inverted before weighting. Weights are normalized to sum to 100%, then:

```
Location score = Σ (raw sub-score × normalized weight) ÷ 100
```

The financial model discounts a multi-year free-cash-flow projection at the chosen discount rate to get NPV, and solves for IRR via bisection. The overall recommendation combines both: **ENTER** requires a location score ≥ 70 *and* an IRR above the discount-rate hurdle.

---

## Contributors

| | Focus |
|---|---|
| **[Colleague name]** | Scoring & financial engine, Claude API integration (`marketEntryEngine.js`) |
| **[Your name]** | Application UI, dashboards, charts, consulting narrative (`MarketEntryPlatform.jsx`) |

---

## Status / possible next steps

- [ ] Move `callClaude()` behind a backend proxy before any public deployment
- [ ] Add persistence (save/load a project instead of resetting on refresh)
- [ ] Add PDF/PPT export of the executive summary
- [ ] Unit tests for the scoring and DCF functions in `marketEntryEngine.js`

## License

Add a license (e.g. MIT) here before making the repo public.
