const GEMINI_MODEL = "gemini-2.0-flash";

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

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
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
