// Meridian Fabrication Group — synthetic but internally-consistent dataset
// Mid-sized precision metal manufacturer, FY2021–FY2025 (fiscal year = calendar year)

const company = {
  name: "Meridian Fabrication Group",
  founded: 1987,
  hq: "Dayton, Ohio",
  industry: "Precision Metal Manufacturing (Automotive & Industrial OEM Supply)",
  employees: 1420,
  plants: [
    { name: "Dayton, OH (Plant 1)", type: "Precision Machining", opened: 1987 },
    { name: "Monterrey, MX (Plant 2)", type: "Stamped Assemblies", opened: 2004 },
    { name: "Bratislava, SK (Plant 3)", type: "Precision Machining & Tooling", opened: 2011 },
  ],
  products: [
    { id: "pmc", name: "Precision Machined Components", desc: "CNC-machined structural and drivetrain components" },
    { id: "sma", name: "Stamped Metal Assemblies", desc: "High-volume stamped brackets and chassis assemblies" },
    { id: "cts", name: "Custom Tooling & Fixtures", desc: "Tooling design and short-run fixture builds" },
  ],
  regions: ["North America", "Europe", "Southeast Asia"],
  segments: [
    { id: "auto", name: "OEM Automotive", desc: "Tier-1 supply to 4 automotive OEMs" },
    { id: "indeq", name: "Industrial Equipment", desc: "Off-highway and heavy equipment manufacturers" },
    { id: "aftm", name: "Aftermarket", desc: "Replacement parts distributors" },
  ],
  years: [2021, 2022, 2023, 2024, 2025],
};

// ---- FINANCIALS (in $ millions unless noted) --------------------------------

const financials = {
  years: company.years,
  revenue:        [312.4, 328.1, 335.0, 321.6, 298.7],
  cogs:           [223.7, 239.2, 251.9, 251.1, 243.1],
  grossProfit:    [88.7, 88.9, 83.1, 70.5, 55.6],
  grossMarginPct: [28.4, 27.1, 24.8, 21.9, 18.6],
  sgaExpense:     [45.6, 47.6, 48.1, 46.0, 42.9],
  ebitda:         [41.2, 38.7, 31.5, 19.6, 9.6],
  ebitdaMarginPct:[13.2, 11.8, 9.4, 6.1, 3.2],
  depreciation:   [14.1, 14.8, 15.6, 16.4, 17.0],
  ebit:           [27.1, 23.9, 15.9, 3.2, -7.4],
  interestExpense:[6.2, 6.9, 8.4, 10.3, 12.6],
  netIncome:      [15.7, 12.2, 4.9, -6.1, -18.9],
  cashPosition:   [42.1, 38.6, 29.4, 18.2, 9.8],
  totalDebt:      [95.0, 102.3, 118.4, 133.6, 147.9],
  operatingCashFlow: [33.8, 27.4, 18.9, 6.3, -4.1],
  capex:          [16.2, 15.4, 12.1, 9.8, 7.2],
  freeCashFlow:   [17.6, 12.0, 6.8, -3.5, -11.3],
  workingCapital: [58.2, 63.9, 71.4, 79.8, 86.5],
  inventoryValue: [38.1, 41.7, 47.9, 54.2, 58.9],
  receivables:    [41.0, 43.8, 46.1, 45.9, 44.2],
  payables:       [26.4, 27.1, 26.8, 24.7, 22.3],
  costBreakdown2025: {
    "Raw Materials (Steel & Alloy)": 41.2,
    "Direct Labor": 22.8,
    "Energy & Utilities": 8.1,
    "Freight & Logistics": 6.4,
    "Scrap & Rework": 5.9,
    "Other Manufacturing Overhead": 15.6,
  },
};

// ---- OPERATIONS --------------------------------------------------------------

