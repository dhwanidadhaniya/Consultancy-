/**
 * marketEntryEngine.js
 * ---------------------------------------------------------------
 * Data model, scoring/financial calculation engine, and the live
 * Claude API integration (document extraction + web-research calls)
 * for the Market Entry & Location Strategy platform.
 *
 * This file has NO React/JSX in it on purpose: it's the "backend"
 * layer — pure functions and constants — so it can be unit-tested,
 * reused, or eventually swapped for a real server-side API without
 * touching any UI code. MarketEntryPlatform.jsx imports everything
 * it needs from here.
 * ---------------------------------------------------------------
 */

export const INK = "#0F1C30";
export const SIGNAL = "#0A78FF";   // primary / strain-blue
export const GROWTH = "#0FA968";   // good / recovery-green
export const CAUTION = "#E8992A";  // warn / amber
export const ALERT = "#E2483F";    // bad / red
export const VIOLET = "#7B6EF6";   // secondary accent
export const MUTED = "#7C8AA0";

/* ---------------------------------------------------------------
   DEFAULTS — this is what the tool loads with (a fictional client,
   "Vertex Industrial Solutions", evaluating expansion into
   Maharashtra). Everything below is a STARTING POINT: use the
   "Company & project setup" panel on the Inputs tab to regenerate
   every weight, financial ratio and starter location score for a
   completely different company, industry or country from a
   handful of fields.
--------------------------------------------------------------- */

export const DEFAULT_PROJECT = {
  company: "Vertex Industrial Solutions",
  industry: "Industrial Components Manufacturing",
  currentLocation: "Pune (existing facility)",
  targetCountry: "India",
  targetRegion: "Maharashtra",
  objective: "New manufacturing facility to serve western & central India",
  budget: "\u20B9100 cr",
  horizon: "7 years",
};

export const DEFAULT_LOCATIONS = [
  { id: "mumbai", name: "Mumbai", marketOpportunity: 90, costIndex: 88, infrastructure: 92, supplyChain: 85, talent: 88, competitiveIntensity: 85, riskIndex: 35 },
  { id: "navimumbai", name: "Navi Mumbai", marketOpportunity: 87, costIndex: 62, infrastructure: 92, supplyChain: 90, talent: 82, competitiveIntensity: 55, riskIndex: 28 },
  { id: "pune", name: "Pune", marketOpportunity: 80, costIndex: 55, infrastructure: 82, supplyChain: 78, talent: 85, competitiveIntensity: 60, riskIndex: 25 },
  { id: "nashik", name: "Nashik", marketOpportunity: 68, costIndex: 38, infrastructure: 65, supplyChain: 62, talent: 60, competitiveIntensity: 35, riskIndex: 30 },
  { id: "nagpur", name: "Nagpur", marketOpportunity: 60, costIndex: 32, infrastructure: 58, supplyChain: 55, talent: 52, competitiveIntensity: 30, riskIndex: 32 },
  { id: "aurangabad", name: "Aurangabad (Chh. Sambhajinagar)", marketOpportunity: 55, costIndex: 30, infrastructure: 52, supplyChain: 58, talent: 48, competitiveIntensity: 28, riskIndex: 34 },
];

export const DEFAULT_WEIGHTS = { market: 25, cost: 15, infra: 20, supply: 20, talent: 8, competition: 5, risk: 7 };

export const DEFAULT_FIN = {
  capex: 100,
  year1Revenue: 40,
  growth: 15,
  grossMargin: 35,
  opexPct: 20,
  taxRate: 25,
  discountRate: 12,
  years: 7,
};

export const WEIGHT_LABELS = {
  market: "Market opportunity",
  cost: "Cost advantage",
  infra: "Infrastructure",
  supply: "Supply chain",
  talent: "Talent availability",
  competition: "Competitive advantage",
  risk: "Risk adjustment",
};

/* ---------------------------------------------------------------
   INDUSTRY PRESETS — the engine that lets the platform be
   re-pointed at any company with ~8 inputs. Each preset supplies
   (a) a starting scoring-weight mix and (b) starting financial
   ratios that are typical for that kind of business, plus a
   plain-language "basis" explaining why. Every value produced
   here remains a fully editable starting point, never a locked
   answer — nothing here is real market research.
--------------------------------------------------------------- */

