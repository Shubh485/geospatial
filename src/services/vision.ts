const GEMINI_MODEL = "gemini-2.0-flash";

function geminiUrl(key: string) {
  const path = `/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  if (import.meta.env.DEV) return `/api/gemini${path}`;
  return `https://generativelanguage.googleapis.com/v1beta${path}`;
}

export type VisionResult = {
  provider: "DemoVisionProvider" | "GeminiVisionProvider";
  scene: string;
  waterPresence: boolean;
  structureCondition: string;
  vegetationEdge: string;
  agreesWithUserLabel: boolean;
  confidence: number;
  qualitativeWaterIndex: number;
  rationale: string;
  elements: string[];
};

export type DetectionBox = {
  label: string;
  className: "water" | "agriculture" | "vegetation" | "built-up" | "bare" | "cloud" | "structure" | "other";
  confidence: number;
  /** Percent of image: 0–100 */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SatelliteDetectResult = {
  provider: "DemoVisionProvider" | "GeminiVisionProvider";
  summary: string;
  landCoverGuess: string;
  waterLikely: boolean;
  cloudCoverPct: number;
  confidence: number;
  rationale: string;
  detections: DetectionBox[];
};

export async function analyzeSatelliteImage(opts: {
  dataUrl: string;
  notes: string;
  regionHint: string;
}): Promise<SatelliteDetectResult> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (key) {
    try {
      return await runGeminiSatellite(key, opts);
    } catch {
      const fallback = demoSatellite(opts);
      return {
        ...fallback,
        rationale: `${fallback.rationale} Gemini request failed; showing demo detections instead.`,
      };
    }
  }
  return demoSatellite(opts);
}

function demoSatellite(opts: { notes: string; regionHint: string }): SatelliteDetectResult {
  const hash = [...opts.notes, ...opts.regionHint, "sat"].reduce((s, c) => s + c.charCodeAt(0), 0);
  return {
    provider: "DemoVisionProvider",
    summary: "Demo RGB scene parse: mixed farmland with a possible water body. Not a spectral satellite product.",
    landCoverGuess: hash % 2 === 0 ? "Agriculture + water" : "Agriculture + vegetation",
    waterLikely: hash % 4 !== 0,
    cloudCoverPct: hash % 18,
    confidence: 68 + (hash % 16),
    rationale:
      "Demo detector only. Bounding boxes are simulated. Set VITE_GEMINI_API_KEY to run Gemini on the uploaded image. This is not NDVI/NDWI and not live ISRO/Bhuvan processing.",
    detections: [
      { label: "Possible water / tank", className: "water", confidence: 81, x: 12, y: 18, w: 28, h: 22 },
      { label: "Agricultural parcels", className: "agriculture", confidence: 76, x: 42, y: 30, w: 46, h: 40 },
      { label: "Vegetation edge", className: "vegetation", confidence: 71, x: 8, y: 58, w: 34, h: 24 },
      { label: "Built-up / roof cluster", className: "built-up", confidence: 64, x: 62, y: 8, w: 26, h: 18 },
    ],
  };
}

