/**
 * Deterministic all-India GeoWise demo graph.
 * Relationships: FIELD → SUB → ANALYSIS → CASE → VERIFY → REC (+ Jal Saheli, credits, photos).
 */

import {
  CHITTOOR,
  DATA_CLASSIFICATION,
  SELECTED_TIMELINE_DATE,
  TIMELINE_DATES,
  WATER_BODY_TYPES,
} from "./constants.js";
import { BASINS, CHITTOOR_SIGNATURE_FIELDS, STATES_AND_UTS } from "./indiaCatalog.js";
import { demoRing, offsetPoint, parcelRing } from "./geometry.js";
import {
  areaSqmFor,
  confidenceFor,
  fieldStatusFor,
  findingFor,
  idFor,
  interventionFor,
  landUseFor,
  lulcColor,
  ndviFor,
  ndwiFor,
  pick,
  riskFor,
  soilMoistureFor,
  temperatureFor,
  waterBodyTypeFor,
} from "./derive.js";

const JAL_MESSAGES = [
  "Water level appears lower than previous observation.",
  "Check dam structure appears damaged.",
  "New vegetation growth observed.",
  "Tank bund shows seepage after rainfall.",
  "Farm pond holding monsoon inflow.",
  "Canal outlet silted; reduced discharge.",
  "Wetland edge expanding into paddy.",
  "Percolation pit dry ahead of expected week.",
];

const CONTRIBUTORS = [
  "Meera N.",
  "Arjun P.",
  "Lakshmi R.",
  "Imran S.",
  "Nandini K.",
  "Vikram D.",
  "Anita B.",
  "Soren T.",
];

function basinForRegion(regionId, index) {
  const match = BASINS.find((b) => b.states.includes(regionId));
  if (match) return match;
  return BASINS[index % BASINS.length];
}

function buildRegions() {
  return STATES_AND_UTS.map((s, index) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    capital: s.capital,
    zone: s.zone,
    lat: s.lat,
    lng: s.lng,
    provenance: DATA_CLASSIFICATION,
    demoLabel: "Administrative point is a public capital location; analytics are demo.",
    rainfallBandMm: 400 + ((index * 83) % 2200),
    focus: s.id === "IN-AP",
  }));
}

function buildWatersheds() {
  return BASINS.map((b, index) => ({
    id: b.id,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
    regionIds: b.states,
    areaHa: 800 + index * 173,
    polygon: demoRing(b.lat, b.lng, b.radiusDeg, 14, index * 0.4),
    provenance: DATA_CLASSIFICATION,
    demoLabel: "Simplified demo catchment overlay — not an official basin boundary.",
  }));
}

function buildFields(_watersheds) {
  const signature = CHITTOOR_SIGNATURE_FIELDS.map((f) => ({
    ...f,
    coordinates: { lat: f.lat, lng: f.lng },
    polygon: parcelRing(f.lat, f.lng, Number(f.id.slice(-3))),
    color: lulcColor(f.landUse),
    provenance: DATA_CLASSIFICATION,
        demoLabel: "Demo parcel overlay on real Chittoor geography.",
        signature: true,
        searchText: "Chittoor Andhra Pradesh Area Lettuce Pennar Palar",
  }));

  const generated = [];
  let n = signature.length;
  STATES_AND_UTS.forEach((region, rIndex) => {
    const basin = basinForRegion(region.id, rIndex);
    if (region.id === "IN-AP") {
      return;
    }
    const parcelsPerRegion = region.type === "state" ? 3 : 2;
    for (let p = 0; p < parcelsPerRegion; p += 1) {
      n += 1;
      const point = offsetPoint(region.lat, region.lng, n + p, region.type === "ut" ? 0.08 : 0.22);
      const landUse = landUseFor(n);
      const risk = riskFor(n);
      generated.push({
        id: idFor("FIELD", n),
        localId: `IN-${region.id.slice(3)}-${String(p + 1).padStart(3, "0")}`,
        name: `${region.name} parcel ${p + 1}`,
        regionId: region.id,
        basinId: basin.id,
        lat: point.lat,
        lng: point.lng,
        coordinates: point,
        areaSqm: areaSqmFor(n),
        landUse,
        crop: landUse === "Agriculture" ? pick(n, ["Paddy", "Millets", "Cotton", "Pulses", "Horticulture"]) : "—",
        status: fieldStatusFor(risk),
        risk,
        ndvi: ndviFor(n, landUse),
        ndwi: ndwiFor(n, landUse),
        soilMoisture: soilMoistureFor(n, landUse),
        temperatureC: temperatureFor(n, point.lat),
        confidence: confidenceFor(n, risk),
        finding: findingFor(landUse, risk),
        ...(() => {
          const rec = interventionFor(n, risk);
          return { recommendation: rec.name, suitability: rec.suitability, alternatives: rec.alternatives };
        })(),
        polygon: parcelRing(point.lat, point.lng, n),
        color: lulcColor(landUse),
        provenance: DATA_CLASSIFICATION,
        demoLabel: "Demo parcel near a public capital/basin coordinate — not a cadastral plot.",
        signature: false,
      });
    }
  });

  return [...signature, ...generated];
}