export const INDUSTRY_PRESETS = {
  manufacturing: {
    label: "Manufacturing / industrial",
    weights: { market: 25, cost: 15, infra: 20, supply: 20, talent: 8, competition: 5, risk: 7 },
    fin: { revenueToCapex: 0.40, growth: 15, grossMargin: 35, opexPct: 20, taxRate: 25, discountRate: 12 },
    basis: "Weighted toward infrastructure and supply-chain access because plant output depends on power, logistics and raw-material flow. Capital-intensive, so revenue-to-capex and margins are set moderate and payback is slower than services businesses.",
  },
  tech: {
    label: "Technology / IT services",
    weights: { market: 30, cost: 8, infra: 8, supply: 4, talent: 32, competition: 12, risk: 6 },
    fin: { revenueToCapex: 0.70, growth: 32, grossMargin: 62, opexPct: 38, taxRate: 25, discountRate: 15 },
    basis: "Weighted toward talent and market access because output scales with skilled headcount, not physical assets. Low capex relative to revenue, higher growth and gross margin, and a higher discount rate to reflect execution/technology risk.",
  },
  retail: {
    label: "Retail / consumer / FMCG",
    weights: { market: 32, cost: 14, infra: 10, supply: 18, talent: 8, competition: 14, risk: 4 },
    fin: { revenueToCapex: 0.90, growth: 20, grossMargin: 30, opexPct: 20, taxRate: 25, discountRate: 13 },
    basis: "Weighted toward market size, competitive intensity and supply chain because catchment, footfall and distribution reach drive revenue directly. Thinner gross margins are typical of the sector.",
  },
  healthcare: {
    label: "Healthcare / pharma",
    weights: { market: 26, cost: 8, infra: 18, supply: 14, talent: 20, competition: 8, risk: 6 },
    fin: { revenueToCapex: 0.35, growth: 18, grossMargin: 48, opexPct: 24, taxRate: 25, discountRate: 13 },
    basis: "Weighted toward infrastructure, specialist talent and market demand because regulated facilities and clinical staffing are the binding constraints on rollout.",
  },
  logistics: {
    label: "Logistics / warehousing",
    weights: { market: 22, cost: 16, infra: 24, supply: 22, talent: 6, competition: 6, risk: 4 },
    fin: { revenueToCapex: 0.55, growth: 16, grossMargin: 25, opexPct: 15, taxRate: 25, discountRate: 12 },
    basis: "Weighted heavily toward infrastructure and supply-chain connectivity \u2014 the core value driver for a logistics hub. Thin operating margins are typical of the sector.",
  },
  financial: {
    label: "Financial / professional services",
    weights: { market: 28, cost: 6, infra: 10, supply: 4, talent: 30, competition: 16, risk: 6 },
    fin: { revenueToCapex: 1.00, growth: 22, grossMargin: 55, opexPct: 35, taxRate: 25, discountRate: 14 },
    basis: "Weighted toward talent and competitive/market positioning because the business is people- and relationship-driven with minimal physical capex.",
  },
  other: {
    label: "Other / general business",
    weights: { ...DEFAULT_WEIGHTS },
    fin: { revenueToCapex: 0.40, growth: 18, grossMargin: 42, opexPct: 22, taxRate: 25, discountRate: 12 },
    basis: "Balanced, generic weighting across all seven dimensions since no industry-specific pattern was selected. Adjust the sliders and financial assumptions to reflect the real business model.",
  },
};

export const RISK_TILT = {
  conservative: { cost: 6, risk: 6, market: -8, competition: -4, discountRateDelta: 2, label: "Conservative", desc: "Shifts weight toward cost control and risk avoidance, away from raw market size, and raises the return hurdle by 2 points." },
  balanced: { discountRateDelta: 0, label: "Balanced", desc: "Uses the industry preset weights and discount rate unchanged." },
  aggressive: { market: 10, competition: 4, cost: -7, risk: -7, discountRateDelta: -1, label: "Aggressive", desc: "Shifts weight toward market opportunity and competitive positioning, away from cost and risk caution, and lowers the return hurdle by 1 point." },
};

