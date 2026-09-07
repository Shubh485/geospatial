import { LAND_USES, RISK_LEVELS, WATER_BODY_TYPES } from "./constants.js";

export function pad(n, width = 3) {
  return String(n).padStart(width, "0");
}

export function idFor(prefix, n) {
  return `${prefix}-${pad(n)}`;
}

/** Stable 0..mod-1 from integer (no Math.random). */
export function cycle(index, mod) {
  return ((index % mod) + mod) % mod;
}

export function pick(index, list) {
  return list[cycle(index, list.length)];
}

export function metric(index, base, span, decimals = 2) {
  const value = base + cycle(index * 3 + 1, span * 10 + 1) / 10;
  return Number(value.toFixed(decimals));
}

export function landUseFor(index) {
  return pick(index, LAND_USES);
}

export function riskFor(index) {
  const bucket = cycle(index, 10);
  if (bucket <= 1) return "High";
  if (bucket <= 4) return "Medium";
  return "Low";
}

export function waterBodyTypeFor(index) {
  return pick(index, WATER_BODY_TYPES);
}

export function confidenceFor(index, risk) {
  if (risk === "High") return 78 + cycle(index, 18);
  if (risk === "Medium") return 70 + cycle(index, 16);
  return 64 + cycle(index, 20);
}

export function ndviFor(index, landUse) {
  if (landUse === "Forest") return metric(index, 0.62, 2);
  if (landUse === "Agriculture") return metric(index, 0.48, 3);
  if (landUse === "Waterbody") return metric(index, 0.18, 2);
  if (landUse === "Built-up") return metric(index, 0.22, 2);
  return metric(index, 0.28, 2);
}

export function ndwiFor(index, landUse) {
  if (landUse === "Waterbody") return metric(index, 0.42, 2);
  if (landUse === "Agriculture") return metric(index, 0.2, 2);
  if (landUse === "Forest") return metric(index, 0.16, 2);
  return metric(index, 0.08, 2);
}

export function soilMoistureFor(index, landUse) {
  if (landUse === "Waterbody") return 40 + cycle(index, 25);
  if (landUse === "Agriculture") return 18 + cycle(index, 16);
  if (landUse === "Forest") return 22 + cycle(index, 14);
  return 8 + cycle(index, 12);
}

export function temperatureFor(index, lat) {
  const latitudeEffect = Math.max(8, 32 - Math.abs(lat - 20) * 0.35);
  return Number((latitudeEffect + cycle(index, 6) * 0.4).toFixed(1));
}

export function areaSqmFor(index) {
  return 900 + cycle(index * 11, 40) * 85;
}

export function interventionFor(index, risk) {
  const options = [
    { name: "Farm pond", suitability: 87 },
    { name: "Check dam", suitability: 82 },
    { name: "Percolation pit", suitability: 76 },
    { name: "Contour trench", suitability: 71 },
    { name: "Recharge well", suitability: 74 },
    { name: "Bund strengthening", suitability: 79 },
  ];
  const pickIndex = risk === "High" ? cycle(index, 2) : cycle(index + 2, options.length);
  const item = options[pickIndex];
  return {
    name: item.name,
    suitability: item.suitability - cycle(index, 5),
    alternatives: options.filter((o) => o.name !== item.name).slice(0, 3),
  };
}

export function findingFor(landUse, risk) {
  if (risk === "High" && landUse === "Waterbody") return "Waterbody change";
  if (risk === "High") return "Land-use pressure";
  if (risk === "Medium") return "Vegetation decline";
  if (landUse === "Built-up") return "Structure observation";
  return "Stable catchment signal";
}

export function fieldStatusFor(risk) {
  if (risk === "High") return "At risk";
  if (risk === "Medium") return "Monitor";
  return "Healthy";
}

export function lulcColor(landUse) {
  switch (landUse) {
    case "Agriculture":
      return "#65a30d";
    case "Forest":
      return "#166534";
    case "Waterbody":
      return "#0284c7";
    case "Built-up":
      return "#78716c";
    case "Barren":
      return "#d97706";
    default:
      return "#64748b";
  }
}

export const RISK_LEVEL_ORDER = RISK_LEVELS;
