import { useEffect, useState } from "react";
import { WATER_BODY_TYPES } from "../data/demo/constants.js";
import { Button, DemoTag, Panel } from "../components/ui.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { analyzeWatershedImage } from "../services/vision.ts";
import { useNavigate } from "react-router-dom";

export function CapturePage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [type, setType] = useState(WATER_BODY_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState<number | null>(gw.selectedField?.lat ?? null);
  const [lng, setLng] = useState<number | null>(gw.selectedField?.lng ?? null);
  const [locSource, setLocSource] = useState("Not captured");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gemini = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  useEffect(() => {
    if (gw.capturePin) {
      setLat(gw.capturePin.lat);
      setLng(gw.capturePin.lng);
      setLocSource("Map click");
    }
  }, [gw.capturePin]);

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocSource("Geolocation unavailable — using map pin / field");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocSource("Browser geolocation");
      },
      () => {
        setLat(gw.selectedField?.lat ?? 13.2172);
        setLng(gw.selectedField?.lng ?? 79.1003);
        setLocSource("Fallback to selected field / Chittoor (demo)");
      },
    );
  }

  async function onFile(file: File) {
    setFileName(file.name);
    try {
      const exifr = await import("exifr");
      const gps = await exifr.gps(file);
      if (gps?.latitude && gps?.longitude) {
        setLat(gps.latitude);
        setLng(gps.longitude);
        setLocSource("Photo EXIF GPS");
      }
    } catch {
      /* no EXIF */
    }
    const reader = new FileReader();
    reader.onload = () => setDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!dataUrl || lat == null || lng == null) {
      setError("Add a photo and a location first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const vision = await analyzeWatershedImage({ dataUrl, waterBodyType: type, notes });
      gw.addObservation({
        id: `OBS-LIVE-${Date.now()}`,
        fieldId: gw.selectedField?.id ?? null,
        regionId: gw.selectedField?.regionId ?? "IN-AP",
        capturedAt: new Date().toISOString(),
        lat,
        lng,
        locationSource: locSource,
        waterBodyType: type,
        userNotes: notes,
        vision,
        imageName: fileName,
      });
      navigate("/geo-ai");
    } catch {
      setError("Analysis failed. Demo vision should still work — retry.");
    } finally {
      setBusy(false);
    }
  }

  const last = gw.observations[0];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Drishti · field capture</p>
        <h1 className="text-xl font-semibold">Upload a watershed photo</h1>
        <p className="text-sm text-muted">
          You label the water-body type. Location comes from the device (or the selected field). Vision is Gemini when a
          key is set, otherwise a labeled demo analyzer.
        </p>
        <DemoTag>{gemini ? "VISION: GEMINI (demo environment)" : "VISION: DEMO PROVIDER"}</DemoTag>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Capture">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          {dataUrl && <img src={dataUrl} alt="Upload preview" className="mt-3 max-h-48 rounded-lg border border-line" />}
          <label className="mt-3 block text-[11px] text-muted">Water-body type (you specify)</label>
          <select className="mt-1 w-full rounded-lg border border-line bg-shell px-2 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            {WATER_BODY_TYPES.map((t: string) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <textarea
            className="mt-3 w-full rounded-lg border border-line bg-shell p-2 text-sm"
            rows={3}
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={captureLocation}>
              Capture my location
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                gw.setCapturePickMode(true);
                navigate("/map");
                gw.pushToast("Pick on map", "Click the basemap, then return here. Location will fill in.");
              }}
            >
              Pick on map
            </Button>
            <Button onClick={() => void analyze()} disabled={busy}>
              {busy ? "Analyzing…" : "Analyze image"}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Location: {lat?.toFixed(4) ?? "—"}, {lng?.toFixed(4) ?? "—"} · {locSource}
          </p>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </Panel>
        <Panel title="Image intelligence">
          {!last ? (
            <p className="text-sm text-muted">No capture in this session yet.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>Type: {last.waterBodyType}</p>
              {last.vision ? (
                <>
                  <p>Provider: {last.vision.provider}</p>
                  <p>Scene: {last.vision.scene}</p>
                  <p>Water present: {last.vision.waterPresence ? "Yes" : "No"}</p>
                  <p>Structure: {last.vision.structureCondition}</p>
                  <p>Vegetation edge: {last.vision.vegetationEdge}</p>
                  <p>Agrees with your label: {last.vision.agreesWithUserLabel ? "Yes" : "Mismatch"}</p>
                  <p>Confidence: {last.vision.confidence}%</p>
                  <p>Image-based water index: {last.vision.qualitativeWaterIndex} (not satellite NDWI)</p>
                  <p className="text-muted">{last.vision.rationale}</p>
                </>
              ) : (
                <p>{last.userNotes}</p>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
