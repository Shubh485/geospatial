import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { Button, DemoTag, Panel } from "./ui.tsx";

export function MetricsChart() {
  const gw = useGeoWise();
  const timeline = gw.provider.getTimeline();
  const series = timeline.seriesByField[gw.selectedField?.id] ?? [];
  const data = useMemo(
    () =>
      series.map((d: any) => ({
        date: d.date.slice(5),
        NDVI: d.ndvi,
        "Soil Moisture": d.soilMoisture,
        Temperature: d.temperatureC,
        Precipitation: d.precipitationMm,
        NDWI: d.ndwi,
      })),
    [series],
  );

  const Chart = gw.chartKind === "area" ? AreaChart : LineChart;
  const keys = ["NDVI", "Soil Moisture", "Temperature", "Precipitation"] as const;
  const colors = ["#10b981", "#0ea5e9", "#f59e0b", "#a855f7"];

  return (
    <Panel
      eyebrow="Field metrics over time"
      title={gw.selectedField?.name ?? "Select a field"}
      action={
        <div className="flex gap-2">
          <DemoTag>DEMO SERIES</DemoTag>
          <Button variant="ghost" onClick={() => gw.setChartKind(gw.chartKind === "line" ? "area" : "line")}>
            {gw.chartKind === "line" ? "Area" : "Line"}
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        {timeline.dates.map((d: any) => (
          <button
            key={d.date}
            onClick={() => gw.setDate(d.date)}
            className={`rounded-full border px-2 py-1 ${
              gw.selectedDate === d.date ? "border-emerald bg-emerald/20 text-emerald" : "border-line text-muted"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-[10px] text-muted">Demo observation timeline — not satellite acquisition dates.</p>
      <div className="h-56">
        {data.length === 0 ? (
          <p className="text-xs text-muted">No series for this field.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={data}>
              <CartesianGrid stroke="#1f2a36" />
              <XAxis dataKey="date" stroke="#8b9aab" fontSize={11} />
              <YAxis stroke="#8b9aab" fontSize={11} />
              <Tooltip contentStyle={{ background: "#121b26", border: "1px solid #1f2a36" }} />
              <Legend />
              {keys.map((k, i) =>
                gw.chartKind === "area" ? (
                  <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} />
                ) : (
                  <Line key={k} type="monotone" dataKey={k} stroke={colors[i]} dot={false} strokeWidth={2} />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}

export function VizControls() {
  const gw = useGeoWise();
  return (
    <Panel title="Data & visualization" eyebrow="Controls">
      <label className="block text-[11px] text-muted">Index</label>
      <select
        className="mt-1 mb-3 w-full rounded-lg border border-line bg-shell px-2 py-2 text-sm"
        value={gw.metricIndex}
        onChange={(e) => {
          gw.setMetricIndex(e.target.value);
          const map: Record<string, "ndvi" | "ndwi" | "lulc"> = { NDVI: "ndvi", NDWI: "ndwi", LULC: "lulc" };
          const layer = map[e.target.value];
          if (layer) gw.toggleLayer(layer);
        }}
      >
        {["NDVI", "NDWI", "Soil Moisture", "LULC"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <label className="block text-[11px] text-muted">Weather data</label>
      <select
        className="mt-1 w-full rounded-lg border border-line bg-shell px-2 py-2 text-sm"
        value={gw.weatherKey}
        onChange={(e) => gw.setWeatherKey(e.target.value)}
      >
        {["Moisture", "Temperature", "Rainfall"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <p className="mt-3 text-[11px] text-muted">Controls update the demo visualization only.</p>
    </Panel>
  );
}
