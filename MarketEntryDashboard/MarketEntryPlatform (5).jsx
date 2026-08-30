import React, { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import {
  INK, SIGNAL, GROWTH, CAUTION, ALERT, VIOLET, MUTED,
  DEFAULT_LOCATIONS, DEFAULT_WEIGHTS, DEFAULT_FIN, WEIGHT_LABELS,
  INDUSTRY_PRESETS, RISK_TILT, applyTilt, SCENARIO_TILT, scenarioWeights,
  CURRENCIES, UNIT_OPTIONS, makeStarterLocation,
  rankLocations, tierFor, financialSummary, formatMoney, fmtPct, normalizeWeights,
  DEFAULT_SETUP_FORM, extractFinancialsFromStatement, researchLocationScores,
  narrativeFor, topDrivers, topRisks, tradeoffs,
} from "./marketEntryEngine";

/**
 * MarketEntryPlatform.jsx
 * ---------------------------------------------------------------
 * The application layer: React state/hooks, the dashboard UI, all
 * charts/tables, and the consulting-style presentation (executive
 * summary, insight cards, scenario view). All numbers shown here
 * come from marketEntryEngine.js — this file is only responsible
 * for wiring that data to the screen and reacting to user input.
 * ---------------------------------------------------------------
 */

const TABS = [
  { id: "inputs", label: "Company dashboard" },
  { id: "overview", label: "Executive summary" },
  { id: "scoring", label: "Location scoring" },
  { id: "financial", label: "Financial model" },
  { id: "scenario", label: "Scenario & sensitivity" },
  { id: "insights", label: "Insight engine" },
];

const TONE_COLOR = { good: GROWTH, warn: CAUTION, bad: ALERT, neutral: SIGNAL };
const TONE_STYLES = {
  good: "bg-[#0FA968]/10 text-[#0A7A4C] border-[#0FA968]/25",
  warn: "bg-[#E8992A]/10 text-[#9A6110] border-[#E8992A]/25",
  bad: "bg-[#E2483F]/10 text-[#B4342C] border-[#E2483F]/25",
};

function Explain({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1.5 align-middle normal-case">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`w-4 h-4 inline-flex items-center justify-center rounded-full border text-[9px] font-bold leading-none transition-colors ${
          open ? "border-[#0A78FF] text-[#0A78FF] bg-[#0A78FF]/10" : "border-[#B9C6D8] text-[#8494AA] hover:border-[#0A78FF] hover:text-[#0A78FF]"
        }`}
        aria-label="How this is calculated"
      >
        i
      </button>
      {open && (
        <span className="explain-pop absolute z-30 left-0 top-6 w-64 bg-[#0F1C30]/95 backdrop-blur-xl text-slate-50 text-[11px] leading-relaxed rounded-2xl p-3.5 shadow-[0_20px_45px_-15px_rgba(15,28,48,0.55)] normal-case font-normal tracking-normal border border-white/10">
          {children}
          <button type="button" onClick={() => setOpen(false)} className="block mt-2.5 text-[10px] text-[#7FB4FF] font-medium">
            Got it, close
          </button>
        </span>
      )}
    </span>
  );
}

function Card({ title, sub, explain, children, className = "", accent }) {
  return (
    <div className={`glass-panel relative rounded-[26px] p-5 sm:p-6 ${className}`}>
      {accent && <span className="absolute left-6 right-6 top-0 h-[3px] rounded-full opacity-70" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />}
      {title && (
        <div className="mb-4">
          <h3 className="text-[12px] font-semibold tracking-[0.08em] text-[#4C5A70] uppercase inline-flex items-center font-sans">
            {title}
            {explain && <Explain>{explain}</Explain>}
          </h3>
          {sub && <p className="text-[12.5px] text-[#8492A6] mt-1 leading-relaxed max-w-3xl">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function MiniRing({ pct, tone = "neutral", size = 46, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const color = TONE_COLOR[tone] || SIGNAL;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(15,28,48,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.16,1,.3,1)" }}
      />
    </svg>
  );
}

function Metric({ label, value, tone, explain, ring }) {
  const color = TONE_COLOR[tone] || INK;
  return (
    <div className="glass-tile rounded-2xl p-4 relative overflow-hidden">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#8492A6] font-semibold inline-flex items-center font-sans">
        {label}
        {explain && <Explain>{explain}</Explain>}
      </div>
      <div className="flex items-end gap-2.5 mt-1.5">
        {typeof ring === "number" && <MiniRing pct={ring} tone={tone || "neutral"} />}
        <div className="font-mono text-[26px] leading-none font-semibold tracking-tight" style={{ color: tone ? color : INK }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Tag({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-semibold ${TONE_STYLES[tone]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: TONE_COLOR[tone] }} />
      {children}
    </span>
  );
}

function Field({ label, explain, children }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#8492A6] font-semibold mb-1.5 inline-flex items-center font-sans">
        {label}
        {explain && <Explain>{explain}</Explain>}
      </div>
      {children}
    </div>
  );
}

function ScoreRing({ value, max = 100, tone = "neutral", size = 96, stroke = 9, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = TONE_COLOR[tone] || SIGNAL;
  const gid = `ring-grad-${tone}-${size}`;
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold leading-none" style={{ fontSize: size * 0.26, color: "inherit" }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      {(label || sub) && (
        <div>
          {label && <div className="text-[10.5px] uppercase tracking-[0.1em] opacity-70 font-semibold">{label}</div>}
          {sub && <div className="text-sm font-semibold mt-0.5">{sub}</div>}
        </div>
      )}
    </div>
  );
}

export default function MarketEntryPlatform() {
  const [tab, setTab] = useState("inputs");
  const [setupForm, setSetupForm] = useState(DEFAULT_SETUP_FORM);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [fin, setFin] = useState(DEFAULT_FIN);
  const [scenario, setScenario] = useState("base");
  const [selectedForRadar, setSelectedForRadar] = useState(["navimumbai", "pune", "nashik"]);
  const [expandedAudit, setExpandedAudit] = useState(null);
  const [modelBasis, setModelBasis] = useState(INDUSTRY_PRESETS.manufacturing.basis);
  const [newLocName, setNewLocName] = useState("");
  const [finLocked, setFinLocked] = useState(false); // true once real financials were extracted from an uploaded statement
  const [finUpload, setFinUpload] = useState({ status: "idle", fileName: "", note: "", error: "" });
  const [locFetch, setLocFetch] = useState({ status: "idle", error: "" });
  const [syncPulse, setSyncPulse] = useState(false); // brief "saved" flash whenever the model auto-regenerates
  const [lastApplied, setLastApplied] = useState(DEFAULT_SETUP_FORM); // snapshot of setupForm as of the last apply, for the "unsaved changes" indicator

  /* -------------------------------------------------------------
     Company & project setup (setupForm) is the single source of
     truth. `project` and `currency` are pure derivations of it, so
     every keystroke on the Company dashboard tab is reflected
     everywhere — header, financial units, all downstream tabs —
     with nothing to click and nothing that can drift out of sync.
  ------------------------------------------------------------- */
  const industryPreset = INDUSTRY_PRESETS[setupForm.industryKey] || INDUSTRY_PRESETS.other;
  const currency = useMemo(
    () => ({ symbol: setupForm.currencySymbol, unit: setupForm.unitLabel }),
    [setupForm.currencySymbol, setupForm.unitLabel]
  );
  const project = useMemo(
    () => ({
      company: setupForm.companyName || "Your company",
      industry: industryPreset.label,
      currentLocation: setupForm.currentLocation || "Current base",
      targetCountry: setupForm.targetCountry || "\u2014",
      targetRegion: setupForm.targetRegion || "Target region",
      objective: setupForm.objective || "Market entry / expansion analysis",
      budget: `${setupForm.currencySymbol}${setupForm.budget} ${setupForm.unitLabel}`,
      horizon: `${setupForm.horizonYears} years`,
    }),
    [setupForm, industryPreset]
  );

  const fmtCr = (v) => formatMoney(currency, v);

  /* -------------------------------------------------------------
     REGENERATION LOGIC — shared by (a) an automatic debounced effect
     that keeps things in sync as you type, and (b) an explicit
     "Save & apply" button for anyone who wants to see the change
     happen immediately and unambiguously, on demand.

     This is a full replace, not a merge: whatever is currently in
     the Candidate locations field becomes the ENTIRE location list
     (a location kept from before reuses its existing scores if the
     name still matches; anything not in the field is dropped), and
     weights/financials are fully recomputed from the current
     industry/risk/budget/horizon \u2014 so switching to a new company
     clears the old company's data instead of layering on top of it.
  ------------------------------------------------------------- */
  function applyModelFromSetup(form) {
    const preset = INDUSTRY_PRESETS[form.industryKey] || INDUSTRY_PRESETS.other;
    const tiltedWeights = applyTilt(preset.weights, form.riskAppetite);
    const discountDelta = (RISK_TILT[form.riskAppetite] || {}).discountRateDelta || 0;
    const capex = Math.max(0.1, Number(form.budget) || 1);
    const horizonYears = Math.max(3, Math.min(10, Number(form.horizonYears) || 7));

    setWeights(tiltedWeights);
    setModelBasis(preset.basis);

    if (finLocked) {
      setFin((f) => ({ ...f, capex, years: horizonYears }));
    } else {
      const year1Revenue = Math.round(capex * preset.fin.revenueToCapex * 10) / 10;
      setFin({
        capex,
        year1Revenue,
        growth: preset.fin.growth,
        grossMargin: preset.fin.grossMargin,
        opexPct: preset.fin.opexPct,
        taxRate: preset.fin.taxRate,
        discountRate: Math.max(4, preset.fin.discountRate + discountDelta),
        years: horizonYears,
      });
    }

    const names = form.locationNames.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);
    setLocations((prev) => {
      const prevByName = new Map(prev.map((l) => [l.name.trim().toLowerCase(), l]));
      const nextList = names.map((n, i) => prevByName.get(n.toLowerCase()) || makeStarterLocation(n, i));
      setSelectedForRadar(nextList.slice(0, 4).map((l) => l.id));
      return nextList;
    });

    setLastApplied(form);
    setSyncPulse(true);
    setTimeout(() => setSyncPulse(false), 1400);
  }

  const isDirty = JSON.stringify(setupForm) !== JSON.stringify(lastApplied);

  function saveAndApply() {
    applyModelFromSetup(setupForm);
    setTab("overview");
  }

  // Auto-regeneration: re-derive weights/financials shortly after the
  // model-driving fields change, so things stay live even without
  // clicking Save & apply. The button below just makes it instant.
  React.useEffect(() => {
    const t = setTimeout(() => applyModelFromSetup(setupForm), 700);
    return () => clearTimeout(t);
  }, [setupForm.industryKey, setupForm.riskAppetite, setupForm.budget, setupForm.horizonYears, setupForm.locationNames, finLocked]);

  const ranked = useMemo(() => rankLocations(locations, weights), [locations, weights]);
  const top = ranked[0];
  const runnerUp = ranked[1];
  const topTier = top ? tierFor(top.score) : null;

  const finScenario = SCENARIO_TILT[scenario];
  const finSummary = useMemo(
    () => financialSummary(fin, finScenario.growthDelta, finScenario.marginDelta),
    [fin, finScenario]
  );
  const hurdle = fin.discountRate / 100;
  const meetsHurdle = finSummary.irrValue !== null && finSummary.irrValue > hurdle;

  const overallRecommendation = useMemo(() => {
    if (!top) return { verdict: "ADD A LOCATION", tone: "warn" };
    if (top.score >= 70 && meetsHurdle) return { verdict: "ENTER", tone: "good" };
    if (top.score >= 60 || !meetsHurdle) return { verdict: "CONDITIONAL ENTRY", tone: "warn" };
    return { verdict: "DO NOT ENTER", tone: "bad" };
  }, [top, meetsHurdle]);

  const scenarioWinners = useMemo(() => {
    return Object.keys(SCENARIO_TILT).map((key) => {
      const r = rankLocations(locations, scenarioWeights(weights, key))[0];
      return { key, label: SCENARIO_TILT[key].label, winner: r ? r.name : "\u2014", score: r ? r.score : 0 };
    });
  }, [locations, weights]);

  function updateWeight(key, val) {
    setWeights((w) => ({ ...w, [key]: val }));
  }

  function updateLocationField(id, field, val) {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val, isStarter: false } : l)));
  }

  function updateFin(field, val) {
    setFin((f) => ({ ...f, [field]: val }));
  }

  function updateSetup(field, val) {
    setSetupForm((s) => ({ ...s, [field]: val }));
  }

  function addLocation() {
    const name = newLocName.trim();
    if (!name) return;
    setLocations((prev) => [...prev, makeStarterLocation(name, prev.length)]);
    setNewLocName("");
  }

  function removeLocation(id) {
    setLocations((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
    setSelectedForRadar((sel) => sel.filter((x) => x !== id));
  }

  function resetToDemo() {
    setWeights(DEFAULT_WEIGHTS);
    setFin(DEFAULT_FIN);
    setLocations(DEFAULT_LOCATIONS);
    setScenario("base");
    setSelectedForRadar(["navimumbai", "pune", "nashik"]);
    setModelBasis(INDUSTRY_PRESETS.manufacturing.basis);
    setSetupForm(DEFAULT_SETUP_FORM);
    setLastApplied(DEFAULT_SETUP_FORM);
    setFinLocked(false);
    setFinUpload({ status: "idle", fileName: "", note: "", error: "" });
    setLocFetch({ status: "idle", error: "" });
  }

  /* -------------------------------------------------------------
     UPLOAD A FINANCIAL STATEMENT -> AI extracts modeling assumptions.
     PDFs are sent as a real document block; text/CSV files are sent
     as plain text. The model is asked to return strict JSON so it
     can be dropped straight into the `fin` state.
  ------------------------------------------------------------- */
  async function handleFinancialFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-uploading the same file name later
    if (!file) return;
    setFinUpload({ status: "reading", fileName: file.name, note: "", error: "" });
    try {
      setFinUpload((s) => ({ ...s, status: "analyzing" }));
      const { fin: extractedFin, note } = await extractFinancialsFromStatement(file, {
        companyName: project.company,
        currency,
        currentFin: fin,
      });
      setFin(extractedFin);
      setFinLocked(true);
      setFinUpload({ status: "done", fileName: file.name, note, error: "" });
    } catch (err) {
      setFinUpload({ status: "error", fileName: file.name, note: "", error: String((err && err.message) || err) });
    }
  }

  /* -------------------------------------------------------------
     RESEARCH REAL LOCATION DATA WITH AI (web search). Replaces the
     deterministic starter scores for whichever candidate locations
     are currently listed, matched back by name.
  ------------------------------------------------------------- */
  async function fetchLocationDataFromAI() {
    if (!locations.length) return;
    setLocFetch({ status: "searching", error: "" });
    try {
      const updated = await researchLocationScores(locations, {
        industryLabel: industryPreset.label,
        targetCountry: project.targetCountry,
        targetRegion: project.targetRegion,
        objective: project.objective,
      });
      setLocations(updated);
      setLocFetch({ status: "done", error: "" });
    } catch (err) {
      setLocFetch({ status: "error", error: String((err && err.message) || err) });
    }
  }

  const tabRefs = useRef({});
  const [navIndicator, setNavIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setNavIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab, top]);

  const recTone = overallRecommendation.tone === "good" ? "good" : overallRecommendation.tone === "warn" ? "warn" : "bad";

  return (
    <div className="min-h-screen text-[#16233A] app-canvas" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

        .font-display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

        .app-canvas {
          background:
            radial-gradient(720px 480px at 8% -8%, rgba(10,120,255,0.14), transparent 60%),
            radial-gradient(680px 520px at 96% 6%, rgba(123,110,246,0.13), transparent 60%),
            radial-gradient(900px 620px at 50% 115%, rgba(15,169,104,0.10), transparent 60%),
            #EEF3F9;
        }
        .bg-orb { position: fixed; border-radius: 9999px; filter: blur(70px); z-index: 0; pointer-events: none; opacity: 0.55; }
        @media (prefers-reduced-motion: no-preference) {
          .bg-orb { animation: orbDrift 22s ease-in-out infinite; }
        }
        @keyframes orbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(24px,-18px) scale(1.06); } }

        .glass-panel {
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -22px rgba(15,28,48,0.28);
        }
        .glass-tile {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.7);
        }
        .glass-strong {
          background: rgba(15,28,48,0.82);
          backdrop-filter: blur(26px) saturate(160%);
          -webkit-backdrop-filter: blur(26px) saturate(160%);
        }
        .gi {
          width: 100%; background: rgba(255,255,255,0.65); border: 1px solid rgba(15,28,48,0.12);
          border-radius: 10px; padding: 0.42rem 0.65rem; font-size: 0.875rem; color: #16233A;
          transition: border-color .15s, box-shadow .15s; outline: none;
        }
        .gi:focus { border-color: #0A78FF; box-shadow: 0 0 0 3px rgba(10,120,255,0.15); }
        .gi::placeholder { color: #9AA7BA; }

        .explain-pop { animation: popIn .18s cubic-bezier(.16,1,.3,1); transform-origin: top left; }
        @keyframes popIn { from { opacity:0; transform: translateY(-4px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }

        .tab-panel { animation: panelSlide .5s cubic-bezier(.16,1,.3,1); }
        @keyframes panelSlide { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }

        .audit-row { animation: auditDrop .3s cubic-bezier(.16,1,.3,1); }
        @keyframes auditDrop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 999px; background: rgba(15,28,48,0.12); }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 999px;
          background: #0A78FF; border: 2px solid white; box-shadow: 0 2px 6px rgba(10,120,255,0.5); cursor: pointer; margin-top: -6px;
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 999px; background: #0A78FF; border: 2px solid white;
          box-shadow: 0 2px 6px rgba(10,120,255,0.5); cursor: pointer;
        }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(15,28,48,0.18); border-radius: 999px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>

      <div className="bg-orb" style={{ width: 380, height: 380, top: -140, left: -100, background: "#0A78FF" }} />
      <div className="bg-orb" style={{ width: 340, height: 340, top: -80, right: -120, background: "#7B6EF6", animationDelay: "3s" }} />
      <div className="bg-orb" style={{ width: 420, height: 300, bottom: -160, left: "35%", background: "#0FA968", animationDelay: "6s" }} />

      {/* HEADER */}
      <header className="relative z-10 sticky top-0">
        <div className="glass-strong text-white">
          <div className="max-w-6xl mx-auto px-6 pt-5 pb-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.2em] text-[#8FB2E8] font-semibold">Market entry & location strategy</p>
              <h1 className="text-2xl font-display font-semibold mt-1 tracking-tight">{project.company}</h1>
              <p className="text-[12.5px] text-[#9FB0C8] mt-1">{project.industry} &middot; {project.currentLocation} <span className="text-[#5B87C9]">&rarr;</span> {project.targetRegion}</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ color: "white" }}>
                <ScoreRing
                  value={top ? top.score : 0}
                  tone={recTone}
                  size={58}
                  stroke={6}
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#8FB2E8] font-semibold inline-flex items-center">
                  Recommendation
                  <Explain>
                    ENTER if the top location scores 70+/100 and projected IRR clears the discount-rate hurdle. CONDITIONAL ENTRY if the score is 60&ndash;70 or IRR misses the hurdle. DO NOT ENTER below 60 regardless of returns.
                  </Explain>
                </span>
                <div
                  className="mt-1 px-2.5 py-1 rounded-full text-[12.5px] font-bold inline-block tracking-wide"
                  style={{
                    color: recTone === "good" ? "#5CE0A4" : recTone === "warn" ? "#F5C065" : "#F5928C",
                    background: recTone === "good" ? "rgba(15,169,104,0.16)" : recTone === "warn" ? "rgba(232,153,42,0.16)" : "rgba(226,72,63,0.16)",
                  }}
                >
                  {overallRecommendation.verdict}
                </div>
              </div>
            </div>
          </div>
          <nav className="max-w-6xl mx-auto px-6 relative">
            <div className="relative flex gap-1 overflow-x-auto pb-0 no-scrollbar">
              <span
                className="absolute bottom-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#0A78FF] to-[#7B6EF6] transition-all duration-300 ease-out"
                style={{ left: navIndicator.left, width: navIndicator.width }}
              />
              {TABS.map((t) => (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  onClick={() => setTab(t.id)}
                  className={`px-3.5 py-3 text-[13px] whitespace-nowrap transition-colors relative ${
                    tab === t.id ? "text-white font-semibold" : "text-[#8798B2] hover:text-[#D6E2F2] font-medium"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {!top && (
          <Card className="mb-6" accent={CAUTION}>
            <p className="text-sm text-[#9A6110] font-medium">Add at least one candidate location on the <button onClick={() => setTab("inputs")} className="underline">Inputs tab</button> to see the analysis.</p>
          </Card>
        )}

        {/* ---------------- OVERVIEW ---------------- */}
        {tab === "overview" && top && (
          <div className="space-y-6 tab-panel" key="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric
                label="Market attractiveness"
                value={`${top.score.toFixed(0)}/100`}
                tone={top.score > 75 ? "good" : "warn"}
                ring={top.score}
                explain="Weighted sum of 7 normalized sub-scores (market, cost, infrastructure, supply chain, talent, competition, risk), each 0\u2013100, combined using the weights set on the Location scoring tab. Open 'view calculation' in any ranking table for the exact per-dimension math."
              />
              <Metric label="Recommended location" value={top.name} explain="The candidate location with the single highest weighted score." />
              <Metric
                label="Expected IRR"
                value={finSummary.irrValue !== null ? fmtPct(finSummary.irrValue) : "n/a"}
                tone={meetsHurdle ? "good" : "bad"}
                ring={finSummary.irrValue !== null ? finSummary.irrValue * 100 : 0}
                explain="The discount rate at which cumulative discounted free cash flow (including the year-0 capex outflow) equals zero, solved numerically. Compared against your discount rate as the minimum acceptable return."
              />
              <Metric
                label="Payback period"
                value={finSummary.paybackYear ? `${finSummary.paybackYear} yrs` : "beyond horizon"}
                explain="First year in which cumulative free cash flow (starting at \u2212capex) turns positive."
              />
            </div>

            <Card
              title="Consulting recommendation"
              explain="Generated automatically from the scored data below \u2014 not a separate editorial judgement. It recalculates the moment you change a weight, a location metric or a financial assumption."
              accent={SIGNAL}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="font-display text-xl font-semibold text-[#101E33]">
                    {overallRecommendation.verdict} &mdash; {top.name}
                  </p>
                  <p className="text-sm text-[#54627A] mt-2 max-w-2xl leading-relaxed">
                    {narrativeFor(top, runnerUp)}
                  </p>
                </div>
                <Tag tone={topTier.tone}>{topTier.label} &middot; {top.score.toFixed(0)}/100</Tag>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Key drivers" explain="The three highest-scoring sub-dimensions for the top-ranked location, taken directly from its scoring breakdown." accent={GROWTH}>
                <ul className="text-sm space-y-2.5">
                  {topDrivers(top).map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: GROWTH }} />
                      <span className="text-[#3A4658]">{d}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Key risks" explain="The two lowest-scoring sub-dimensions for the top-ranked location, plus a flag if projected IRR misses the discount-rate hurdle." accent={ALERT}>
                <ul className="text-sm space-y-2.5">
                  {topRisks(top, finSummary, hurdle).map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ALERT }} />
                      <span className="text-[#3A4658]">{d}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card title="Location ranking" sub="Weighted score across market opportunity, cost, infrastructure, supply chain, talent, competition and risk">
              <RankingTable ranked={ranked} />
            </Card>
          </div>
        )}

        {/* ---------------- INPUTS ---------------- */}
        {tab === "inputs" && (
          <div className="space-y-6 tab-panel" key="inputs">
            <Card
              title="Company & project setup"
              sub="This panel is the primary dashboard for the whole platform: every field here saves as you type and propagates live everywhere else — the header, scoring weights, financial ratios and starter location scores — with nothing to click. Everything downstream stays fully editable on its own tab too; later edits only get overwritten if you change one of the fields below again."
              explain="Industry sets a starting scoring-weight mix and financial ratio set (see the 'basis' note below). Risk appetite tilts those weights and the discount-rate hurdle. Budget and the revenue-to-capex ratio for the chosen industry set year-1 revenue automatically \u2014 unless you've uploaded a real financial statement below, in which case those numbers take priority."
            >
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Field label="Company name">
                  <input className="gi" value={setupForm.companyName} onChange={(e) => updateSetup("companyName", e.target.value)} />
                </Field>
                <Field label="Industry" explain="Picks the starting scoring-weight mix and financial ratios (growth, margin, opex%, revenue-to-capex) typical for that kind of business. See the basis note below.">
                  <select className="gi appearance-none cursor-pointer" value={setupForm.industryKey} onChange={(e) => updateSetup("industryKey", e.target.value)}>
                    {Object.entries(INDUSTRY_PRESETS).map(([k, p]) => (
                      <option key={k} value={k}>{p.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Risk appetite" explain="Tilts the weights toward cost/risk control (conservative) or market/growth (aggressive), and shifts the discount-rate hurdle by \u00B12 points.">
                  <select className="gi appearance-none cursor-pointer" value={setupForm.riskAppetite} onChange={(e) => updateSetup("riskAppetite", e.target.value)}>
                    {Object.entries(RISK_TILT).map(([k, r]) => (
                      <option key={k} value={k}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Current base location">
                  <input className="gi" value={setupForm.currentLocation} onChange={(e) => updateSetup("currentLocation", e.target.value)} />
                </Field>
                <Field label="Target country">
                  <input className="gi" value={setupForm.targetCountry} onChange={(e) => updateSetup("targetCountry", e.target.value)} />
                </Field>
                <Field label="Target region / city">
                  <input className="gi" value={setupForm.targetRegion} onChange={(e) => updateSetup("targetRegion", e.target.value)} />
                </Field>
                <Field label="Investment budget (capex)" explain="Total upfront investment. Also used to auto-estimate year-1 revenue as budget \u00D7 the selected industry's typical revenue-to-capex ratio.">
                  <input type="number" min={0} className="gi" value={setupForm.budget} onChange={(e) => updateSetup("budget", e.target.value)} />
                </Field>
                <Field label="Currency">
                  <select className="gi appearance-none cursor-pointer" value={setupForm.currencySymbol} onChange={(e) => updateSetup("currencySymbol", e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c.symbol} value={c.symbol}>{c.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Unit">
                  <select className="gi appearance-none cursor-pointer" value={setupForm.unitLabel} onChange={(e) => updateSetup("unitLabel", e.target.value)}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Time horizon (years)">
                  <input type="number" min={3} max={10} className="gi" value={setupForm.horizonYears} onChange={(e) => updateSetup("horizonYears", e.target.value)} />
                </Field>
                <Field label="Objective" explain="Free text, shown on the dashboard header and used nowhere in the calculations — purely for context.">
                  <input className="gi" value={setupForm.objective} onChange={(e) => updateSetup("objective", e.target.value)} />
                </Field>
                <Field label="Candidate locations" explain="Comma-separated names. Each gets a deterministic starter score (same name always gives the same numbers) in a 40\u201380 range so there's something to compare immediately — clearly flagged as an estimate until you edit it below with real research.">
                  <input className="gi" value={setupForm.locationNames} onChange={(e) => updateSetup("locationNames", e.target.value)} placeholder="City A, City B, City C" />
                </Field>
              </div>
              <div
                className={`mt-5 rounded-2xl border p-4 flex flex-wrap items-center gap-3 transition-colors ${
                  isDirty ? "bg-[#E8992A]/10 border-[#E8992A]/30" : "bg-[#0FA968]/10 border-[#0FA968]/25"
                }`}
              >
                <button
                  onClick={saveAndApply}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(10,120,255,0.6)] transition-transform hover:scale-[1.02] ${
                    isDirty ? "ring-2 ring-[#E8992A]/50 ring-offset-2 ring-offset-white" : ""
                  }`}
                  style={{ background: "linear-gradient(135deg, #0A78FF, #0A5FD1)" }}
                >
                  Save & apply &rarr;
                </button>
                {isDirty ? (
                  <span className="text-xs font-medium text-[#9A6110]">
                    Unsaved changes &mdash; click to update the dashboard now (it also applies automatically a moment after you stop typing).
                  </span>
                ) : (
                  <span className={`text-xs font-medium text-[#0A7A4C] transition-opacity ${syncPulse ? "opacity-100" : "opacity-80"}`}>
                    Saved &mdash; dashboard reflects these company details.
                  </span>
                )}
                <button onClick={resetToDemo} className="text-xs text-[#8492A6] underline ml-auto hover:text-[#0A78FF]">
                  Reset to demo example
                </button>
              </div>
              <p className="text-[11px] text-[#8492A6] mt-2">Saving replaces the previous company's data: candidate locations, scoring weights and financial ratios are fully regenerated from what's entered above, not merged with what was there before.</p>
              <div className="mt-4 border-t border-[#0F1C30]/10 pt-3">
                <p className="text-[11px] uppercase tracking-wide text-[#8492A6] mb-1 font-semibold">Why these starting weights & ratios</p>
                <p className="text-xs text-[#5B6B82] leading-relaxed">{modelBasis}</p>
              </div>
            </Card>

            <Card
              title="Financial statements"
              sub="Upload the company's financial statements (PDF, or a pasted-in text/CSV export) and Claude will read them and populate the Financial model tab's assumptions automatically — capex, revenue, growth, margins, opex, tax rate, discount rate and horizon."
              explain="Sends the file to Claude (claude-sonnet-4-6) with a request to extract DCF-modeling assumptions as structured data. Once extracted, these numbers take priority over the industry-preset ratios; changing Industry/Risk appetite above will still keep them (only capex and horizon stay synced to Budget/Time horizon) until you upload a new statement or reset."
            >
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm rounded-full px-4 py-2 text-[#16233A] font-medium cursor-pointer glass-tile hover:border-[#0A78FF]/50 transition-colors">
                  <input type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFinancialFile} />
                  {finUpload.fileName ? "Upload a different statement" : "Upload financial statement"}
                </label>
                {finUpload.status === "reading" && <span className="text-xs text-[#8492A6]">Reading {finUpload.fileName}\u2026</span>}
                {finUpload.status === "analyzing" && <span className="text-xs text-[#8492A6]">Claude is analyzing {finUpload.fileName}\u2026</span>}
                {finUpload.status === "done" && <Tag tone="good">Extracted from {finUpload.fileName}</Tag>}
                {finUpload.status === "error" && <Tag tone="bad">Couldn't read {finUpload.fileName}</Tag>}
                {finLocked && (
                  <button
                    onClick={() => { setFinLocked(false); setFinUpload({ status: "idle", fileName: "", note: "", error: "" }); }}
                    className="text-xs text-[#8492A6] underline hover:text-[#0A78FF]"
                  >
                    use industry defaults instead
                  </button>
                )}
              </div>
              {finUpload.status === "error" && (
                <p className="text-xs text-[#B4342C] mt-2">{finUpload.error}</p>
              )}
              {finUpload.status === "done" && finUpload.note && (
                <p className="text-xs text-[#5B6B82] mt-2 leading-relaxed"><span className="text-[#8492A6] uppercase text-[10px] tracking-wide mr-1 font-semibold">Claude's notes:</span>{finUpload.note}</p>
              )}
              <p className="text-[11px] text-[#8492A6] mt-2">Nothing leaves the browser except the document itself, sent directly to the Claude API for extraction. Always sanity-check the results on the Financial model tab.</p>
            </Card>

            <Card
              title="Candidate locations"
              sub="Edit any metric (0–100 scale) to replace starter estimates with real research, or let Claude research them for you. Cost, competitive intensity and risk are entered as levels — higher means worse — and are inverted automatically in the scoring model."
              explain="Cost level, competitive intensity and risk level are stored as 'higher is worse'. The scoring engine converts each to an advantage score as (100 \u2212 level) before applying weights, so a low cost level produces a high cost-advantage score."
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  onClick={fetchLocationDataFromAI}
                  disabled={locFetch.status === "searching"}
                  className="text-sm text-white px-4 py-2 rounded-full disabled:opacity-50 font-medium shadow-[0_10px_24px_-10px_rgba(123,110,246,0.7)] transition-transform hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #7B6EF6, #5A4FD8)" }}
                >
                  {locFetch.status === "searching" ? "Researching with web search\u2026" : "Research real scores with AI"}
                </button>
                {locFetch.status === "done" && <Tag tone="good">Updated from live web research</Tag>}
                {locFetch.status === "error" && <Tag tone="bad">Research failed</Tag>}
                <span className="text-[11px] text-[#8492A6]">Uses Claude with web search to score every location below. AI research is a starting point pulled from public sources \u2014 verify before relying on it for investment decisions.</span>
              </div>
              {locFetch.status === "error" && <p className="text-xs text-[#B4342C] mb-3">{locFetch.error}</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[#8492A6] border-b border-[#0F1C30]/10 font-semibold">
                      <th className="py-2 pr-2 w-40">Location</th>
                      <th className="py-2 px-1">Market opp.</th>
                      <th className="py-2 px-1">Cost level</th>
                      <th className="py-2 px-1">Infra</th>
                      <th className="py-2 px-1">Supply chain</th>
                      <th className="py-2 px-1">Talent</th>
                      <th className="py-2 px-1">Competitive intensity</th>
                      <th className="py-2 px-1">Risk level</th>
                      <th className="py-2 pl-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((loc) => (
                      <tr key={loc.id} className="border-b border-[#0F1C30]/6 align-top hover:bg-white/40 transition-colors">
                        <td className="py-2 pr-2 font-semibold text-[#16233A]">
                          {loc.name}
                          {loc.isStarter && <span className="block text-[10px] font-normal mt-0.5" style={{ color: CAUTION }}>starting estimate</span>}
                          {loc.isAiSourced && <span className="block text-[10px] font-normal mt-0.5" style={{ color: GROWTH }}>AI-researched (web search)</span>}
                          {loc.rationale && (
                            <span className="block text-[10px] font-normal text-[#8492A6] mt-0.5 leading-snug whitespace-normal" title={loc.rationale}>
                              {loc.rationale}
                            </span>
                          )}
                        </td>
                        {["marketOpportunity", "costIndex", "infrastructure", "supplyChain", "talent", "competitiveIntensity", "riskIndex"].map((f) => (
                          <td key={f} className="py-1 px-1">
                            <input
                              type="number" min={0} max={100} value={loc[f]}
                              onChange={(e) => updateLocationField(loc.id, f, Math.max(0, Math.min(100, Number(e.target.value))))}
                              className="gi w-16 text-center px-1"
                            />
                          </td>
                        ))}
                        <td className="py-2 pl-1">
                          <button onClick={() => removeLocation(loc.id)} disabled={locations.length <= 1} className="text-[#B9C6D8] hover:text-[#E2483F] disabled:opacity-30 text-sm" aria-label={`Remove ${loc.name}`}>
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLocation()}
                  placeholder="Add another candidate location"
                  className="gi flex-1 max-w-xs"
                />
                <button onClick={addLocation} className="text-sm rounded-full px-4 py-2 text-[#16233A] font-medium glass-tile hover:border-[#0A78FF]/50 transition-colors">
                  + Add location
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ---------------- SCORING ---------------- */}
        {tab === "scoring" && (
          <div className="space-y-6 tab-panel" key="scoring">
            <Card title="Scoring weights" sub="Weights are auto-normalized to sum to 100%. Move the sliders to test how strategy priorities change the ranking." explain="Normalized weight = (this slider \u00F7 sum of all sliders) \u00D7 100. Only the relative size between sliders matters, not their absolute values.">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(weights).map(([k, v]) => {
                  const nw = normalizeWeights(weights);
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#3A4658] font-medium">{WEIGHT_LABELS[k]}</span>
                        <span className="text-[#0A78FF] font-mono font-semibold">{nw[k].toFixed(0)}%</span>
                      </div>
                      <input type="range" min={0} max={50} value={v} onChange={(e) => updateWeight(k, Number(e.target.value))} className="w-full" />
                    </div>
                  );
                })}
              </div>
            </Card>

            {top && (
              <Card title="Location ranking">
                <RankingTable ranked={ranked} onAudit={(id) => setExpandedAudit(expandedAudit === id ? null : id)} expandedAudit={expandedAudit} weights={weights} />
              </Card>
            )}

            {top && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card title="Comparison \u2014 radar" sub="Select up to 4 locations to compare across dimensions." explain="Cost, competitive intensity and risk are inverted (100 \u2212 value) so that further-out on every axis always means better, matching the scoring model.">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {locations.map((l) => (
                      <button
                        key={l.id}
                        onClick={() =>
                          setSelectedForRadar((sel) =>
                            sel.includes(l.id) ? sel.filter((x) => x !== l.id) : sel.length < 4 ? [...sel, l.id] : sel
                          )
                        }
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          selectedForRadar.includes(l.id) ? "text-white border-transparent" : "glass-tile text-[#5B6B82] hover:border-[#0A78FF]/40"
                        }`}
                        style={selectedForRadar.includes(l.id) ? { background: "linear-gradient(135deg, #0A78FF, #0A5FD1)" } : undefined}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                  <RadarComparison locations={locations} selected={selectedForRadar} />
                </Card>

                <Card title="Ranking \u2014 bar" explain="Same weighted score as the ranking table, sorted highest to lowest.">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ranked} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D9E2EF" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#8492A6" }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#3A4658" }} />
                      <Tooltip formatter={(v) => v.toFixed(1)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                      <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                        {ranked.map((r, i) => (
                          <Cell key={r.id} fill={i === 0 ? SIGNAL : "#B7C4D8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ---------------- FINANCIAL ---------------- */}
        {tab === "financial" && (
          <div className="space-y-6 tab-panel" key="financial">
            <Card title="Assumptions" sub="Starting values come from the selected industry preset. Adjust to test feasibility.">
              <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
                <FinInput label={`Capex (${currency.symbol} ${currency.unit})`} value={fin.capex} onChange={(v) => updateFin("capex", v)} explain="Total upfront investment. Used as the year-0 cash outflow in the DCF and as the depreciation base (capex \u00F7 projection years, straight-line)." />
                <FinInput label={`Year 1 revenue (${currency.symbol} ${currency.unit})`} value={fin.year1Revenue} onChange={(v) => updateFin("year1Revenue", v)} explain="Starting revenue for year 1; compounds forward each year using the growth rate below." />
                <FinInput label="Revenue growth (%)" value={fin.growth} onChange={(v) => updateFin("growth", v)} explain="Annual compounding growth: revenue in year y = year-1 revenue \u00D7 (1 + growth)^(y\u22121)." />
                <FinInput label="Gross margin (%)" value={fin.grossMargin} onChange={(v) => updateFin("grossMargin", v)} explain="Gross profit = revenue \u00D7 gross margin %." />
                <FinInput label="Opex (% revenue)" value={fin.opexPct} onChange={(v) => updateFin("opexPct", v)} explain="Operating expenses = revenue \u00D7 opex %. EBITDA = gross profit \u2212 opex." />
                <FinInput label="Tax rate (%)" value={fin.taxRate} onChange={(v) => updateFin("taxRate", v)} explain="Applied to EBIT (EBITDA \u2212 straight-line depreciation) only when positive, to derive net income." />
                <FinInput label="Discount rate (%)" value={fin.discountRate} onChange={(v) => updateFin("discountRate", v)} explain="Used to discount future free cash flow to present value (NPV) and as the minimum-acceptable-return hurdle compared against IRR." />
                <FinInput label="Projection years" value={fin.years} onChange={(v) => updateFin("years", Math.max(3, Math.min(10, v)))} explain="Number of years projected, and the straight-line depreciation period for capex (capex \u00F7 years)." />
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="NPV" value={fmtCr(finSummary.netPresentValue)} tone={finSummary.netPresentValue > 0 ? "good" : "bad"} explain="Sum of each year's free cash flow discounted at the discount rate, plus the year-0 capex outflow: NPV = \u03A3 (cash flow\u209C \u00F7 (1+rate)^t)." />
              <Metric label="IRR" value={finSummary.irrValue !== null ? fmtPct(finSummary.irrValue) : "n/a"} tone={meetsHurdle ? "good" : "bad"} explain="The discount rate that makes NPV exactly zero, found by bisection search over the cash flow series." />
              <Metric label="Payback" value={finSummary.paybackYear ? `${finSummary.paybackYear} yrs` : `> ${fin.years} yrs`} explain="First year where cumulative (undiscounted) free cash flow, starting at \u2212capex, turns positive." />
              <Metric label="Multi-year ROI" value={fmtPct(finSummary.roi)} explain="(Sum of all years' free cash flow \u2212 capex) \u00F7 capex \u2014 total return over the full projection horizon, undiscounted." />
            </div>

            <Card title="Projections" sub={`Revenue, EBITDA and free cash flow over ${fin.years} years`} explain="Revenue compounds at the growth rate. EBITDA = revenue \u00D7 gross margin % \u2212 revenue \u00D7 opex %. EBIT = EBITDA \u2212 straight-line depreciation. Free cash flow = EBIT \u00D7 (1 \u2212 tax rate) + depreciation added back.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={finSummary.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EF" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#8492A6" }} tickFormatter={(y) => `Yr ${y}`} />
                  <YAxis tick={{ fontSize: 11, fill: "#8492A6" }} tickFormatter={(v) => v.toFixed(0)} />
                  <Tooltip formatter={(v) => `${currency.symbol}${v.toFixed(1)} ${currency.unit}`} labelFormatter={(y) => `Year ${y}`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={SIGNAL} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke={GROWTH} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="fcf" name="Free cash flow" stroke={VIOLET} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ---------------- SCENARIO & SENSITIVITY ---------------- */}
        {tab === "scenario" && (
          <div className="space-y-6 tab-panel" key="scenario">
            <Card title="Scenario analysis" sub="Base, bull and bear cases shift both financial assumptions and strategic priorities (scoring weights) relative to whatever you've set elsewhere." explain={finScenario.desc}>
              <div className="flex gap-2 mb-4">
                {Object.keys(SCENARIO_TILT).map((key) => (
                  <button
                    key={key}
                    onClick={() => setScenario(key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      scenario === key ? "text-white border-transparent" : "glass-tile text-[#5B6B82] hover:border-[#0A78FF]/40"
                    }`}
                    style={scenario === key ? { background: "linear-gradient(135deg, #0A78FF, #0A5FD1)" } : undefined}
                  >
                    {SCENARIO_TILT[key].label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="Revenue growth" value={`${(fin.growth + finScenario.growthDelta).toFixed(0)}%`} explain="Base-case growth rate plus this scenario's growth delta." />
                <Metric label="Gross margin" value={`${(fin.grossMargin + finScenario.marginDelta).toFixed(0)}%`} explain="Base-case gross margin plus this scenario's margin delta." />
                <Metric label="NPV" value={fmtCr(finSummary.netPresentValue)} tone={finSummary.netPresentValue > 0 ? "good" : "bad"} />
                <Metric label="IRR" value={finSummary.irrValue !== null ? fmtPct(finSummary.irrValue) : "n/a"} tone={meetsHurdle ? "good" : "bad"} />
              </div>
            </Card>

            <Card title="How the recommendation shifts by scenario" sub="Each scenario re-weights the location scoring model toward what matters most in that environment." explain="Each scenario applies a weight delta on top of your current sliders (e.g. the bear case adds +10 to cost and +5 to risk, then re-normalizes), then re-ranks all candidate locations.">
              <div className="grid sm:grid-cols-3 gap-4">
                {scenarioWinners.map((s) => (
                  <div key={s.key} className={`glass-tile rounded-2xl p-4 transition-shadow ${scenario === s.key ? "ring-2 ring-[#0A78FF]/50" : ""}`}>
                    <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#8492A6] font-semibold">{s.label}</div>
                    <div className="font-display text-lg font-semibold mt-1 text-[#101E33]">{s.winner}</div>
                    <div className="text-xs text-[#8492A6] mt-1 font-mono">Score {s.score.toFixed(0)}/100</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Sensitivity analysis \u2014 NPV drivers" sub="Impact on NPV from a \u00B120% swing in each assumption, holding others at base case. Bars ranked by magnitude of impact." explain="For each assumption, NPV is recalculated at \u221220% and +20% of its base value with everything else fixed. Bars are sorted by the resulting NPV spread \u2014 the biggest bars are what the outcome is most sensitive to.">
              <TornadoChart fin={fin} fmtCr={fmtCr} />
            </Card>
          </div>
        )}

        {/* ---------------- INSIGHTS ---------------- */}
        {tab === "insights" && top && (
          <div className="space-y-6 tab-panel" key="insights">
            <Card title="Why this location?" explain="Rule-based text generated from the scored data \u2014 not a separate AI judgement. It names the top location's highest sub-score, its lead over the runner-up, and its weakest sub-score." accent={SIGNAL}>
              <p className="text-sm text-[#3A4658] leading-relaxed">{narrativeFor(top, runnerUp)}</p>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card title="Opportunities" explain="Top location's three highest-scoring sub-dimensions." accent={GROWTH}>
                <ul className="text-sm space-y-2.5">
                  {topDrivers(top).map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: GROWTH }} /><span className="text-[#3A4658]">{d}</span></li>
                  ))}
                </ul>
              </Card>
              <Card title="Risks" explain="Top location's two lowest-scoring sub-dimensions, plus an IRR-hurdle flag if it applies." accent={ALERT}>
                <ul className="text-sm space-y-2.5">
                  {topRisks(top, finSummary, hurdle).map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ALERT }} /><span className="text-[#3A4658]">{d}</span></li>
                  ))}
                </ul>
              </Card>
              <Card title="Trade-offs" explain="Direct comparison between the #1 and #2 ranked locations on cost and risk." accent={VIOLET}>
                <ul className="text-sm space-y-2.5">
                  {tradeoffs(ranked).map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: VIOLET }} /><span className="text-[#3A4658]">{d}</span></li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card title="Implementation roadmap" explain="A generic four-phase template, not derived from the scored data — edit the actions to reflect the real plan.">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { phase: "Phase 1", title: "Market entry", time: "0\u20136 months", actions: "Validate demand, finalize entry mode, secure board approval" },
                  { phase: "Phase 2", title: "Site selection", time: "6\u201312 months", actions: `Finalize ${top.name}, land/lease negotiation, regulatory approvals` },
                  { phase: "Phase 3", title: "Setup", time: "12\u201324 months", actions: "Construction, hiring, supplier onboarding, systems setup" },
                  { phase: "Phase 4", title: "Scale", time: "24\u201360 months", actions: "Ramp production, expand distribution, monitor KPIs vs plan" },
                ].map((p) => (
                  <div key={p.phase} className="glass-tile rounded-2xl p-4">
                    <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#8492A6] font-semibold">{p.phase} &middot; {p.time}</div>
                    <div className="font-display text-base font-semibold mt-1 text-[#101E33]">{p.title}</div>
                    <div className="text-xs text-[#5B6B82] mt-2 leading-relaxed">{p.actions}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-8 text-xs text-[#8492A6] border-t border-[#0F1C30]/10 mt-8">
Location and financial figures start as illustrative seeded estimates, but can be replaced with AI-researched web data (Candidate locations) or figures extracted from an uploaded financial statement (Financial statements) — both are best-effort AI output, not verified market research, and should be checked before use. Every scoring weight, financial assumption and formula is editable above, and the small "i" icons throughout explain exactly how each number is calculated.
      </footer>
    </div>
  );
}

function FinInput({ label, value, onChange, explain }) {
  return (
    <Field label={label} explain={explain}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="gi"
      />
    </Field>
  );
}

function RankingTable({ ranked, onAudit, expandedAudit }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-[0.08em] text-[#8492A6] border-b border-[#0F1C30]/10 font-semibold">
            <th className="py-2 pr-2 w-10">Rank</th>
            <th className="py-2 pr-2">Location</th>
            <th className="py-2 pr-2">Score</th>
            <th className="py-2 pr-2">Recommendation</th>
            {onAudit && <th className="py-2 pr-2"></th>}
          </tr>
        </thead>
        <tbody>
          {ranked.map((loc, i) => {
            const tier = tierFor(loc.score);
            return (
              <React.Fragment key={loc.id}>
                <tr className="border-b border-[#0F1C30]/6 hover:bg-white/40 transition-colors">
                  <td className="py-2.5 pr-2">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-mono font-semibold"
                      style={i === 0 ? { background: "rgba(10,120,255,0.12)", color: SIGNAL } : { background: "rgba(15,28,48,0.06)", color: MUTED }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 font-semibold text-[#16233A]">
                    {loc.name}
                    {loc.isStarter && <span className="ml-2 text-[10px] font-normal" style={{ color: CAUTION }}>estimate</span>}
                    {loc.isAiSourced && <span className="ml-2 text-[10px] font-normal" style={{ color: GROWTH }}>AI-researched</span>}
                  </td>
                  <td className="py-2.5 pr-2 font-mono text-base font-semibold text-[#16233A]">{loc.score.toFixed(0)}</td>
                  <td className="py-2.5 pr-2"><Tag tone={tier.tone}>{tier.label}</Tag></td>
                  {onAudit && (
                    <td className="py-2.5 pr-2">
                      <button onClick={() => onAudit(loc.id)} className="text-xs text-[#0A78FF] font-medium hover:underline">
                        {expandedAudit === loc.id ? "hide calculation" : "view calculation"}
                      </button>
                    </td>
                  )}
                </tr>
                {onAudit && expandedAudit === loc.id && (
                  <tr className="audit-row">
                    <td colSpan={5} className="px-4 py-3.5" style={{ background: "rgba(10,120,255,0.05)" }}>
                      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {Object.entries(loc.parts).map(([k, p]) => (
                          <div key={k} className="flex justify-between border-b border-[#0F1C30]/8 pb-1">
                            <span className="text-[#7C8AA0]">{WEIGHT_LABELS[k]}</span>
                            <span className="text-[#16233A] font-mono font-medium">{p.raw.toFixed(0)} &times; {p.weight.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-[#8492A6] mt-2">Score = sum of (raw sub-score &times; normalized weight) &divide; 100 = {loc.score.toFixed(1)}</div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RadarComparison({ locations, selected }) {
  const dims = [
    { key: "marketOpportunity", label: "Market" },
    { key: "infrastructure", label: "Infra" },
    { key: "supplyChain", label: "Supply chain" },
    { key: "talent", label: "Talent" },
  ];
  const invertedDims = [
    { key: "costIndex", label: "Cost adv.", invert: true },
    { key: "competitiveIntensity", label: "Competitive adv.", invert: true },
    { key: "riskIndex", label: "Risk adj.", invert: true },
  ];
  const allDims = [...dims, ...invertedDims];
  const data = allDims.map((d) => {
    const row = { dimension: d.label };
    locations
      .filter((l) => selected.includes(l.id))
      .forEach((l) => {
        row[l.name] = d.invert ? 100 - l[d.key] : l[d.key];
      });
    return row;
  });
  const colors = [SIGNAL, VIOLET, GROWTH, CAUTION];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius={95}>
        <PolarGrid stroke="#D9E2EF" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "#5B6B82" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#B7C4D8" }} />
        {locations
          .filter((l) => selected.includes(l.id))
          .map((l, i) => (
            <Radar key={l.id} name={l.name} dataKey={l.name} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.12} strokeWidth={2} />
          ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function TornadoChart({ fin, fmtCr }) {
  const base = financialSummary(fin).netPresentValue;
  const vars = [
    { key: "growth", label: "Revenue growth", pct: 0.2 },
    { key: "grossMargin", label: "Gross margin", pct: 0.2 },
    { key: "opexPct", label: "Opex % revenue", pct: 0.2 },
    { key: "discountRate", label: "Discount rate", pct: 0.2 },
    { key: "capex", label: "Capex", pct: 0.2 },
  ];
  const rows = vars
    .map((v) => {
      const lowFin = { ...fin, [v.key]: fin[v.key] * (1 - v.pct) };
      const highFin = { ...fin, [v.key]: fin[v.key] * (1 + v.pct) };
      const lowNpv = financialSummary(lowFin).netPresentValue;
      const highNpv = financialSummary(highFin).netPresentValue;
      const spread = Math.abs(highNpv - lowNpv);
      return { ...v, lowNpv, highNpv, spread };
    })
    .sort((a, b) => b.spread - a.spread);
  const maxSpread = Math.max(...rows.map((r) => r.spread), 1);

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const lowPct = ((base - r.lowNpv) / maxSpread) * 50;
        const highPct = ((r.highNpv - base) / maxSpread) * 50;
        return (
          <div key={r.key}>
            <div className="flex justify-between text-xs text-[#5B6B82] mb-1">
              <span className="font-medium">{r.label}</span>
              <span className="font-mono">{fmtCr(r.lowNpv)} &nbsp;&ndash;&nbsp; {fmtCr(r.highNpv)}</span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "rgba(15,28,48,0.06)" }}>
              <div className="absolute top-0 bottom-0" style={{ left: `${50 - Math.max(lowPct, 0)}%`, width: `${Math.max(lowPct, 0)}%`, background: ALERT, opacity: 0.75 }} />
              <div className="absolute top-0 bottom-0" style={{ left: "50%", width: `${Math.max(highPct, 0)}%`, background: GROWTH, opacity: 0.8 }} />
              <div className="absolute top-0 bottom-0 w-px" style={{ left: "50%", background: "rgba(15,28,48,0.35)" }} />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-[#8492A6] pt-1">Base NPV: {fmtCr(base)}. Red = downside (\u221220%), green = upside (+20%).</p>
    </div>
  );
}
