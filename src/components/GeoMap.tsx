import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Layers, LocateFixed, Maximize, Minimize, Ruler, RotateCcw } from "lucide-react";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { ndviColor, ndwiColor, ringToLatLngs, soilColor } from "../lib/utils.ts";
import { haversineKm } from "../lib/geo.ts";
import { Button, DemoTag, StatusBadge } from "./ui.tsx";
import { useNavigate } from "react-router-dom";
import type { LayerKey } from "../types.ts";

const OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SAT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const LAYER_PILLS: { key: LayerKey | "allData" | "satellite"; label: string }[] = [
  { key: "satellite", label: "Satellite" },
  { key: "allData", label: "All GeoWise Data" },
  { key: "watershed", label: "Watershed" },
  { key: "lulc", label: "LULC" },
  { key: "ndvi", label: "NDVI" },
  { key: "ndwi", label: "NDWI" },
  { key: "soil", label: "Soil" },
  { key: "water", label: "Water" },
  { key: "ai", label: "AI Flags" },
  { key: "verification", label: "Verification" },
  { key: "jal", label: "Jal Saheli" },
];

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 11), { duration: 0.7 });
  }, [lat, lng, map]);
  return null;
}

function MapApi({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export function GeoMap({ height = "520px", flyToSelected = true }: { height?: string; flyToSelected?: boolean }) {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [full, setFull] = useState(false);
  const [measure, setMeasure] = useState<{ a?: { lat: number; lng: number }; b?: { lat: number; lng: number } }>({});
  const [measuring, setMeasuring] = useState(false);
  const [layerDock, setLayerDock] = useState(false);
  const dateShift = (Number(gw.selectedDate.slice(-2)) - 19) * 0.012;

  const watersheds = gw.provider.getWatersheds(
    gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope,
  );
  const jal = gw.provider.getJalSaheli(gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope);
  const fields = gw.fields;

  const center = useMemo(() => {
    if (gw.scope === "chittoor") return { lat: 13.2172, lng: 79.1003, zoom: 13 };
    if (gw.scope === "india") return { lat: 22.35, lng: 78.67, zoom: 5 };
    const r = gw.provider.getRegions().find((x: any) => x.id === gw.scope);
    return { lat: r?.lat ?? 22.35, lng: r?.lng ?? 78.67, zoom: 8 };
  }, [gw.scope, gw.provider]);

  const visibleWatersheds =
    gw.scope === "chittoor" ? watersheds.filter((w: any) => w.id === "BASIN-PENNAR") : watersheds;

  const legend = gw.layers.lulc
    ? ["Agriculture", "Forest", "Waterbody", "Built-up", "Barren"]
    : gw.layers.ndvi
      ? ["NDVI low", "NDVI medium", "NDVI high"]
    : gw.layers.soil
      ? ["Soil moisture low", "Soil moisture medium", "Soil moisture high"]
      : ["Verified intervention", "Flagged zone", "Water body", "AI detection", "Jal Saheli", "Verification pending"];

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-xl border border-line bg-panel" style={{ height }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="glass pointer-events-auto rounded-lg px-3 py-2">
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Regional geospatial overview</p>
          <p className="text-xs text-white">Real basemap · demo intelligence overlays</p>
        </div>
        <DemoTag>DEMO INTELLIGENCE</DemoTag>
      </div>
      {gw.capturePickMode && (
        <div className="pointer-events-none absolute top-12 right-3 z-20 rounded-lg bg-amber px-3 py-1 text-[11px] font-semibold text-black">
          Click the map to set capture location
        </div>
      )}
      <div className="pointer-events-auto absolute top-14 left-3 z-20 flex max-w-[70%] flex-wrap gap-1">
        {LAYER_PILLS.map((p) => {
          const active = p.key === "satellite" ? gw.layers.satellite : Boolean(gw.layers[p.key]);
          return (
            <button
              key={p.key}
              onClick={() => (p.key === "allData" && !gw.layers.allData ? gw.enableAllData() : gw.toggleLayer(p.key))}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                active ? "border-emerald bg-emerald/20 text-emerald" : "border-line bg-shell/80 text-muted"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="absolute top-28 left-3 z-20 flex flex-col gap-1">
        <IconBtn label="Zoom in" onClick={() => map?.zoomIn()}>+</IconBtn>
        <IconBtn label="Zoom out" onClick={() => map?.zoomOut()}>−</IconBtn>
        <IconBtn
          label="Locate"
          onClick={() => {
            if (!map) return;
            map.once("locationerror", () =>
              gw.pushToast("Locate failed", "Allow location permission, or use HTTPS. Falling back to selected field."),
            );
            map.locate({ setView: true, maxZoom: 12 });
          }}
        >
          <LocateFixed size={14} />
        </IconBtn>
        <IconBtn label="Layers" onClick={() => setLayerDock((v) => !v)}>
          <Layers size={14} />
        </IconBtn>
        <IconBtn
          label="Measure"
          onClick={() => {
            setMeasuring((v) => !v);
            setMeasure({});
          }}
        >
          <Ruler size={14} />
        </IconBtn>
        <IconBtn
          label="Fullscreen"
          onClick={() => {
            if (!document.fullscreenElement) wrapRef.current?.requestFullscreen();
            else document.exitFullscreen();
            setFull((v) => !v);
          }}
        >
          {full ? <Minimize size={14} /> : <Maximize size={14} />}
        </IconBtn>
        <IconBtn label="Reset view" onClick={() => map?.setView([center.lat, center.lng], center.zoom)}>
          <RotateCcw size={14} />
        </IconBtn>
        <IconBtn
          label="Copy share link"
          onClick={() => {
            const url = `${window.location.origin}/map?field=${gw.selectedField?.id ?? ""}`;
            void navigator.clipboard.writeText(url);
            gw.pushToast("Share link copied", url);
          }}
        >
          ↗
        </IconBtn>
        <IconBtn
          label="Export selected field GeoJSON"
          onClick={() => {
            const f = gw.selectedField;
            if (!f) return;
            const blob = new Blob(
              [JSON.stringify({ type: "Feature", properties: { id: f.id, name: f.name, demo: true }, geometry: { type: "Polygon", coordinates: [f.polygon] } }, null, 2)],
              { type: "application/geo+json" },
            );
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${f.id}.geojson`;
            a.click();
          }}
        >
          ↓
        </IconBtn>
        <IconBtn
          label="Detect current map view (RGB snapshot)"
          onClick={() => {
            if (!map) return;
            const b = map.getBounds();
            const bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
            const url = `https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=1024,768&format=jpg&f=image`;
            fetch(url)
              .then((r) => r.blob())
              .then(
                (blob) =>
                  new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  }),
              )
              .then((dataUrl) => {
                gw.setPendingSatelliteImage(dataUrl);
                navigate("/satellite");
              })
              .catch(() => gw.pushToast("Snapshot failed", "Could not export the current view. Upload an image instead."));
          }}
        >
          ⌕
        </IconBtn>
      </div>
      {layerDock && (
        <div className="glass pointer-events-auto absolute top-28 left-14 z-20 w-44 rounded-lg p-2 text-[11px]">
          <p className="mb-1 font-semibold text-muted">LAYERS</p>
          {LAYER_PILLS.filter((p) => p.key !== "allData").map((p) => (
            <label key={p.key} className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={p.key === "satellite" ? gw.layers.satellite : Boolean(gw.layers[p.key])}
                onChange={() => gw.toggleLayer(p.key)}
              />
              {p.label}
            </label>
          ))}
        </div>
      )}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={center.zoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapApi onReady={setMap} />
        {flyToSelected && gw.selectedField && <FlyTo lat={gw.selectedField.lat} lng={gw.selectedField.lng} />}
        <TileLayer
          attribution={
            gw.layers.satellite
              ? "Tiles © Esri — real imagery basemap"
              : "&copy; OpenStreetMap contributors"
          }
          url={gw.layers.satellite ? SAT : OSM}
        />

        {gw.layers.watershed &&
          visibleWatersheds.map((w: any) => (
            <Polygon
              key={w.id}
              positions={ringToLatLngs(w.polygon)}
              pathOptions={{ color: "#22d3ee", weight: 1.5, fillOpacity: 0.06 }}
            >
              <Popup>
                <strong>{w.name}</strong>
                <div>Demo catchment overlay</div>
              </Popup>
            </Polygon>
          ))}

        {(gw.layers.parcels || gw.layers.lulc || gw.layers.ndvi || gw.layers.ndwi || gw.layers.water || gw.layers.soil) &&
          fields.map((f: any) => {
            const showWater = gw.layers.water && f.landUse === "Waterbody";
            if (
              gw.layers.water &&
              !gw.layers.parcels &&
              !gw.layers.lulc &&
              !gw.layers.ndvi &&
              !gw.layers.ndwi &&
              !gw.layers.soil &&
              !showWater
            )
              return null;
            if (
              gw.layers.water &&
              !showWater &&
              !(gw.layers.parcels || gw.layers.lulc || gw.layers.ndvi || gw.layers.ndwi || gw.layers.soil)
            )
              return null;
            let color = "#10b981";
            let fillOpacity = 0.18;
            if (gw.layers.lulc) color = f.color;
            if (gw.layers.ndvi) {
              color = ndviColor(f.ndvi + dateShift);
              fillOpacity = 0.45;
            }
            if (gw.layers.ndwi) {
              color = ndwiColor(f.ndwi + dateShift * 0.5);
              fillOpacity = 0.4;
            }
            if (gw.layers.soil) {
              color = soilColor(f.soilMoisture + dateShift * 40);
              fillOpacity = 0.4;
            }
            if (gw.selectedField?.id === f.id) {
              color = "#f59e0b";
              fillOpacity = 0.5;
            }
            return (
              <Polygon
                key={f.id}
                positions={ringToLatLngs(f.polygon)}
                pathOptions={{ color, weight: gw.selectedField?.id === f.id ? 2.5 : 1, fillOpacity }}
                eventHandlers={{
                  click: () => {
                    if (!measuring) gw.setField(f.id);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>
                      {f.name} ({f.localId})
                    </strong>
                    <div>{f.crop}</div>
                    <div>Area {f.areaSqm} m²</div>
                    <div>
                      {f.lat}, {f.lng}
                    </div>
                    <div className="mt-1 text-[10px] uppercase">Demo parcel</div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {gw.layers.ai &&
          fields
            .filter((f: any) => f.risk !== "Low")
            .map((f: any) => (
              <CircleMarker
                key={`ai-${f.id}`}
                center={[f.lat, f.lng]}
                radius={f.risk === "High" ? 8 : 6}
                pathOptions={{
                  color: f.risk === "High" ? "#ef4444" : "#f59e0b",
                  fillOpacity: 0.9,
                }}
                eventHandlers={{ click: () => gw.setField(f.id) }}
              />
            ))}

        {gw.layers.verification &&
          fields.map((f: any) => {
            const v = gw.linked && f.id === gw.selectedField?.id ? gw.linked.verification : gw.provider.getLinkedRecord(f.id)?.verification;
            const status = gw.verification[v?.id] ?? v?.status;
            const color = status === "Verified" ? "#10b981" : status === "Rejected" ? "#ef4444" : "#f59e0b";
            return (
              <CircleMarker
                key={`v-${f.id}`}
                center={[f.lat + 0.01, f.lng + 0.01]}
                radius={5}
                pathOptions={{ color, fillOpacity: 0.85 }}
                eventHandlers={{ click: () => gw.setField(f.id) }}
              />
            );
          })}

        {gw.layers.jal &&
          gw.observations.map((o) => (
            <CircleMarker
              key={o.id}
              center={[o.lat, o.lng]}
              radius={7}
              pathOptions={{ color: "#f472b6", fillOpacity: 1 }}
              eventHandlers={{
                click: () => {
                  if (o.fieldId) gw.setField(o.fieldId);
                },
              }}
            >
              <Popup>
                Session capture
                <br />
                {o.waterBodyType}
                <br />
                {o.userNotes}
              </Popup>
            </CircleMarker>
          ))}

        {gw.layers.jal &&
          jal.map((j: any) => (
            <CircleMarker
              key={j.id}
              center={[j.lat, j.lng]}
              radius={5}
              pathOptions={{ color: "#a855f7", fillOpacity: 0.9 }}
              eventHandlers={{
                click: () => {
                  if (j.fieldId) gw.setField(j.fieldId);
                },
              }}
            >
              <Popup>
                {j.village}
                <br />
                {j.message}
              </Popup>
            </CircleMarker>
          ))}

        {measuring && (
          <MapClickMeasure measure={measure} setMeasure={setMeasure} />
        )}
        {gw.capturePickMode && <MapClickPick onPick={(lat, lng) => gw.setCapturePin({ lat, lng })} />}
      </MapContainer>

      {measuring && (
        <div className="absolute top-14 right-3 z-20 rounded-lg bg-shell/90 px-3 py-2 text-[11px]">
          {measure.a && measure.b
            ? `${haversineKm(measure.a, measure.b).toFixed(2)} km (demo measure)`
            : "Click two points on the map"}
        </div>
      )}

      <div className="glass absolute bottom-3 left-3 z-20 rounded-lg px-3 py-2 text-[10px]">
        <p className="mb-1 font-semibold tracking-wider text-muted">LEGEND</p>
        {legend.map((l) => (
          <div key={l} className="text-slate-300">
            ● {l}
          </div>
        ))}
      </div>
      <div className="glass absolute right-3 bottom-3 z-20 rounded-lg px-3 py-2 text-[10px] text-muted">
        Cloud cover 9.2% (demo) · scale contextual
      </div>

      {gw.selectedField && (
        <aside className="glass absolute right-3 bottom-16 z-20 w-[min(18rem,calc(100%-1.5rem))] rounded-xl p-3 md:top-24 md:bottom-auto">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Field insights</p>
            <StatusBadge value={gw.selectedField.status} />
          </div>
          <p className="mt-1 text-sm font-semibold">{gw.selectedField.name}</p>
          <p className="text-[11px] text-muted">
            {gw.selectedField.landUse} · {gw.selectedField.areaSqm} m²
          </p>
          <p className="text-[11px] text-muted">
            {gw.selectedField.lat}, {gw.selectedField.lng}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <Metric label="NDVI" value={gw.selectedField.ndvi} hint="Demo satellite index" />
            <Metric label="NDWI" value={gw.selectedField.ndwi} hint="Demo water index" />
            <Metric label="Soil moisture" value={`${gw.selectedField.soilMoisture}%`} hint="Demo" />
            <Metric label="Temp" value={`${gw.selectedField.temperatureC}°C`} hint="Demo" />
          </div>
          <Button className="mt-3 w-full" onClick={() => navigate("/geo-ai")}>
            View detailed analysis →
          </Button>
        </aside>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-lg border border-line bg-shell/60 p-2">
      <p className="text-[9px] text-muted uppercase">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[9px] text-muted">{hint}</p>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-shell/90 text-sm text-white"
    >
      {children}
    </button>
  );
}

function MapClickMeasure({
  measure,
  setMeasure,
}: {
  measure: { a?: { lat: number; lng: number }; b?: { lat: number; lng: number } };
  setMeasure: (v: { a?: { lat: number; lng: number }; b?: { lat: number; lng: number } }) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      const pt = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (!measure.a) setMeasure({ a: pt });
      else setMeasure({ a: measure.a, b: pt });
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, measure, setMeasure]);
  return null;
}

function MapClickPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    map.getContainer().style.cursor = "crosshair";
    return () => {
      map.off("click", handler);
      map.getContainer().style.cursor = "";
    };
  }, [map, onPick]);
  return null;
}