function buildSubmissions(fields) {
  return fields.map((field, index) => ({
    id: idFor("SUB", index + 1),
    fieldId: field.id,
    regionId: field.regionId,
    basinId: field.basinId,
    title: `${field.finding} — ${field.name}`,
    source: index % 5 === 0 ? "Jal Saheli" : "Drishti",
    submittedAt: `2025-07-${String(16 + (index % 9)).padStart(2, "0")}T08:${String((index * 7) % 60).padStart(2, "0")}:00+05:30`,
    observer: pick(index, CONTRIBUTORS),
    waterBodyType: waterBodyTypeFor(index),
    notes: pick(index, JAL_MESSAGES),
    provenance: DATA_CLASSIFICATION,
  }));
}

function buildAnalyses(fields, submissions) {
  return fields.map((field, index) => ({
    id: idFor("ANALYSIS", index + 1),
    fieldId: field.id,
    submissionId: submissions[index].id,
    lulc: field.landUse,
    vegetation: { ndvi: field.ndvi, label: "Demo satellite index" },
    water: { ndwi: field.ndwi, label: "Demo water index" },
    soilMoisture: field.soilMoisture,
    temperatureC: field.temperatureC,
    changeDetected: field.risk !== "Low",
    risk: field.risk,
    confidence: field.confidence,
    finding: field.finding,
    xai: {
      headline: "WHY WAS THIS FLAGGED?",
      summary:
        field.risk === "High"
          ? "Demo analysis indicates increased land-use pressure combined with declining vegetation and water-index signals."
          : field.risk === "Medium"
            ? "Demo analysis indicates a moderate vegetation decline against a stable rainfall window."
            : "Demo analysis indicates stable catchment signals with no high-priority anomaly.",
      factors: [
        { name: "LULC change", weight: field.risk === "High" ? 92 : field.risk === "Medium" ? 64 : 28 },
        { name: "NDVI trend", weight: Math.round(field.ndvi * 100) },
        { name: "NDWI change", weight: Math.round(field.ndwi * 100) },
        { name: "Terrain", weight: 40 + (index % 30) },
        { name: "Rainfall", weight: 25 + (index % 40) },
      ],
    },
    provenance: DATA_CLASSIFICATION,
    demoLabel: "DEMO AI ANALYSIS",
  }));
}

function buildTriage(fields, submissions, analyses) {
  return fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => field.risk !== "Low" || field.signature)
    .map(({ field, index }, queueIndex) => ({
      id: idFor("CASE", queueIndex + 1),
      fieldId: field.id,
      submissionId: submissions[index].id,
      analysisId: analyses[index].id,
      regionId: field.regionId,
      basinId: field.basinId,
      priority: field.risk,
      title: field.finding,
      locationName: field.name,
      confidence: field.confidence,
      risk: field.risk,
      status: field.status === "Healthy" && field.risk === "Low" ? "Queued" : "Open",
      assignedTo: field.risk === "High" ? "Field Officer — Chittoor cell" : "Unassigned",
      provenance: DATA_CLASSIFICATION,
      demoLabel: "DEMO AUTONOMOUS TRIAGE SIMULATION",
    }));
}

function verificationStatusFor(field, index) {
  if (field.id === "FIELD-001") return "Pending";
  if (field.status === "Healthy" && field.risk === "Low") return "Verified";
  if (index % 11 === 0) return "Rejected";
  if (index % 5 === 0) return "More evidence";
  if (field.risk === "High") return "Pending";
  return "Verified";
}

