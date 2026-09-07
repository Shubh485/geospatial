export type Risk = "Low" | "Medium" | "High";
export type VerifyStatus = "Pending" | "Verified" | "Rejected" | "More evidence";

export type LayerKey =
  | "watershed"
  | "parcels"
  | "lulc"
  | "ndvi"
  | "ndwi"
  | "water"
  | "ai"
  | "verification"
  | "jal";

export type ChartKind = "line" | "area";

export type Scope = "india" | "chittoor" | (string & {});
