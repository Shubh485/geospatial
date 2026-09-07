import { CHITTOOR, INDIA_BOUNDS, INDIA_CENTER } from "../data/demo/constants.js";
import { buildIndiaDataset } from "../data/demo/dataset.js";

function clone(value) {
  return structuredClone(value);
}

function byId(list, id) {
  return list.find((item) => item.id === id) ?? null;
}

/**
 * DemoDataProvider — replace with RealDataProvider later.
 * All analytics are DEMO INTELLIGENCE. Coordinates for points sit on real Indian geography.
 */
export function createDemoDataProvider() {
  const db = buildIndiaDataset();

  const filterByRegion = (list, regionId) => {
    if (!regionId || regionId === "IN") return list;
    return list.filter((item) => item.regionId === regionId || item.regionIds?.includes(regionId));
  };

  return {
    environment: "DEMO",
    geography: {
      bounds: INDIA_BOUNDS,
      center: INDIA_CENTER,
      focus: CHITTOOR,
    },

    getDashboard(scope = "india") {
      const kpis = scope === "chittoor" ? db.kpis.chittoor : db.kpis.india;
      return clone({
        scope,
        kpis,
        counts: db.counts,
        fusion: db.fusion,
        innovationFlow: db.innovationFlow,
        weather: scope === "chittoor" ? db.weather.national : db.weather.national,
        provenance: db.classification,
      });
    },

    getRegions() {
      return clone(db.regions);
    },

    getWatersheds(regionId) {
      return clone(filterByRegion(db.watersheds, regionId));
    },

    getFields(regionId) {
      return clone(filterByRegion(db.fields, regionId));
    },

    getField(id) {
      return clone(byId(db.fields, id));
    },

    getSubmissions(regionId) {
      return clone(filterByRegion(db.submissions, regionId));
    },

    getSubmission(id) {
      return clone(byId(db.submissions, id));
    },

    getAnalysis(id) {
      const byAnalysis = byId(db.analyses, id);
      if (byAnalysis) return clone(byAnalysis);
      return clone(db.analyses.find((a) => a.fieldId === id) ?? null);
    },

    getTriageCases(regionId) {
      return clone(filterByRegion(db.triage, regionId));
    },

    getVerificationCases(regionId) {
      return clone(filterByRegion(db.verification, regionId));
    },

    getRecommendations(regionId) {
      return clone(filterByRegion(db.recommendations, regionId));
    },

    getJalSaheli(regionId) {
      return clone(filterByRegion(db.jalSaheli, regionId));
    },

    getCredits(regionId) {
      if (!regionId || regionId === "IN") return clone(db.credits);
      return clone(db.credits.filter((c) => c.regionId === regionId));
    },

    getAnalytics() {
      return clone(db.analytics);
    },

    getTimeline() {
      return clone(db.timeline);
    },

    getWeather(regionId) {
      if (!regionId || regionId === "IN") return clone(db.weather.national);
      return clone(db.weather.byRegion.find((w) => w.regionId === regionId) ?? db.weather.national);
    },

    getObservations(regionId) {
      return clone(filterByRegion(db.observations, regionId));
    },

    getNotifications() {
      return clone(db.notifications);
    },

    getFusion() {
      return clone(db.fusion);
    },

    getInnovationFlow() {
      return clone(db.innovationFlow);
    },

    getLinkedRecord(fieldId) {
      const field = byId(db.fields, fieldId);
      if (!field) return null;
      return clone({
        field,
        submission: db.submissions.find((s) => s.fieldId === fieldId) ?? null,
        analysis: db.analyses.find((a) => a.fieldId === fieldId) ?? null,
        case: db.triage.find((c) => c.fieldId === fieldId) ?? null,
        verification: db.verification.find((v) => v.fieldId === fieldId) ?? null,
        recommendation: db.recommendations.find((r) => r.fieldId === fieldId) ?? null,
        jalSaheli: db.jalSaheli.filter((j) => j.fieldId === fieldId),
        observation: db.observations.find((o) => o.fieldId === fieldId) ?? null,
      });
    },

    search(query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return [];
      const hits = [];
      const push = (type, item, label) => {
        if (label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) {
          hits.push({ type, id: item.id, label, regionId: item.regionId ?? null, fieldId: item.fieldId ?? item.id });
        }
      };
      db.fields.forEach((f) =>
        push("field", f, `${f.name} ${f.localId} ${f.landUse} ${f.searchText ?? ""} ${f.basinId}`),
      );
      db.submissions.forEach((s) => push("submission", s, s.title));
      db.triage.forEach((c) => push("case", c, `${c.title} ${c.locationName}`));
      db.verification.forEach((v) => push("verification", v, `${v.originalFinding} ${v.status}`));
      db.recommendations.forEach((r) => push("recommendation", r, r.recommended));
      db.jalSaheli.forEach((j) => push("jal", j, `${j.village} ${j.message}`));
      db.regions.forEach((r) => push("location", r, `${r.name} ${r.capital} ${r.zone}`));
      push("location", { id: CHITTOOR.id, regionId: "IN-AP" }, `${CHITTOOR.name} ${CHITTOOR.state}`);
      return hits.slice(0, 40);
    },
  };
}

export const demoDataProvider = createDemoDataProvider();
export default demoDataProvider;
