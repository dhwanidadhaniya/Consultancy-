export function fmtM(n, decimals = 1) {
  if (n === undefined || n === null) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(decimals)}M`;
}

export function fmtPct(n, decimals = 1) {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(decimals)}%`;
}

export function fmtDelta(current, prior, opts = {}) {
  const { unit = "", decimals = 1, invert = false } = opts;
  if (current === undefined || prior === undefined) return { text: "—", dir: "flat" };
  const diff = current - prior;
  const dir = Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "up" : "down";
  const displayDir = invert ? (dir === "up" ? "down" : dir === "down" ? "up" : "flat") : dir;
  const arrow = dir === "up" ? "\u2191" : dir === "down" ? "\u2193" : "\u2192";
  return {
    text: `${arrow} ${Math.abs(diff).toFixed(decimals)}${unit} vs prior year`,
    dir: displayDir,
  };
}

export function statusToPillClass(status) {
  switch (status) {
    case "Complete":
    case "On Track":
      return "good";
    case "At Risk":
    case "Delayed":
      return "warn";
    case "Not Started":
      return "neutral";
    case "Off Track":
      return "bad";
    default:
      return "neutral";
  }
}

export function priorityClass(priority) {
  if (priority === "Critical") return "priority-critical";
  if (priority === "High") return "priority-high";
  return "priority-medium";
}
