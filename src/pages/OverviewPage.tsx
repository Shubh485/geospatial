import { useNavigate } from "react-router-dom";
import { GeoMap } from "../components/GeoMap.tsx";
import { InnovationFlow } from "../components/InnovationFlow.tsx";
import { KpiRow } from "../components/KpiRow.tsx";
import { MetricsChart, VizControls } from "../components/MetricsChart.tsx";
import { DemoTag, Panel, StatusBadge } from "../components/ui.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";

export function OverviewPage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const weather = gw.provider.getWeather(gw.scope === "chittoor" ? "IN" : gw.scope === "india" ? "IN" : gw.scope);
  const detections = gw.provider
    .getTriageCases(gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope)
    .slice(0, 4);
  const fusion = gw.provider.getFusion();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald uppercase">GeoWise command center</p>
          <h1 className="text-2xl font-semibold">Regional watershed intelligence</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The map is real geographic context. Colored overlays, cases, and metrics are GeoWise demonstration
            intelligence — not live government or satellite products.
          </p>
        </div>
        <DemoTag>DEMO ENVIRONMENT</DemoTag>
      </div>
      <KpiRow />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.85fr)]">
        <GeoMap height="560px" flyToSelected={gw.scope !== "india"} />
        <div className="space-y-4">
          <Panel title="Priority cases" eyebrow="Intelligence">
            <div className="space-y-2">
              {detections.map((c: any) => (
                <button
                  key={c.id}
                  className="w-full rounded-lg border border-line px-3 py-2 text-left hover:border-emerald"
                  onClick={() => {
                    gw.setField(c.fieldId);
                    navigate("/triage");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{c.locationName}</p>
                    <StatusBadge value={c.priority} />
                  </div>
                  <p className="text-[11px] text-muted">{c.title}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Weather summary" eyebrow="Last 7 days" action={<DemoTag>DEMO WEATHER</DemoTag>}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className={gw.weatherKey === "Temperature" ? "text-emerald" : ""}>Temp {weather.temperatureC}°C</p>
              <p className={gw.weatherKey === "Rainfall" ? "text-emerald" : ""}>Rain {weather.rainfallMm} mm</p>
              <p>Humidity {weather.humidityPct}%</p>
              <p className={gw.weatherKey === "Moisture" ? "text-emerald" : ""}>
                Moisture (demo) {gw.selectedField?.soilMoisture ?? "—"}%
              </p>
            </div>
          </Panel>
          <Panel title={fusion.title} eyebrow="Data fusion">
            {fusion.sources.map((s: any) => (
              <p key={s.id} className="text-[12px]">
                {s.name} · <span className="text-emerald">{s.status}</span>
              </p>
            ))}
          </Panel>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <VizControls />
        <MetricsChart />
      </div>
      <InnovationFlow />
    </div>
  );
}