export function applyTilt(weights, tiltKey) {
  const tilt = RISK_TILT[tiltKey] || {};
  const out = { ...weights };
  Object.keys(out).forEach((k) => {
    if (typeof tilt[k] === "number") out[k] = Math.max(2, out[k] + tilt[k]);
  });
  return out;
}

/* Scenario deltas are applied ON TOP OF whatever weights/financials
   are currently active, so scenario analysis works for any company,
   not just the built-in demo. */
export const SCENARIO_TILT = {
  base: { weightDelta: {}, growthDelta: 0, marginDelta: 0, label: "Base case", desc: "Current assumptions and weights, unchanged." },
  bull: { weightDelta: { market: 5, cost: -6, risk: 1 }, growthDelta: 6, marginDelta: 3, label: "Bull case", desc: "Upside scenario: assumes stronger demand (+6pt revenue growth, +3pt gross margin) and tilts strategic priority further toward market opportunity, away from raw cost." },
  bear: { weightDelta: { market: -8, cost: 10, risk: 5, infra: -3, supply: -2 }, growthDelta: -8, marginDelta: -4, label: "Bear case", desc: "Downside scenario: assumes weaker demand (\u22128pt revenue growth, \u22124pt gross margin) and tilts priority toward cost control and risk mitigation." },
};

export function scenarioWeights(baseWeights, tiltKey) {
  const tilt = SCENARIO_TILT[tiltKey].weightDelta;
  const out = { ...baseWeights };
  Object.keys(out).forEach((k) => {
    if (typeof tilt[k] === "number") out[k] = Math.max(2, out[k] + tilt[k]);
  });
  return out;
}

export const CURRENCIES = [
  { symbol: "\u20B9", label: "\u20B9 INR" },
  { symbol: "$", label: "$ USD" },
  { symbol: "\u20AC", label: "\u20AC EUR" },
  { symbol: "\u00A3", label: "\u00A3 GBP" },
  { symbol: "\u00A5", label: "\u00A5 JPY/CNY" },
];
export const UNIT_OPTIONS = ["cr", "M", "K", "actual"];

/* ---------------------------------------------------------------
   STARTER LOCATION GENERATOR — when a user types in candidate
   location names for a new company, we can't know their real
   scores. Instead of leaving them blank or copying the demo data,
   we generate a deterministic (same name -> same numbers every
   time, not random) starter score in a realistic 40-80 band, so
   there's something to look at immediately. Every one of these is
   flagged "starting estimate" in the UI and is fully editable.
--------------------------------------------------------------- */