function buildVerification(fields, submissions, analyses, triage) {
  const caseByField = new Map(triage.map((c) => [c.fieldId, c.id]));
  return fields.map((field, index) => {
    const status = verificationStatusFor(field, index);
    return {
      id: idFor("VERIFY", index + 1),
      fieldId: field.id,
      submissionId: submissions[index].id,
      analysisId: analyses[index].id,
      caseId: caseByField.get(field.id) ?? null,
      regionId: field.regionId,
      originalFinding: field.finding,
      evidence: {
        satelliteLayer: "Demo satellite layer",
        aiAnalysis: "Demo AI analysis",
        location: `${field.lat.toFixed(4)}, ${field.lng.toFixed(4)}`,
      },
      verifierNotes:
        status === "Verified"
          ? "Demo officer confirmed the mapped change against field context."
          : status === "Rejected"
            ? "Demo officer rejected: overlay does not match site condition."
            : "Awaiting field visit.",
      status,
      provenance: DATA_CLASSIFICATION,
    };
  });
}

function buildRecommendations(fields, analyses, verification) {
  return fields
    .filter((field) => field.risk !== "Low" || field.id === "FIELD-001" || field.id === "FIELD-004")
    .map((field, index) => {
      const rec = interventionFor(Number(field.id.slice(-3)), field.risk);
      const verify = verification.find((v) => v.fieldId === field.id);
      const analysis = analyses.find((a) => a.fieldId === field.id);
      return {
        id: idFor("REC", index + 1),
        fieldId: field.id,
        analysisId: analysis.id,
        verifyId: verify.id,
        regionId: field.regionId,
        recommended: field.recommendation,
        suitability: field.suitability,
        factors: {
          runoffPotential: 92 - (index % 12),
          terrainSuitability: 86 - (index % 10),
          soilSuitability: 81 - (index % 9),
          historicalSuccess: 89 - (index % 8),
        },
        alternatives: (field.alternatives ?? rec.alternatives).map((alt) => ({
          name: alt.name,
          suitability: alt.suitability,
        })),
        lifecycle: {
          observation: "Recorded",
          aiAnalysis: field.finding,
          risk: field.risk,
          recommendation: field.recommendation,
          verification: verify.status,
          outcome: verify.status === "Verified" ? "Intervention queued" : "Awaiting verification",
        },
        provenance: DATA_CLASSIFICATION,
      };
    });
}

function buildJalSaheli(fields, submissions) {
  const observations = [];
  STATES_AND_UTS.forEach((region) => {
    const regionFields = fields.filter((f) => f.regionId === region.id);
    const count = region.type === "state" ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const field = regionFields[i % Math.max(regionFields.length, 1)] ?? fields[0];
      const index = observations.length;
      const point = offsetPoint(region.lat, region.lng, 20 + i, 0.12);
      observations.push({
        id: idFor("JAL", index + 1),
        fieldId: field.id,
        submissionId: submissions.find((s) => s.fieldId === field.id)?.id ?? null,
        regionId: region.id,
        village: `Demo village ${i + 1}, ${region.capital}`,
        lat: point.lat,
        lng: point.lng,
        timestamp: `2025-07-${String(16 + (index % 9)).padStart(2, "0")}T1${index % 8}:12:00+05:30`,
        category: waterBodyTypeFor(index),
        message: pick(index, JAL_MESSAGES),
        contributor: pick(index + 2, CONTRIBUTORS),
        status: pick(index, ["Pending", "Verified", "Monitor"]),
        aiTriage: pick(index, ["High", "Medium", "Low"]),
        provenance: DATA_CLASSIFICATION,
        demoLabel: "DEMO COMMUNITY CHANNEL — not Telegram, not a live network.",
      });
    }
  });
  return observations;
}

function buildCredits(jalSaheli, verification) {
  const byRegion = new Map();
  STATES_AND_UTS.forEach((region) => {
    byRegion.set(region.id, {
      regionId: region.id,
      regionName: region.name,
      villageStewardshipScore: 400 + (region.name.length * 17) % 900,
      verifiedImprovements: 0,
      eligibleBenefits: 2 + (region.name.length % 3),
      transactions: [],
      provenance: DATA_CLASSIFICATION,
      demoLabel: "DEMO REWARD SIMULATION — not monetary payment.",
    });
  });

  jalSaheli.forEach((obs, index) => {
    const ledger = byRegion.get(obs.regionId);
    const amount = obs.status === "Verified" ? 50 : 25;
    ledger.transactions.push({
      id: idFor("CR", index + 1),
      amount,
      reason: obs.status === "Verified" ? "Verified observation" : "Community observation",
      at: obs.timestamp,
      observationId: obs.id,
    });
    ledger.villageStewardshipScore += amount;
    if (obs.status === "Verified") ledger.verifiedImprovements += 1;
  });

  verification
    .filter((v) => v.status === "Verified")
    .forEach((v, index) => {
      const ledger = byRegion.get(v.regionId);
      ledger.transactions.push({
        id: idFor("CRV", index + 1),
        amount: 100,
        reason: "Confirmed intervention",
        at: `2025-07-2${index % 4}T09:00:00+05:30`,
        verifyId: v.id,
      });
      ledger.villageStewardshipScore += 100;
      ledger.verifiedImprovements += 1;
    });

  return [...byRegion.values()];
}

