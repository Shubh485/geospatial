import { GeoMap } from "../components/GeoMap.tsx";
import { DemoTag } from "../components/ui.tsx";

export function LiveMapPage() {
  return (
    <div className="flex h-full min-h-[640px] flex-col gap-3">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Live map</p>
        <h1 className="text-xl font-semibold">Real geography + demo GeoWise layer</h1>
        <p className="text-sm text-muted">
          OSM or Esri imagery is the basemap. Use All GeoWise Data to paint watersheds, parcels, indices, flags, and
          community observations.
        </p>
      </div>
      <DemoTag>DEMO INTELLIGENCE ON REAL TILES</DemoTag>
      <div className="min-h-[70vh]">
        <GeoMap height="70vh" />
      </div>
    </div>
  );
}