export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
export function seededScore(name, dim) {
  const h = hashStr(`${name}|${dim}`);
  return 40 + (h % 41); // deterministic value in [40, 80]
}
export function makeStarterLocation(name, idx) {
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "loc"}-${idx}`;
  return {
    id,
    name,
    marketOpportunity: seededScore(name, "market"),
    costIndex: seededScore(name, "cost"),
    infrastructure: seededScore(name, "infra"),
    supplyChain: seededScore(name, "supply"),
    talent: seededScore(name, "talent"),
    competitiveIntensity: seededScore(name, "comp"),
    riskIndex: seededScore(name, "risk"),
    isStarter: true,
  };
}

/* ---------------------------------------------------------------
   CALCULATION ENGINE — deterministic, auditable, works for any
   company/industry/currency since nothing here is hard-coded to
   the demo data.
--------------------------------------------------------------- */

export function normalizeWeights(w) {
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const out = {};
  Object.keys(w).forEach((k) => (out[k] = (w[k] / total) * 100));
  return out;
}

export function scoreLocation(loc, weights) {
  const nw = normalizeWeights(weights);
  const costAdvantage = 100 - loc.costIndex;
  const competitiveAdvantage = 100 - loc.competitiveIntensity;
  const riskAdjustment = 100 - loc.riskIndex;
  const parts = {
    market: { raw: loc.marketOpportunity, weight: nw.market },
    cost: { raw: costAdvantage, weight: nw.cost },
    infra: { raw: loc.infrastructure, weight: nw.infra },
    supply: { raw: loc.supplyChain, weight: nw.supply },
    talent: { raw: loc.talent, weight: nw.talent },
    competition: { raw: competitiveAdvantage, weight: nw.competition },
    risk: { raw: riskAdjustment, weight: nw.risk },
  };
  let total = 0;
  Object.values(parts).forEach((p) => (total += (p.raw * p.weight) / 100));
  return { score: Math.round(total * 10) / 10, parts };
}

export function rankLocations(locations, weights) {
  return locations
    .map((loc) => ({ ...loc, ...scoreLocation(loc, weights) }))
    .sort((a, b) => b.score - a.score);
}

export function tierFor(score) {
  if (score > 80) return { label: "Strongly recommended", tone: "good" };
  if (score >= 70) return { label: "Recommended", tone: "good" };
  if (score >= 60) return { label: "Conditional", tone: "warn" };
  return { label: "Not recommended", tone: "bad" };
}

export function buildProjections(fin, growthDelta = 0, marginDelta = 0) {
  const growth = (fin.growth + growthDelta) / 100;
  const margin = (fin.grossMargin + marginDelta) / 100;
  const opexPct = fin.opexPct / 100;
  const tax = fin.taxRate / 100;
  const da = fin.capex / fin.years;
  const rows = [];
  for (let y = 1; y <= fin.years; y++) {
    const revenue = fin.year1Revenue * Math.pow(1 + growth, y - 1);
    const grossProfit = revenue * margin;
    const opex = revenue * opexPct;
    const ebitda = grossProfit - opex;
    const ebit = ebitda - da;
    const taxAmt = Math.max(0, ebit * tax);
    const netIncome = ebit - taxAmt;
    const fcf = netIncome + da;
    rows.push({ year: y, revenue, ebitda, ebit, netIncome, fcf });
  }
  return rows;
}

export function npv(rate, cashflows) {
  return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
}

export function irr(cashflows) {
  let lo = -0.9, hi = 3;
  let fLo = npv(lo, cashflows);
  let fHi = npv(hi, cashflows);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, cashflows);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLo * fMid < 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
  }
  return (lo + hi) / 2;
}

export function financialSummary(fin, growthDelta = 0, marginDelta = 0) {
  const rows = buildProjections(fin, growthDelta, marginDelta);
  const cashflows = [-fin.capex, ...rows.map((r) => r.fcf)];
  const discount = fin.discountRate / 100;
  const netPresentValue = npv(discount, cashflows);
  const rate = irr(cashflows);
  let cumulative = -fin.capex;
  let paybackYear = null;
  for (const r of rows) {
    cumulative += r.fcf;
    if (paybackYear === null && cumulative >= 0) paybackYear = r.year;
  }
  const roi = (rows.reduce((s, r) => s + r.fcf, 0) - fin.capex) / fin.capex;
  return { rows, netPresentValue, irrValue: rate, paybackYear, roi, discount };
}

export function formatMoney(currency, v) {
  return `${currency.symbol}${v.toFixed(1)} ${currency.unit}`;
}
export const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

export const DEFAULT_SETUP_FORM = {
  companyName: DEFAULT_PROJECT.company,
  industryKey: "manufacturing",
  currentLocation: "Pune (existing facility)",
  targetCountry: "India",
  targetRegion: "Maharashtra",
  objective: DEFAULT_PROJECT.objective,
  horizonYears: 7,
  budget: 100,
  currencySymbol: "\u20B9",
  unitLabel: "cr",
  riskAppetite: "balanced",
  locationNames: "Mumbai, Navi Mumbai, Pune, Nashik, Nagpur, Aurangabad (Chh. Sambhajinagar)",
};

/* ---------------------------------------------------------------
   LIVE AI CALLS — the platform calls the Anthropic API directly
   from the browser (no key needed, it's injected by the runtime).
   Two jobs: (1) read an uploaded financial statement and extract
   modeling assumptions, (2) research real-world location data with
   web search instead of relying on the deterministic starter
   scores. Both are best-effort: on any failure or malformed
   response we leave existing values untouched and surface an error.
--------------------------------------------------------------- */

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export function extractJson(text) {
  const cleaned = String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  const candidate = arrMatch ? arrMatch[0] : objMatch ? objMatch[0] : cleaned;
  return JSON.parse(candidate);
}

export function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp0to100(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
}

export function FIN_EXTRACT_PROMPT(company, currency) {
  return `Read the attached financial statement(s) for "${company}" and estimate the inputs needed for a discounted-cash-flow market-entry model. Figures may be in any currency/unit in the source document \u2014 just report the numeric values you find or infer and note the unit/currency you used in "notes"; the platform's display currency is ${currency.symbol} (${currency.unit}).