const operations = {
  years: company.years,
  capacityUtilizationPct: [86, 84, 78, 71, 64],
  oeePct: [79, 77, 72, 66, 60], // overall equipment effectiveness
  defectRatePct: [1.4, 1.6, 2.1, 2.9, 3.6],
  reworkCostPctOfRevenue: [0.6, 0.7, 1.0, 1.4, 2.0],
  inventoryDaysOnHand: [61, 64, 71, 79, 88],
  onTimeDeliveryPct: [96, 95, 92, 87, 82],
  leadTimeDays: [18, 19, 22, 27, 33],
  supplierOnTimePct: [94, 93, 90, 85, 81],
  revenuePerEmployee: [0.224, 0.226, 0.222, 0.210, 0.196], // $M
  plantUtilization: [
    { plant: "Dayton, OH (Plant 1)", utilization: 68, oee: 62, note: "Oldest equipment; highest defect rate" },
    { plant: "Monterrey, MX (Plant 2)", utilization: 74, oee: 69, note: "Best-performing plant; recent line upgrades" },
    { plant: "Bratislava, SK (Plant 3)", utilization: 51, oee: 49, note: "Lost a major program in 2024; excess capacity" },
  ],
  bottlenecks: [
    {
      area: "Plant 3 (Bratislava) excess capacity",
      detail: "Lost the Volkswagen bracket program in 2024; utilization fell from 79% to 51% with no offsetting volume.",
      impact: "~$6.8M annual fixed-cost drag with no matching output",
    },
    {
      area: "Dayton machining line defect rate",
      detail: "Aging CNC equipment (avg. age 14 yrs) driving tolerance drift and rework on precision components.",
      impact: "Rework/scrap costs rose from 0.6% to 2.0% of revenue over 4 years (~$6.0M in 2025)",
    },
    {
      area: "Inventory build-up",
      detail: "Inventory days rose from 61 to 88 as production planning has not adjusted to falling demand.",
      impact: "$20.8M of working capital tied up versus 2021 levels",
    },
    {
      area: "On-time delivery decline",
      detail: "OTD fell from 96% to 82%, driven by supplier delays and internal scheduling issues.",
      impact: "Two OEM customers placed Meridian on formal supplier improvement plans in 2025",
    },
  ],
};

// ---- STRATEGIC DIAGNOSIS -----------------------------------------------------

