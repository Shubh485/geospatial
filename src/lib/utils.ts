export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function ringToLatLngs(ring: number[][]) {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

export function ndviColor(v: number) {
  if (v < 0.35) return "#854d0e";
  if (v < 0.55) return "#ca8a04";
  return "#16a34a";
}

export function soilColor(v: number) {
  if (v < 15) return "#78350f";
  if (v < 22) return "#38bdf8";
  return "#0369a1";
}

export function ndwiColor(v: number) {
  if (v < 0.15) return "#1e3a5f";
  if (v < 0.3) return "#0369a1";
  return "#22d3ee";
}

export function riskTone(risk: string) {
  if (risk === "High" || risk === "Rejected") return "critical";
  if (risk === "Medium" || risk === "Monitor" || risk === "More evidence" || risk === "Pending") return "warn";
  if (risk === "Verified" || risk === "Healthy" || risk === "Low") return "ok";
  return "info";
}