Return ONLY this JSON object, with your best numeric estimate for every field (use the most recent full year unless stated otherwise; infer sensibly and flag assumptions in "notes" if a figure isn't explicitly stated):
{
  "capex": number,            // planned/typical upfront capital investment, in ${currency.unit}
  "year1Revenue": number,     // most recent annual revenue, in ${currency.unit}
  "growth": number,           // historical or guided annual revenue growth, percent (e.g. 18 for 18%)
  "grossMargin": number,      // gross margin, percent
  "opexPct": number,          // operating expenses as a percent of revenue
  "taxRate": number,          // effective tax rate, percent
  "discountRate": number,     // a reasonable discount rate / WACC estimate, percent
  "years": number,            // a sensible projection horizon in years, between 3 and 10
  "notes": string             // 1-3 sentences: what you found vs. what you had to assume, and the source currency/unit
}`;
}

export function LOC_RESEARCH_PROMPT({ industry, targetCountry, targetRegion, objective, names }) {
  return `Use web search to research current, real-world conditions for the following candidate business locations in ${targetRegion ? `${targetRegion}, ` : ""}${targetCountry}, for a ${industry} company whose objective is: "${objective}". Locations: ${names.join(", ")}.

For EACH location, score 0\u2013100 (100 = best) on:
- marketOpportunity (demand, market size, growth)
- infrastructure (power, roads, ports, connectivity)
- supplyChain (proximity to suppliers/logistics network)
- talent (availability of relevant skilled labor)

And score 0\u2013100 as a LEVEL where 100 = worst on:
- costIndex (relative cost of land, labor, operations)
- competitiveIntensity (how saturated/competitive the market already is)
- riskIndex (regulatory, political, business risk)

Respond with ONLY a JSON array (no markdown, no commentary), one object per location, in exactly this shape:
[{"name": "exact location name as given", "marketOpportunity": 0-100, "costIndex": 0-100, "infrastructure": 0-100, "supplyChain": 0-100, "talent": 0-100, "competitiveIntensity": 0-100, "riskIndex": 0-100, "rationale": "one concise sentence citing what drove these scores"}]`;
}

export async function callClaude({ system, content, tools }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content }],
      ...(tools ? { tools } : {}),
    }),
  });
  if (!response.ok) throw new Error(`API error (${response.status})`);
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!text) throw new Error("No response text returned.");
  return text;
}

/* ---------------------------------------------------------------
   HIGH-LEVEL INTEGRATION HELPERS — thin wrappers around callClaude()
   that the UI layer calls. Each one is a pure async function: give
   it plain data in, get plain data (or a thrown Error) back. No
   React state is touched here, so these are easy to test or reuse
   outside the component.
--------------------------------------------------------------- */

export async function extractFinancialsFromStatement(file, { companyName, currency, currentFin }) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  let userContent;
  if (isPdf) {
    const base64 = await fileToBase64(file);
    userContent = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
      { type: "text", text: FIN_EXTRACT_PROMPT(companyName, currency) },
    ];
  } else {
    const text = await file.text();
    userContent = `${FIN_EXTRACT_PROMPT(companyName, currency)}\n\nSTATEMENT TEXT:\n${text.slice(0, 60000)}`;
  }
  const raw = await callClaude({
    system: "You extract financial-modeling assumptions from documents and respond with ONLY a single valid JSON object — no markdown fences, no commentary before or after it.",
    content: userContent,
  });
  const parsed = extractJson(raw);
  const fin = {
    capex: numOr(parsed.capex, currentFin.capex),
    year1Revenue: numOr(parsed.year1Revenue, currentFin.year1Revenue),
    growth: numOr(parsed.growth, currentFin.growth),
    grossMargin: numOr(parsed.grossMargin, currentFin.grossMargin),
    opexPct: numOr(parsed.opexPct, currentFin.opexPct),
    taxRate: numOr(parsed.taxRate, currentFin.taxRate),
    discountRate: numOr(parsed.discountRate, currentFin.discountRate),
    years: Math.max(3, Math.min(10, numOr(parsed.years, currentFin.years))),
  };
  return { fin, note: typeof parsed.notes === "string" ? parsed.notes : "" };
}

export async function researchLocationScores(locations, { industryLabel, targetCountry, targetRegion, objective }) {
  const names = locations.map((l) => l.name);
  const prompt = LOC_RESEARCH_PROMPT({ industry: industryLabel, targetCountry, targetRegion, objective, names });
  const raw = await callClaude({
    content: prompt,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });
  const parsed = extractJson(raw);
  const list = Array.isArray(parsed) ? parsed : [];
  return locations.map((loc) => {
    const match = list.find(
      (p) => p && typeof p.name === "string" && p.name.trim().toLowerCase() === loc.name.trim().toLowerCase()
    );
    if (!match) return loc;
    return {
      ...loc,
      marketOpportunity: clamp0to100(match.marketOpportunity, loc.marketOpportunity),
      costIndex: clamp0to100(match.costIndex, loc.costIndex),
      infrastructure: clamp0to100(match.infrastructure, loc.infrastructure),
      supplyChain: clamp0to100(match.supplyChain, loc.supplyChain),
      talent: clamp0to100(match.talent, loc.talent),
      competitiveIntensity: clamp0to100(match.competitiveIntensity, loc.competitiveIntensity),
      riskIndex: clamp0to100(match.riskIndex, loc.riskIndex),
      isStarter: false,
      isAiSourced: true,
      rationale: typeof match.rationale === "string" ? match.rationale : loc.rationale,
    };
  });
}

/* ---------------------------------------------------------------
   INSIGHT / NARRATIVE ENGINE — rule-based, derived from data only
--------------------------------------------------------------- */

export function narrativeFor(top, runnerUp) {
  const parts = top.parts;
  const strongest = Object.entries(parts).sort((a, b) => b[1].raw - a[1].raw)[0];
  const weakest = Object.entries(parts).sort((a, b) => a[1].raw - b[1].raw)[0];
  let sentence = `${top.name} ranks first with a location score of ${top.score.toFixed(0)}/100, driven primarily by strong ${WEIGHT_LABELS[strongest[0]].toLowerCase()} (${strongest[1].raw.toFixed(0)}/100).`;
  if (runnerUp) {
    sentence += ` It leads ${runnerUp.name} (${runnerUp.score.toFixed(0)}/100) by ${(top.score - runnerUp.score).toFixed(0)} points.`;
  }
  sentence += ` Its main relative weakness is ${WEIGHT_LABELS[weakest[0]].toLowerCase()} (${weakest[1].raw.toFixed(0)}/100), which is outweighed by its overall balance of demand, connectivity and cost.`;
  return sentence;
}

export function topDrivers(top) {
  return Object.entries(top.parts)
    .sort((a, b) => b[1].raw - a[1].raw)
    .slice(0, 3)
    .map(([k, p]) => `${WEIGHT_LABELS[k]} scores ${p.raw.toFixed(0)}/100, among the strongest of any candidate location.`);
}

export function topRisks(top, finSummary, hurdle) {
  const risks = Object.entries(top.parts)
    .sort((a, b) => a[1].raw - b[1].raw)
    .slice(0, 2)
    .map(([k, p]) => `${WEIGHT_LABELS[k]} is relatively weak at ${p.raw.toFixed(0)}/100 and should be mitigated in the implementation plan.`);
  if (finSummary.irrValue === null || finSummary.irrValue <= hurdle) {
    risks.push(`Projected IRR does not clear the ${(hurdle * 100).toFixed(0)}% discount-rate hurdle under current assumptions \u2014 revisit pricing, cost or capex plan.`);
  }
  return risks;
}

export function tradeoffs(ranked) {
  if (ranked.length < 2) return [];
  const [a, b] = ranked;
  const out = [];
  if (a.parts.cost.raw < b.parts.cost.raw) {
    out.push(`${a.name} has a higher location score but a cost disadvantage versus ${b.name} \u2014 justified here by superior market and infrastructure scores.`);
  } else {
    out.push(`${a.name} combines the top location score with a cost advantage over ${b.name}, reducing the usual cost-versus-opportunity trade-off.`);
  }
  if (a.parts.risk.raw < b.parts.risk.raw) {
    out.push(`${b.name} carries a lower risk profile than ${a.name}, worth revisiting if the risk appetite changes.`);
  }
  return out;
}
