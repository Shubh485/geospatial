import { Activity, AlertTriangle, Layers, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { formatNumber } from "../lib/utils.ts";

const icons = [Upload, ShieldCheck, AlertTriangle, Activity, Layers, Sparkles];

export function KpiRow() {
  const { kpis } = useGeoWise();
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
      {kpis.map((k: any, i: number) => {
        const Icon = icons[i % icons.length];
        const up = k.trendPct >= 0;
        return (
          <article key={k.id} className="rounded-xl border border-line bg-panel p-3">
            <div className="flex items-center justify-between text-muted">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase">{k.label}</p>
              <Icon size={14} className="text-emerald" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(k.value)}</p>
            <p className={`text-[11px] ${up ? "text-emerald" : "text-danger"}`}>
              {up ? "↑" : "↓"} {Math.abs(k.trendPct)}%
            </p>
            <p className="text-[11px] text-muted">{k.description}</p>
          </article>
        );
      })}
    </div>
  );
}
