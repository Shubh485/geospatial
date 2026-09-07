import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { DemoTag, Panel } from "../components/ui.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";

export function AnalyticsPage() {
  const gw = useGeoWise();
  const [range, setRange] = useState<"7D" | "30D" | "90D" | "1Y">("90D");
  const a = gw.provider.getAnalytics();
  const slice = a.byRange[range];
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Analytics</p>
          <h1 className="text-xl font-semibold">National demo intelligence</h1>
        </div>
        <div className="flex gap-1">
          {(["7D", "30D", "90D", "1Y"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full border px-3 py-1 text-xs ${range === r ? "border-emerald text-emerald" : "border-line text-muted"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <DemoTag>DETERMINISTIC DEMO ANALYTICS</DemoTag>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="LULC distribution">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={a.lulcDistribution} dataKey="pct" nameKey="name" innerRadius={50} outerRadius={80}>
                  {a.lulcDistribution.map((d: any) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Verification outcomes">
          {Object.entries(slice.verificationOutcomes).map(([k, v]) => (
            <p key={k} className="text-sm">
              {k}: {String(v)}
            </p>
          ))}
          <p className="mt-3 text-sm">Intervention success (demo) {slice.interventionSuccess}%</p>
          <p className="text-sm">Jal Saheli participation {slice.jalSaheliParticipation}</p>
        </Panel>
      </div>
      <Panel title="By state / UT">
        <div className="grid gap-2 md:grid-cols-3">
          {a.byRegion.map((r: any) => (
            <button key={r.regionId} className="rounded-lg border border-line px-3 py-2 text-left" onClick={() => gw.setScope(r.regionId)}>
              <p className="text-xs font-medium">{r.name}</p>
              <p className="text-[11px] text-muted">
                {r.fields} parcels · {r.highRisk} high risk · NDVI {r.meanNdvi}
              </p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function ReportsPage() {
  const gw = useGeoWise();
  const [ready, setReady] = useState(false);
  const field = gw.selectedField;
  const report = useMemo(
    () => ({
      exec: `Demo executive summary for ${field?.name ?? "the selected parcel"} in the GeoWise demonstration environment.`,
      lulc: field?.landUse,
      veg: field?.ndvi,
      water: field?.ndwi,
      ai: field?.finding,
      xai: gw.linked?.analysis?.xai?.summary,
      verify: gw.linked?.verification?.status,
      rec: gw.linked?.recommendation?.recommended,
    }),
    [field, gw.linked],
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Reports</h1>
        <button
          className="rounded-lg bg-emerald px-3 py-2 text-xs font-semibold text-black"
          onClick={() => {
            setReady(true);
            gw.pushToast("Demo report generated", "This is a prototype document, not an official briefing.");
          }}
        >
          Generate demo report
        </button>
      </div>
      {!ready ? (
        <p className="text-sm text-muted">Generate a demo report for the selected field.</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-line bg-panel p-5 text-sm">
          <h2 className="font-semibold">Executive summary</h2>
          <p>{report.exec}</p>
          <h2 className="font-semibold">Watershed overview</h2>
          <p>Chittoor / national demo overlays on a real geographic basemap.</p>
          <h2 className="font-semibold">LULC</h2>
          <p>{report.lulc}</p>
          <h2 className="font-semibold">Vegetation / water</h2>
          <p>
            NDVI {report.veg} · NDWI {report.water}
          </p>
          <h2 className="font-semibold">AI findings / XAI</h2>
          <p>{report.ai}</p>
          <p>{report.xai}</p>
          <h2 className="font-semibold">Verification / recommendation / community</h2>
          <p>
            {report.verify} · {report.rec}
          </p>
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const gw = useGeoWise();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Panel title="Environment">
        <p className="text-sm">Mode: DEMO ENVIRONMENT</p>
        <p className="text-sm">
          Vision: {import.meta.env.VITE_GEMINI_API_KEY ? "Gemini (optional) — field photos + satellite RGB detect" : "DemoVisionProvider"}
        </p>
        <p className="text-sm">Basemap: {gw.layers.satellite ? "Esri World Imagery" : "OpenStreetMap"}</p>
        <p className="mt-3 text-xs text-muted">
          Session is stored in localStorage. Clearing site data resets verification and captures.
        </p>
        <button
          className="mt-3 rounded-lg border border-line px-3 py-2 text-xs"
          onClick={() => {
            localStorage.removeItem("geowise-demo-session-v1");
            window.location.reload();
          }}
        >
          Reset demo session
        </button>
      </Panel>
    </div>
  );
}