function buildObservations(fields) {
  return STATES_AND_UTS.map((region, index) => {
    const field = fields.find((f) => f.regionId === region.id) ?? fields[0];
    const point = offsetPoint(region.lat, region.lng, 3, 0.05);
    return {
      id: idFor("OBS", index + 1),
      fieldId: field.id,
      regionId: region.id,
      capturedAt: `2025-07-${String(16 + (index % 9)).padStart(2, "0")}T07:40:00+05:30`,
      lat: point.lat,
      lng: point.lng,
      locationSource: "Demo GPS stamp",
      waterBodyType: WATER_BODY_TYPES[index % WATER_BODY_TYPES.length],
      userNotes: "Seeded demo photo capture — no binary image stored.",
      visionProvider: "DemoVisionProvider",
      analysis: {
        scene: pick(index, ["Water visible", "Dry bed", "Structure + water", "Vegetation edge"]),
        waterPresence: index % 4 !== 0,
        structureCondition: pick(index, ["Intact", "Damaged", "Not visible"]),
        vegetationEdge: pick(index, ["Greening", "Stressed", "Unclear"]),
        agreesWithUserLabel: index % 7 !== 0,
        confidence: 70 + (index % 22),
        qualitativeWaterIndex: Number((0.2 + (index % 6) * 0.05).toFixed(2)),
        rationale:
          "Demo vision pass only. Connect Gemini to replace this with a live image analysis.",
      },
      provenance: DATA_CLASSIFICATION,
      demoLabel: "DEMO VISION — not a live model unless Gemini is configured.",
    };
  });
}

function sparkline(seed, length = 8) {
  return Array.from({ length }, (_, i) => Number((seed + Math.sin(i + seed) * 1.4).toFixed(2)));
}

function buildWeather() {
  const byRegion = STATES_AND_UTS.map((region, index) => ({
    regionId: region.id,
    regionName: region.name,
    period: "Last 7 days",
    temperatureC: temperatureFor(index, region.lat),
    rainfallMm: 4 + (index * 3) % 38,
    humidityPct: 48 + (index * 5) % 40,
    windKmh: Number((4 + (index % 12) * 0.7).toFixed(1)),
    provenance: DATA_CLASSIFICATION,
    demoLabel: "DEMO weather values — not IMD live feed.",
  }));

  const national = {
    regionId: "IN",
    regionName: "India (demo rollup)",
    period: "Last 7 days",
    temperatureC: 21.4,
    rainfallMm: 12,
    humidityPct: 68,
    windKmh: 8.2,
    provenance: DATA_CLASSIFICATION,
    demoLabel: "Signature demo weather shown on Command Center; regional values differ by state.",
  };

  return { national, byRegion };
}

function buildTimeline(fields) {
  return {
    label: "DEMO OBSERVATION TIMELINE",
    selectedDate: SELECTED_TIMELINE_DATE,
    dates: TIMELINE_DATES.map((date, index) => ({
      date,
      label: `${Number(date.slice(-2))} Jul`,
      selected: date === SELECTED_TIMELINE_DATE,
      overlayShift: index - 3,
    })),
    seriesByField: Object.fromEntries(
      fields.map((field) => [
        field.id,
        TIMELINE_DATES.map((date, i) => ({
          date,
          ndvi: Number((field.ndvi + (i - 3) * 0.01).toFixed(3)),
          ndwi: Number((field.ndwi + (i - 3) * 0.006).toFixed(3)),
          soilMoisture: field.soilMoisture + (i - 3),
          temperatureC: Number((field.temperatureC + (i % 3) * 0.3).toFixed(1)),
          precipitationMm: Math.max(0, 6 + ((i * 3 + field.areaSqm) % 11) - 4),
        })),
      ]),
    ),
    provenance: DATA_CLASSIFICATION,
  };
}

