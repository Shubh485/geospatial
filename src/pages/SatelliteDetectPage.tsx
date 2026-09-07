import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DemoTag, EmptyState, Panel, StatusBadge } from "../components/ui.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { analyzeSatelliteImage, type SatelliteDetectResult } from "../services/vision.ts";

const CLASS_COLOR: Record<string, string> = {
  water: "#22d3ee",
  agriculture: "#84cc16",
  vegetation: "#10b981",
  "built-up": "#a8a29e",
  bare: "#d97706",
  cloud: "#e2e8f0",
  structure: "#f59e0b",
  other: "#818cf8",
};

export function SatelliteDetectPage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const gemini = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  const [fileName, setFileName] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SatelliteDetectResult | null>(null);

  const regionHint =
    gw.scope === "chittoor"
      ? "Chittoor, Andhra Pradesh"
      : gw.scope === "india"
        ? "India (unspecified scene)"
        : String(gw.scope);

  async function onFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function detect() {
    if (!dataUrl) {
      setError("Upload a satellite or aerial image first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await analyzeSatelliteImage({ dataUrl, notes, regionHint });
      setResult(next);
      gw.pushToast(
        next.provider === "GeminiVisionProvider" ? "Gemini scene parse complete" : "Demo detections ready",
        "RGB interpretation only — not a spectral satellite index.",
      );
    } catch {
      setError("Detection failed. Retry, or check the Gemini key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Srishti · satellite detect</p>
        <h1 className="text-xl font-semibold">Detect features in a satellite / aerial image</h1>
        <p className="max-w-3xl text-sm text-muted">
          Upload your own RGB scene (export from Google Earth, a drone mosaic, or a screenshot of imagery). GeoWise does
          not pull classified rasters from the live map tiles. With a Gemini key this is real vision on <em>your</em>{" "}
          file. Without a key, boxes are a labeled demo so the page still runs.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <DemoTag>{gemini ? "VISION: GEMINI ON UPLOAD" : "VISION: DEMO DETECTOR"}</DemoTag>
          <DemoTag>NOT LIVE NDVI / BHUVAN</DemoTag>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Upload scene">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <p className="mt-2 text-[11px] text-muted">Region hint: {regionHint}</p>
          <textarea
            className="mt-3 w-full rounded-lg border border-line bg-shell p-2 text-sm"
            rows={3}
            placeholder="Optional: what should it look for (tank, paddy, cloud)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => void detect()} disabled={busy}>
              {busy ? "Detecting…" : "Run detection"}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/map")}>
              Back to live map
            </Button>
          </div>
          {fileName && <p className="mt-2 text-[11px] text-muted">{fileName}</p>}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </Panel>

        <Panel title="Result" action={result ? <StatusBadge value={result.provider === "GeminiVisionProvider" ? "Gemini" : "Demo"} /> : null}>
          {!result ? (
            <EmptyState title="No detection yet" body="Upload an image and run detection." />
          ) : (
            <div className="space-y-2 text-sm">
              <p>{result.summary}</p>
              <p>Land cover guess: {result.landCoverGuess}</p>
              <p>Water likely: {result.waterLikely ? "Yes" : "Unclear"}</p>
              <p>Cloud (RGB estimate): {result.cloudCoverPct}%</p>
              <p>Confidence: {result.confidence}%</p>
              <p className="text-muted">{result.rationale}</p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Scene + detections">
        {!dataUrl ? (
          <EmptyState title="No image" body="JPEG or PNG satellite/aerial RGB." />
        ) : (
          <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-line">
            <img src={dataUrl} alt="Uploaded satellite scene" className="block max-h-[70vh] max-w-full" />
            {result?.detections.map((d, i) => (
              <div
                key={`${d.label}-${i}`}
                className="pointer-events-none absolute rounded border-2"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.w}%`,
                  height: `${d.h}%`,
                  borderColor: CLASS_COLOR[d.className] ?? "#818cf8",
                }}
              >
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 text-[10px] font-semibold text-black"
                  style={{ background: CLASS_COLOR[d.className] ?? "#818cf8" }}
                >
                  {d.label} · {Math.round(d.confidence)}%
                </span>
              </div>
            ))}
          </div>
        )}
        {result && (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {result.detections.map((d, i) => (
              <li key={`${d.label}-row-${i}`} className="rounded-lg border border-line px-3 py-2 text-xs">
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: CLASS_COLOR[d.className] }} />
                {d.label} · {d.className} · {Math.round(d.confidence)}%
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
