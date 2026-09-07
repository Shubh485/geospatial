import { demoDataProvider } from "../../services/demoDataProvider.js";
import { buildIndiaDataset } from "./dataset.js";

const db = buildIndiaDataset();
const dash = demoDataProvider.getDashboard("india");
const chittoor = demoDataProvider.getDashboard("chittoor");
const field = demoDataProvider.getField("FIELD-001");
const linked = demoDataProvider.getLinkedRecord("FIELD-001");

console.log(JSON.stringify({
  environment: demoDataProvider.environment,
  geography: demoDataProvider.geography,
  counts: db.counts,
  indiaKpis: dash.kpis.map((k) => ({ label: k.label, value: k.value })),
  chittoorKpis: chittoor.kpis.map((k) => ({ label: k.label, value: k.value })),
  field001: {
    name: field.name,
    lat: field.lat,
    lng: field.lng,
    ndvi: field.ndvi,
    risk: field.risk,
  },
  chain: {
    submission: linked.submission.id,
    analysis: linked.analysis.id,
    case: linked.case?.id ?? null,
    verify: linked.verification.id,
    rec: linked.recommendation?.id ?? null,
  },
  searchSample: demoDataProvider.search("Chittoor").slice(0, 5),
  regions: db.regions.length,
  zones: [...new Set(db.regions.map((r) => r.zone))],
}, null, 2));