function lulcDistribution(fields) {
  const counts = {};
  fields.forEach((f) => {
    counts[f.landUse] = (counts[f.landUse] || 0) + 1;
  });
  const total = fields.length || 1;
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    pct: Number(((count / total) * 100).toFixed(1)),
    color: lulcColor(name),
  }));
}

function buildAnalytics(fields, verification, jalSaheli, recommendations) {
  const ranges = ["7D", "30D", "90D", "1Y"];
  const byRange = {};
  ranges.forEach((range, r) => {
    const scale = [1, 1.4, 2.1, 3.2][r];
    byRange[range] = {
      ndviTrend: sparkline(0.5, 12).map((v) => Number((v * 0.2 + 0.4 / scale).toFixed(3))),
      ndwiTrend: sparkline(0.3, 12).map((v) => Number((v * 0.12 + 0.2).toFixed(3))),
      waterbodyChange: sparkline(2 + r, 12),
      verificationOutcomes: {
        verified: verification.filter((v) => v.status === "Verified").length,
        pending: verification.filter((v) => v.status === "Pending").length,
        rejected: verification.filter((v) => v.status === "Rejected").length,
        moreEvidence: verification.filter((v) => v.status === "More evidence").length,
      },
      interventionSuccess: Number((68 + r * 4).toFixed(1)),
      jalSaheliParticipation: jalSaheli.length,
      recommendedInterventions: recommendations.length,
    };
  });

  const byRegion = STATES_AND_UTS.map((region) => {
    const regionFields = fields.filter((f) => f.regionId === region.id);
    return {
      regionId: region.id,
      name: region.name,
      fields: regionFields.length,
      highRisk: regionFields.filter((f) => f.risk === "High").length,
      meanNdvi: Number(
        (
          regionFields.reduce((s, f) => s + f.ndvi, 0) / Math.max(regionFields.length, 1)
        ).toFixed(2),
      ),
    };
  });

  return {
    lulcDistribution: lulcDistribution(fields),
    byRange,
    byRegion,
    provenance: DATA_CLASSIFICATION,
    demoLabel: "DEMO LEARNING / ANALYTICS SIMULATION",
  };
}

function buildNotifications(triage, jalSaheli, credits) {
  return [
    {
      id: "NOTIF-001",
      type: "ai",
      title: "AI anomaly detected",
      body: "High-risk waterbody change on Area 01 (Chittoor).",
      read: false,
    },
    {
      id: "NOTIF-002",
      type: "verification",
      title: "Verification required",
      body: `${triage.filter((t) => t.priority === "High").length} high-priority cases in the national queue.`,
      read: false,
    },
    {
      id: "NOTIF-003",
      type: "case",
      title: "Case confirmed",
      body: "A verified intervention was recorded in the demo ledger.",
      read: true,
    },
    {
      id: "NOTIF-004",
      type: "recommendation",
      title: "Recommendation generated",
      body: "Farm pond suitability 87% for FIELD-001.",
      read: false,
    },
    {
      id: "NOTIF-005",
      type: "jal",
      title: "Jal Saheli observation received",
      body: jalSaheli[0].message,
      read: false,
    },
    {
      id: "NOTIF-006",
      type: "credit",
      title: "Jal Credit awarded",
      body: `+${credits[0].transactions[0]?.amount ?? 50} demo credits (not money).`,
      read: true,
    },
  ].map((n) => ({ ...n, provenance: DATA_CLASSIFICATION }));
}

function buildFusion() {
  return {
    title: "UNIFIED DATA FUSION ENGINE",
    sources: [
      { id: "drishti", name: "Drishti", description: "Geo-tagged field observations", status: "Connected — Demo Provider" },
      { id: "srishti", name: "Srishti", description: "Satellite / geospatial information", status: "Connected — Demo Provider" },
      { id: "historical", name: "Historical watershed records", description: "Past interventions and outcomes", status: "Connected — Demo Provider" },
    ],
    output: "Unified Geospatial Record",
    provenance: DATA_CLASSIFICATION,
  };
}