const strategic = {
  productProfitability: [
    { product: "Precision Machined Components", revenue2025: 142.6, marginPct: 22.1, trend: "declining", note: "Highest-margin line, but defect rate erosion is compressing margin" },
    { product: "Stamped Metal Assemblies", revenue2025: 108.3, marginPct: 14.8, trend: "stable", note: "Commodity-priced, volume-driven; Monterrey plant performing well" },
    { product: "Custom Tooling & Fixtures", revenue2025: 47.8, marginPct: -3.2, trend: "declining", note: "Underpriced relative to engineering cost; loss-making since 2023" },
  ],
  customerProfitability: [
    { customer: "OEM Customer A (Automotive)", revenue2025: 89.4, marginPct: 19.5, concentrationPct: 29.9, note: "Largest and most profitable account" },
    { customer: "OEM Customer B (Automotive)", revenue2025: 61.2, marginPct: 8.1, concentrationPct: 20.5, note: "Aggressive annual price-downs (LTA), margin under pressure" },
    { customer: "OEM Customer C (Industrial Equip.)", revenue2025: 54.0, marginPct: 15.2, concentrationPct: 18.1, note: "Growing account, stable pricing" },
    { customer: "OEM Customer D (Automotive)", revenue2025: 38.7, marginPct: -1.4, concentrationPct: 13.0, note: "Loss-making since 2024 due to expedited freight penalties" },
    { customer: "Aftermarket Distributors (pooled)", revenue2025: 55.4, marginPct: 16.3, concentrationPct: 18.5, note: "Fragmented, healthy margin, low growth" },
  ],
  marketPosition: {
    marketShare2025: 10.8,
    marketShare2021: 14.2,
    marketSizeGrowthPct: 2.1,
    competitivePressure: [
      "Two Southeast Asian entrants have undercut stamped-assembly pricing by 12–18% since 2023.",
      "A domestic competitor acquired a regional machining shop in 2024, gaining scale on precision components.",
      "OEM customers are consolidating supplier panels, favoring suppliers with multi-region footprints and digital quality reporting Meridian does not yet offer.",
    ],
  },
  swot: {
    strengths: [
      "Long-tenured OEM relationships (avg. 14 years with top 3 accounts)",
      "Multi-region footprint (NA, Mexico, Europe)",
      "Deep tooling and fixture engineering capability",
    ],
    weaknesses: [
      "Aging capital equipment at flagship Dayton plant",
      "Customer concentration (top 2 accounts = 50% of revenue)",
      "No digital quality/traceability system for OEM reporting",
      "Underpriced custom tooling line operating at a loss",
    ],
    opportunities: [
      "Reallocate Bratislava capacity toward a new industrial-equipment program in the regional pipeline",
      "Renegotiate or exit loss-making tooling contracts",
      "Automate inspection at Dayton to cut defect/rework costs",
    ],
    threats: [
      "Continued steel price volatility",
      "Further OEM price-downs (LTAs) on Customer B contract renewal (2026)",
      "Loss of supplier-panel status if OTD does not recover above 90%",
    ],
  },
  rootCauseImpact: [
    {
      rootCause: "Aging equipment at Dayton (avg. age 14 yrs, last major capex 2016)",
      businessImpact: "Defect rate up 2.2 pts since 2021 → ~$6.0M annual rework cost; OEE down 19 pts",
      linkedMetric: "Defect rate, OEE, gross margin",
    },
    {
      rootCause: "Loss of VW bracket program at Bratislava (2024)",
      businessImpact: "Plant utilization fell to 51%; ~$6.8M/yr in unabsorbed fixed cost",
      linkedMetric: "Capacity utilization, EBITDA margin",
    },
    {
      rootCause: "Custom Tooling priced below fully-loaded cost since 2022 repricing freeze",
      businessImpact: "Segment now loses ~$1.5M/yr; drags blended gross margin down ~0.5 pt",
      linkedMetric: "Product profitability",
    },
    {
      rootCause: "No formal S&OP process; production planning lags demand signal by ~6–8 weeks",
      businessImpact: "Inventory days up 27 since 2021 → $20.8M of excess working capital",
      linkedMetric: "Inventory days, cash position",
    },
    {
      rootCause: "Customer B annual LTA price-downs (3–4%/yr) without matching cost-out program",
      businessImpact: "Account margin fell from ~15% (2021) to 8.1% (2025)",
      linkedMetric: "Customer profitability, gross margin",
    },
  ],
};

// ---- TURNAROUND SCORE ---------------------------------------------------------
// Composite of margin trend, cash runway, leverage, and operational health (0-100)

function computeTurnaroundScore() {
  const n = financials.years.length - 1;
  const marginScore = Math.max(0, Math.min(30, (financials.ebitdaMarginPct[n] / 15) * 30));
  const cashRunwayMonths = (financials.cashPosition[n] / Math.abs(financials.operatingCashFlow[n] || -1)) * 12;
  const cashScore = Math.max(0, Math.min(25, (financials.cashPosition[n] / 40) * 25));
  const leverageRatio = financials.totalDebt[n] / financials.ebitda[n];
  const leverageScore = Math.max(0, Math.min(20, 20 - leverageRatio));
  const opsScore = Math.max(0, Math.min(25, (operations.oeePct[n] / 80) * 25));
  const total = marginScore + cashScore + leverageScore + opsScore;
  return Math.round(Math.max(0, Math.min(100, total)));
}

module.exports = {
  company,
  financials,
  operations,
  strategic,
  computeTurnaroundScore,
};
