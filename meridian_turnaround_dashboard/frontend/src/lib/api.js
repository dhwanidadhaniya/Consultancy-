const BASE = "/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}

export const api = {
  company: () => get("/company"),
  kpis: () => get("/kpis"),
  financials: () => get("/financials"),
  operations: () => get("/operations"),
  strategy: () => get("/strategy"),
  initiatives: () => get("/initiatives"),
  scenario: (payload) => post("/scenario", payload),
};