function buildInnovationFlow() {
  return [
    { step: 1, id: "detect", title: "AI detects anomaly", route: "/geo-ai" },
    { step: 2, id: "triage", title: "Triage flags low-confidence", route: "/triage" },
    { step: 3, id: "xai", title: "XAI explains why this zone", route: "/xai" },
    { step: 4, id: "verify", title: "Field officer verifies", route: "/verification" },
    { step: 5, id: "learn", title: "Closed-loop learning", route: "/learning" },
    { step: 6, id: "credits", title: "Jal Credits awarded", route: "/credits" },
  ];
}

function kpis(fields, submissions, verification, triage, watersheds, recommendations) {
  const verified = verification.filter((v) => v.status === "Verified").length;
  const lowConfidence = fields.filter((f) => f.confidence < 80).length;
  const active = verification.filter((v) => v.status === "Pending" || v.status === "More evidence").length;
  return [
    {
      id: "totalSubmissions",
      label: "Total submissions",
      value: submissions.length,
      trendPct: 12,
      description: "Field observations",
      status: "ok",
    },
    {
      id: "verifiedSubmissions",
      label: "Verified submissions",
      value: verified,
      trendPct: 8,
      description: "Officer-confirmed demo cases",
      status: "ok",
    },
    {
      id: "lowConfidence",
      label: "Low-confidence cases",
      value: lowConfidence,
      trendPct: -20,
      description: "Demo model uncertainty",
      status: "alert",
    },
    {
      id: "activeVerification",
      label: "Active verification tasks",
      value: active,
      trendPct: 25,
      description: "Pending field follow-up",
      status: "warn",
    },
    {
      id: "watershedFeatures",
      label: "Watershed features",
      value: watersheds.length + fields.length,
      trendPct: 15,
      description: "Demo overlays nationwide",
      status: "ok",
    },
    {
      id: "recommendedInterventions",
      label: "Recommended interventions",
      value: recommendations.length,
      trendPct: 29,
      description: "Predictive demo recs",
      status: "ok",
    },
  ];
}

function chittoorKpis() {
  return [
    { id: "totalSubmissions", label: "Total submissions", value: 24, trendPct: 12, description: "Field observations", status: "ok" },
    { id: "verifiedSubmissions", label: "Verified submissions", value: 17, trendPct: 8, description: "Officer-confirmed demo cases", status: "ok" },
    { id: "lowConfidence", label: "Low-confidence cases", value: 4, trendPct: -20, description: "Demo model uncertainty", status: "alert" },
    { id: "activeVerification", label: "Active verification tasks", value: 6, trendPct: 25, description: "Pending field follow-up", status: "warn" },
    { id: "watershedFeatures", label: "Watershed features", value: 31, trendPct: 15, description: "Demo overlays", status: "ok" },
    { id: "recommendedInterventions", label: "Recommended interventions", value: 9, trendPct: 29, description: "Predictive demo recs", status: "ok" },
  ];
}

let cached = null;

export function buildIndiaDataset() {
  if (cached) return cached;

  const regions = buildRegions();
  const watersheds = buildWatersheds();
  const fields = buildFields(watersheds);
  const submissions = buildSubmissions(fields);
  const analyses = buildAnalyses(fields, submissions);
  const triage = buildTriage(fields, submissions, analyses);
  const verification = buildVerification(fields, submissions, analyses, triage);
  const recommendations = buildRecommendations(fields, analyses, verification);
  const jalSaheli = buildJalSaheli(fields, submissions);
  const credits = buildCredits(jalSaheli, verification);
  const observations = buildObservations(fields);
  const weather = buildWeather();
  const timeline = buildTimeline(fields);
  const analytics = buildAnalytics(fields, verification, jalSaheli, recommendations);
  const notifications = buildNotifications(triage, jalSaheli, credits);

  cached = {
    classification: DATA_CLASSIFICATION,
    focus: CHITTOOR,
    regions,
    watersheds,
    fields,
    submissions,
    analyses,
    triage,
    verification,
    recommendations,
    jalSaheli,
    credits,
    observations,
    weather,
    timeline,
    analytics,
    notifications,
    fusion: buildFusion(),
    innovationFlow: buildInnovationFlow(),
    kpis: {
      india: kpis(fields, submissions, verification, triage, watersheds, recommendations),
      chittoor: chittoorKpis(),
    },
    counts: {
      regions: regions.length,
      watersheds: watersheds.length,
      fields: fields.length,
      submissions: submissions.length,
      analyses: analyses.length,
      triage: triage.length,
      verification: verification.length,
      recommendations: recommendations.length,
      jalSaheli: jalSaheli.length,
      observations: observations.length,
    },
  };

  return cached;
}
