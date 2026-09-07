import { useNavigate } from "react-router-dom";
import { Button, DemoTag, Panel } from "../components/ui.tsx";
import { GeoMap } from "../components/GeoMap.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";

export function GeoAIPage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const a = gw.linked?.analysis;
  const fusion = gw.provider.getFusion();
  if (!a) {
    return <p className="text-sm text-muted">Select a field on the map to load demo AI analysis.</p>;
  }
  const cards = [
    { k: "LULC classification", v: a.lulc, h: "Demo intelligence" },
    { k: "Vegetation", v: `NDVI ${a.vegetation.ndvi}`, h: "Demo satellite index" },
    { k: "Water", v: `NDWI ${a.water.ndwi}`, h: "Demo water index" },
    { k: "Change detection", v: a.changeDetected ? "Change detected" : "Stable", h: "Demo AI analysis" },
    { k: "Risk", v: a.risk, h: "Demo" },
    { k: "Confidence", v: `${a.confidence}%`, h: "Demo" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">AI geospatial analysis</p>
          <h1 className="text-xl font-semibold">{gw.selectedField.name}</h1>
        </div>
        <DemoTag>DEMO AI ANALYSIS</DemoTag>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <Panel key={c.k} title={c.k}>
            <p className="text-2xl font-semibold">{c.v}</p>
            <p className="text-[11px] text-muted">{c.h}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <GeoMap height="380px" />
        <Panel title="Unified data fusion engine">
          {fusion.sources.map((s: any) => (
            <div key={s.id} className="mb-3 rounded-lg border border-line p-3">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted">{s.description}</p>
              <p className="text-xs text-emerald">{s.status}</p>
            </div>
          ))}
          <p className="text-center text-xs text-muted">Drishti + Srishti + Historical records → Unified geospatial record</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => navigate("/xai")}>Why was this flagged?</Button>
            <Button variant="ghost" onClick={() => navigate("/triage")}>
              Send to triage
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function XaiPage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const x = gw.linked?.analysis?.xai;
  const rec = gw.linked?.recommendation;
  if (!x) return <p className="text-sm text-muted">Select a flagged field first.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Explainable AI</p>
        <h1 className="text-xl font-semibold">{x.headline}</h1>
        <DemoTag>DEMO XAI MAPS</DemoTag>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <GeoMap height="420px" />
        <Panel title="AI reasoning">
          <p className="text-sm text-slate-200">{x.summary}</p>
          <div className="mt-4 space-y-3">
            {x.factors.map((f: any) => (
              <div key={f.name}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span>{f.name}</span>
                  <span>{f.weight}%</span>
                </div>
                <div className="h-2 rounded bg-shell">
                  <div className="h-2 rounded bg-emerald" style={{ width: `${f.weight}%` }} />
                </div>
              </div>
            ))}
          </div>
          {rec && (
            <div className="mt-5 rounded-lg border border-line p-3">
              <p className="text-[10px] text-muted uppercase">Recommended intervention</p>
              <p className="text-lg font-semibold">{rec.recommended}</p>
              <p className="text-sm text-emerald">Suitability {rec.suitability}%</p>
              <ul className="mt-2 text-xs text-muted">
                <li>✓ High runoff potential</li>
                <li>✓ Suitable terrain</li>
                <li>✓ Similar historical intervention success</li>
              </ul>
            </div>
          )}
          <Button className="mt-4" onClick={() => navigate("/triage")}>
            Send to triage
          </Button>
        </Panel>
      </div>
    </div>
  );
}