async function runGeminiSatellite(
  key: string,
  opts: { dataUrl: string; notes: string; regionHint: string },
): Promise<SatelliteDetectResult> {
  const base64 = opts.dataUrl.split(",")[1] ?? "";
  const mime = opts.dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
  const prompt = `You analyze one RGB satellite or aerial image for GeoWise (demo environment).
Region hint: ${opts.regionHint}
Notes: ${opts.notes || "none"}
Return JSON only:
{
  "summary": string,
  "landCoverGuess": string,
  "waterLikely": boolean,
  "cloudCoverPct": number,
  "confidence": number,
  "rationale": string,
  "detections": [
    { "label": string, "className": "water"|"agriculture"|"vegetation"|"built-up"|"bare"|"cloud"|"structure"|"other", "confidence": number, "x": number, "y": number, "w": number, "h": number }
  ]
}
Boxes are percentages of the image (x,y = top-left, w,h = size, 0-100).
Detect visible water, fields, vegetation, built-up, bare soil, clouds, tanks/check dams if visible.
Do not claim NDVI, NDWI, SAR, or official government classification. This is RGB photo interpretation only.`;

  const res = await fetch(geminiUrl(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
        generationConfig: { temperature: 0.1 },
      }),
    },
  );
  if (!res.ok) throw new Error("gemini failed");
  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const detections = Array.isArray(parsed.detections)
    ? parsed.detections.map((d: Record<string, unknown>) => ({
        label: String(d.label ?? "Feature"),
        className: (d.className as SatelliteDetectResult["detections"][0]["className"]) ?? "other",
        confidence: Number(d.confidence ?? 60),
        x: Number(d.x ?? 10),
        y: Number(d.y ?? 10),
        w: Number(d.w ?? 20),
        h: Number(d.h ?? 20),
      }))
    : [];
  return {
    provider: "GeminiVisionProvider",
    summary: String(parsed.summary ?? "Gemini RGB scene parse"),
    landCoverGuess: String(parsed.landCoverGuess ?? "Unclear"),
    waterLikely: Boolean(parsed.waterLikely),
    cloudCoverPct: Number(parsed.cloudCoverPct ?? 0),
    confidence: Number(parsed.confidence ?? 70),
    rationale: String(parsed.rationale ?? "Gemini vision on uploaded RGB image (demo environment)."),
    detections,
  };
}

export async function analyzeWatershedImage(opts: {
  dataUrl: string;
  waterBodyType: string;
  notes: string;
}): Promise<VisionResult> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (key) {
    try {
      return await runGemini(key, opts);
    } catch {
      const fallback = demoVision(opts);
      return {
        ...fallback,
        rationale: `${fallback.rationale} Gemini request failed; showing demo vision instead.`,
      };
    }
  }
  return demoVision(opts);
}

function demoVision(opts: { waterBodyType: string; notes: string }): VisionResult {
  const hash = [...opts.waterBodyType, ...opts.notes].reduce((s, c) => s + c.charCodeAt(0), 0);
  return {
    provider: "DemoVisionProvider",
    scene: "Water + bund visible (demo)",
    waterPresence: hash % 5 !== 0,
    structureCondition: hash % 4 === 0 ? "Damaged" : "Intact",
    vegetationEdge: hash % 3 === 0 ? "Stressed" : "Greening",
    agreesWithUserLabel: hash % 7 !== 0,
    confidence: 72 + (hash % 18),
    qualitativeWaterIndex: Number((0.22 + (hash % 8) * 0.03).toFixed(2)),
    rationale:
      "Demo vision only. Image-based estimates are not satellite NDVI/NDWI. Set VITE_GEMINI_API_KEY to use Gemini.",
    elements: ["water surface", "earthen bund", "shore vegetation"],
  };
}

async function runGemini(
  key: string,
  opts: { dataUrl: string; waterBodyType: string; notes: string },
): Promise<VisionResult> {
  const base64 = opts.dataUrl.split(",")[1] ?? "";
  const mime = opts.dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
  const prompt = `You are GeoWise demo vision. Analyze this watershed / water-body photo.
User-selected type: ${opts.waterBodyType}
Notes: ${opts.notes || "none"}
Return JSON only with keys: scene, waterPresence (boolean), structureCondition, vegetationEdge, agreesWithUserLabel (boolean), confidence (0-100), qualitativeWaterIndex (0-1), rationale, elements (string array).
Do not claim this is official government analysis.`;

  const res = await fetch(geminiUrl(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) throw new Error("gemini failed");
  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    provider: "GeminiVisionProvider",
    scene: String(parsed.scene ?? "Scene parsed"),
    waterPresence: Boolean(parsed.waterPresence),
    structureCondition: String(parsed.structureCondition ?? "Unclear"),
    vegetationEdge: String(parsed.vegetationEdge ?? "Unclear"),
    agreesWithUserLabel: Boolean(parsed.agreesWithUserLabel),
    confidence: Number(parsed.confidence ?? 70),
    qualitativeWaterIndex: Number(parsed.qualitativeWaterIndex ?? 0.3),
    rationale: String(parsed.rationale ?? "Gemini vision (demo environment)."),
    elements: Array.isArray(parsed.elements) ? parsed.elements.map(String) : [],
  };
}
