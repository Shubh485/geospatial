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
import { Maximize2, X } from "lucide-react";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { Button, DemoTag, Panel } from "./ui.tsx";

export function MetricsChart() {
  const gw = useGeoWise();
  const timeline = gw.provider.getTimeline();
  const series = timeline.seriesByField[gw.selectedField?.id] ?? [];
  const data = useMemo(() => {
    const shift = (Number(gw.selectedDate.slice(-2)) - 19) * 0.008;
    return series
      .filter((d: any) => d.date >= gw.chartStart && d.date <= gw.chartEnd)
      .map((d: any) => ({
        date: d.date.slice(5),
        raw: d.date,
        NDVI: Number((d.ndvi + shift).toFixed(3)),
        "Soil Moisture": d.soilMoisture + Math.round(shift * 40),
        Temperature: d.temperatureC,
        Precipitation: d.precipitationMm,
        NDWI: Number((d.ndwi + shift * 0.4).toFixed(3)),
      }));
  }, [series, gw.chartStart, gw.chartEnd, gw.selectedDate]);

  const Chart = gw.chartKind === "area" ? AreaChart : LineChart;
  const keys =
    gw.weatherKey === "Temperature"
      ? (["NDVI", "Temperature"] as const)
      : gw.weatherKey === "Rainfall"
        ? (["NDVI", "Precipitation"] as const)
        : (["NDVI", "Soil Moisture"] as const);
  const colors = ["#10b981", "#0ea5e9", "#f59e0b", "#a855f7"];

  const chartBody = (
    <>
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
      <p className="mb-2 text-[10px] text-muted">
        Demo observation timeline — selected date shifts overlay/chart values. Not real acquisition dates.
      </p>
      <div className={gw.chartFullscreen ? "h-[70vh]" : "h-56"}>
        {data.length === 0 ? (
          <p className="text-xs text-muted">No series in this date range.</p>
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
    </>
  );

  return (
    <>
      <Panel
        eyebrow="Field metrics over time"
        title={gw.selectedField?.name ?? "Select a field"}
        action={
          <div className="flex gap-2">
            <DemoTag>DEMO SERIES</DemoTag>
            <Button variant="ghost" onClick={() => gw.setChartKind(gw.chartKind === "line" ? "area" : "line")}>
              {gw.chartKind === "line" ? "Area" : "Line"}
            </Button>
            <Button variant="ghost" onClick={() => gw.setChartFullscreen(true)}>
              <Maximize2 size={14} /> Fullscreen
            </Button>
          </div>
        }
      >
        {chartBody}
      </Panel>
      {gw.chartFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative h-full w-full max-w-6xl rounded-xl border border-line bg-panel p-4">
            <button className="absolute top-3 right-3" onClick={() => gw.setChartFullscreen(false)} aria-label="Close">
              <X size={18} />
            </button>
            {chartBody}
          </div>
        </div>
      )}
    </>
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
          const value = e.target.value;
          gw.setMetricIndex(value);
          gw.setLayer("ndvi", value === "NDVI");
          gw.setLayer("ndwi", value === "NDWI");
          gw.setLayer("lulc", value === "LULC");
          gw.setLayer("soil", value === "Soil Moisture");
        }}
      >
        {["NDVI", "NDWI", "Soil Moisture", "LULC"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <label className="block text-[11px] text-muted">Start</label>
      <input
        type="date"
        className="mt-1 mb-2 w-full rounded-lg border border-line bg-shell px-2 py-2 text-sm"
        value={gw.chartStart}
        onChange={(e) => gw.setChartRange(e.target.value, gw.chartEnd)}
      />
      <label className="block text-[11px] text-muted">End</label>
      <input
        type="date"
        className="mt-1 mb-3 w-full rounded-lg border border-line bg-shell px-2 py-2 text-sm"
        value={gw.chartEnd}
        onChange={(e) => gw.setChartRange(gw.chartStart, e.target.value)}
      />
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
      <p className="mt-3 text-[11px] text-muted">Index, dates, and weather update the demo map/chart.</p>
    </Panel>
  );
}
