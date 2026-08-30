const express = require("express");
const cors = require("cors");
const { company, financials, operations, strategic, computeTurnaroundScore } = require("./data/company");
const { initiatives } = require("./data/initiatives");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const lastIdx = financials.years.length - 1;

// ---------------------------------------------------------------------------
// GET /api/company — company profile
// ---------------------------------------------------------------------------
app.get("/api/company", (req, res) => {
  res.json(company);
});

// ---------------------------------------------------------------------------
// GET /api/kpis — executive-level summary KPIs (latest year vs prior)
// ---------------------------------------------------------------------------
app.get("/api/kpis", (req, res) => {
  const score = computeTurnaroundScore();
  const kpi = (arr) => ({ current: arr[lastIdx], prior: arr[lastIdx - 1] });

  res.json({
    turnaroundScore: score,
    turnaroundScoreBand: score >= 70 ? "Healthy" : score >= 45 ? "At Risk" : "Critical",
    revenue: kpi(financials.revenue),
    ebitda: kpi(financials.ebitda),
    ebitdaMarginPct: kpi(financials.ebitdaMarginPct),
    cashPosition: kpi(financials.cashPosition),
    totalDebt: kpi(financials.totalDebt),
    marketSharePct: kpi(
      // synthetic market-share series consistent with strategic.marketPosition endpoints
      [14.2, 13.9, 13.1, 12.0, 10.8]
    ),
    diagnosis: {
      whatIsWrong: [
        "EBITDA margin has collapsed from 13.2% (2021) to 3.2% (2025) despite revenue only falling 4% cumulatively.",
        "Cash position has dropped from $42.1M to $9.8M, and operating cash flow turned negative in 2025 (-$4.1M).",
        "Total debt has grown 56% since 2021 while EBITDA has fallen 77%, pushing leverage past 15x EBITDA.",
      ],
      whyItsHappening: [
        "Aging equipment at the Dayton plant is driving rising defect and rework costs (0.6% \u2192 2.0% of revenue).",
        "Loss of the VW bracket program left the Bratislava plant at 51% utilization with unabsorbed fixed costs.",
        "The Custom Tooling product line has been underpriced since a 2022 rate freeze and now loses money.",
        "Customer B's annual price-downs have compressed that account's margin from ~15% to 8.1% with no cost offset.",
      ],
      whatToDo: [
        "Stabilize cash immediately: freeze discretionary spend, extend payables, tighten the credit facility covenants.",
        "Reprice or exit loss-making Custom Tooling contracts and rebalance mix toward precision components.",
        "Fund automated inspection at Dayton to cut rework cost, and right-size Bratislava capacity.",
      ],
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/financials — full financial time series + interpretation notes
// ---------------------------------------------------------------------------
app.get("/api/financials", (req, res) => {
  res.json({
    years: financials.years,
    series: financials,
    insights: {
      revenueTrend:
        "Revenue grew through 2023 then declined for two consecutive years as OEM volumes softened and the VW program was lost, but the bigger story is margin, not top line.",
      grossMargin:
        "Gross margin has fallen 9.8 points since 2021, driven by raw-material cost inflation that was not fully passed through and rising scrap/rework.",
      ebitda:
        "EBITDA has fallen 77% in four years. SG&A cuts have partly offset gross-margin erosion, but not nearly enough.",
      cashFlow:
        "Operating cash flow turned negative in 2025 for the first time in company history, driven by margin collapse and a growing working-capital build.",
      debt:
        "Total debt has risen from $95M to $148M while EBITDA has collapsed, pushing leverage from 2.3x to over 15x \u2014 a level that puts covenant compliance at risk.",
      workingCapital:
        "Working capital has grown $28.3M since 2021, almost entirely from a $20.8M inventory build that has not been matched by planning discipline.",
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/operations — operational metrics + bottlenecks
// ---------------------------------------------------------------------------
app.get("/api/operations", (req, res) => {
  res.json({
    years: operations.years,
    series: operations,
    bottlenecks: operations.bottlenecks,
    plantUtilization: operations.plantUtilization,
  });
});

// ---------------------------------------------------------------------------
// GET /api/strategy — strategic diagnosis (profitability, SWOT, root cause)
// ---------------------------------------------------------------------------
app.get("/api/strategy", (req, res) => {
  res.json(strategic);
});

// ---------------------------------------------------------------------------
// GET /api/initiatives — turnaround plan + implementation tracker
// ---------------------------------------------------------------------------
app.get("/api/initiatives", (req, res) => {
  const byStage = { Stabilize: [], Recover: [], Transform: [] };
  initiatives.forEach((i) => byStage[i.stage].push(i));

  const summary = {
    totalInitiatives: initiatives.length,
    totalCost: round1(initiatives.reduce((s, i) => s + i.cost, 0)),
    totalExpectedBenefit: round1(initiatives.reduce((s, i) => s + i.expectedBenefitAnnual, 0)),
    totalActualBenefit: round1(initiatives.reduce((s, i) => s + i.actualBenefit, 0)),
    byStatus: countBy(initiatives, "status"),
  };

  res.json({ byStage, list: initiatives, summary });
});

// ---------------------------------------------------------------------------
// POST /api/scenario — turnaround scenario simulator
// body: { revenueGrowthPct, priceChangePct, costReductionPct, capacityUtilPct, wcImprovementPct }
// ---------------------------------------------------------------------------
app.post("/api/scenario", (req, res) => {
  const {
    revenueGrowthPct = 0,
    priceChangePct = 0,
    costReductionPct = 0,
    capacityUtilPct = 0, // percentage-point change in capacity utilization
    wcImprovementPct = 0, // % reduction in working capital / inventory days
  } = req.body || {};

  const baseRevenue = financials.revenue[lastIdx]; // 298.7
  const baseCogs = financials.cogs[lastIdx]; // 243.1
  const baseSga = financials.sgaExpense[lastIdx]; // 42.9
  const baseCash = financials.cashPosition[lastIdx]; // 9.8
  const baseWorkingCapital = financials.workingCapital[lastIdx]; // 86.5
  const baseUtil = operations.capacityUtilizationPct[lastIdx]; // 64

  // ---- Base case: naive continuation of the 2025 trend (no intervention) ----
  const trendRevenue = baseRevenue * 0.965; // continued ~3.5% annual decline
  const trendCogsRatio = baseCogs / baseRevenue + 0.01; // continued margin erosion
  const baseCaseRevenue = trendRevenue;
  const baseCaseCogs = trendRevenue * trendCogsRatio;
  const baseCaseGrossProfit = baseCaseRevenue - baseCaseCogs;
  const baseCaseSga = baseSga * 0.98;
  const baseCaseEbitda = baseCaseGrossProfit - baseCaseSga;
  const baseCaseMargin = (baseCaseEbitda / baseCaseRevenue) * 100;
  const baseCaseCash = baseCash + (baseCaseEbitda - 10) * 0.6; // rough cash conversion, capex ~10
  const baseCaseScore = scoreFromMargin(baseCaseMargin, baseCaseCash);

  // ---- Turnaround case: apply user-controlled levers ----
  const revenueAfterGrowth = baseRevenue * (1 + revenueGrowthPct / 100);
  const revenueAfterPrice = revenueAfterGrowth * (1 + priceChangePct / 100);
  const turnRevenue = revenueAfterPrice;

  // Cost reduction lever reduces COGS ratio directly; utilization improvement
  // further dilutes fixed manufacturing overhead (assume 35% of COGS is fixed).
  const fixedCogsShare = 0.35;
  const baseCogsRatio = baseCogs / baseRevenue;
  const utilizationFactor = baseUtil / Math.max(1, baseUtil + capacityUtilPct);
  const adjustedCogsRatio =
    baseCogsRatio * (1 - costReductionPct / 100) * (1 - fixedCogsShare * (1 - utilizationFactor));
  const turnCogs = turnRevenue * Math.max(0.35, adjustedCogsRatio);
  const turnGrossProfit = turnRevenue - turnCogs;
  const turnSga = baseSga * (1 - Math.min(costReductionPct, 15) / 100 / 2);
  const turnEbitda = turnGrossProfit - turnSga;
  const turnMargin = (turnEbitda / turnRevenue) * 100;

  // Working capital improvement releases cash directly
  const wcRelease = baseWorkingCapital * (wcImprovementPct / 100);
  const turnCash = baseCash + (turnEbitda - 8) * 0.65 + wcRelease;
  const turnScore = scoreFromMargin(turnMargin, turnCash);

  res.json({
    inputs: { revenueGrowthPct, priceChangePct, costReductionPct, capacityUtilPct, wcImprovementPct },
    baseCase: {
      revenue: round1(baseCaseRevenue),
      ebitda: round1(baseCaseEbitda),
      ebitdaMarginPct: round1(baseCaseMargin),
      cashPosition: round1(baseCaseCash),
      turnaroundScore: baseCaseScore,
    },
    turnaroundCase: {
      revenue: round1(turnRevenue),
      ebitda: round1(turnEbitda),
      ebitdaMarginPct: round1(turnMargin),
      cashPosition: round1(turnCash),
      cashGenerated: round1(wcRelease),
      turnaroundScore: turnScore,
    },
    delta: {
      revenue: round1(turnRevenue - baseCaseRevenue),
      ebitda: round1(turnEbitda - baseCaseEbitda),
      ebitdaMarginPct: round1(turnMargin - baseCaseMargin),
      turnaroundScore: turnScore - baseCaseScore,
    },
  });
});

function scoreFromMargin(marginPct, cash) {
  const marginScore = Math.max(0, Math.min(50, (marginPct / 15) * 50));
  const cashScore = Math.max(0, Math.min(50, (cash / 40) * 50));
  return Math.round(Math.max(0, Math.min(100, marginScore + cashScore)));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

app.listen(PORT, () => {
  console.log(`Meridian Turnaround API listening on http://localhost:${PORT}`);
});
