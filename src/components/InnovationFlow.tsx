import { useNavigate } from "react-router-dom";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";

export function InnovationFlow() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const steps = gw.provider.getInnovationFlow();
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Observe → fuse → analyze → explain → triage → verify → recommend → learn</p>
          <h2 className="text-sm font-semibold">GeoWise innovation flow</h2>
        </div>
        <span className="text-[10px] text-muted">Click a node</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((s: any, i: number) => (
          <button
            key={s.id}
            onClick={() => navigate(s.route)}
            className="min-w-[150px] flex-1 rounded-lg border border-line bg-shell px-3 py-3 text-left hover:border-emerald"
          >
            <p className="text-[10px] text-emerald">0{s.step}</p>
            <p className="text-xs font-medium">{s.title}</p>
            {i < steps.length - 1 && <p className="mt-2 text-[10px] text-muted">→ next</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
