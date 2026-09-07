import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoDataProvider } from "../services/demoDataProvider.js";
import type { ChartKind, LayerKey, Scope, VerifyStatus } from "../types.ts";
import type { VisionResult } from "../services/vision.ts";

const STORAGE_KEY = "geowise-demo-session-v1";

export type LayerState = Record<LayerKey, boolean> & { allData: boolean; satellite: boolean };

export type ObservationDraft = {
  id: string;
  fieldId: string | null;
  regionId: string;
  capturedAt: string;
  lat: number;
  lng: number;
  locationSource: string;
  waterBodyType: string;
  userNotes: string;
  vision?: VisionResult;
  imageName?: string;
};

type Toast = { id: string; title: string; body: string };

type Session = {
  scope: Scope;
  selectedFieldId: string;
  selectedDate: string;
  chartStart: string;
  chartEnd: string;
  chartKind: ChartKind;
  chartFullscreen: boolean;
  metricIndex: string;
  weatherKey: string;
  sidebarCollapsed: boolean;
  layers: LayerState;
  layerBackup: LayerState | null;
  verification: Record<string, VerifyStatus>;
  assignments: Record<string, string>;
  observations: ObservationDraft[];
  readNotifs: string[];
  extraCredits: { regionId: string; amount: number; reason: string; at: string }[];
  extraTriage: any[];
  extraVerification: any[];
  capturePickMode: boolean;
  capturePin: { lat: number; lng: number } | null;
  pendingSatelliteImage: string | null;
  toasts: Toast[];
};

const defaultLayers: LayerState = {
  allData: false,
  satellite: true,
  watershed: true,
  parcels: true,
  lulc: false,
  ndvi: false,
  ndwi: false,
  water: false,
  soil: false,
  ai: true,
  verification: false,
  jal: false,
};

const defaultSession: Session = {
  scope: "india",
  selectedFieldId: "FIELD-001",
  selectedDate: "2025-07-19",
  chartStart: "2025-07-16",
  chartEnd: "2025-07-24",
  chartKind: "line",
  chartFullscreen: false,
  metricIndex: "NDVI",
  weatherKey: "Moisture",
  sidebarCollapsed: false,
  layers: defaultLayers,
  layerBackup: null,
  verification: {},
  assignments: {},
  observations: [],
  readNotifs: [],
  extraCredits: [],
  extraTriage: [],
  extraVerification: [],
  capturePickMode: false,
  capturePin: null,
  pendingSatelliteImage: null,
  toasts: [],
};

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSession;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSession,
      ...parsed,
      extraTriage: parsed.extraTriage ?? [],
      extraVerification: parsed.extraVerification ?? [],
      layers: { ...defaultLayers, ...parsed.layers },
      toasts: [],
    };
  } catch {
    return defaultSession;
  }
}

type Store = Session & {
  provider: typeof demoDataProvider;
  fields: any[];
  selectedField: any;
  linked: any;
  kpis: any[];
  notifications: any[];
  triageQueue: any[];
  verificationOutcomes: { verified: number; pending: number; rejected: number; moreEvidence: number };
  setScope: (scope: Scope) => void;
  setField: (id: string) => void;
  setDate: (date: string) => void;
  setChartRange: (start: string, end: string) => void;
  setChartKind: (kind: ChartKind) => void;
  setChartFullscreen: (on: boolean) => void;
  setMetricIndex: (value: string) => void;
  setWeatherKey: (value: string) => void;
  toggleSidebar: () => void;
  toggleLayer: (key: keyof LayerState) => void;
  setLayer: (key: LayerKey | "satellite" | "soil", on: boolean) => void;
  enableAllData: () => void;
  setVerification: (verifyId: string, status: VerifyStatus) => void;
  assignCase: (caseId: string, who: string) => void;
  addObservation: (obs: ObservationDraft) => void;
  setCapturePickMode: (on: boolean) => void;
  setCapturePin: (pin: { lat: number; lng: number } | null) => void;
  setPendingSatelliteImage: (dataUrl: string | null) => void;
  markNotif: (id: string) => void;
  pushToast: (title: string, body: string) => void;
  dismissToast: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

function overlayLayersOn(): LayerState {
  return {
    allData: true,
    satellite: true,
    watershed: true,
    parcels: true,
    lulc: true,
    ndvi: true,
    ndwi: true,
    water: true,
    soil: true,
    ai: true,
    verification: true,
    jal: true,
  };
}

export function GeoWiseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() =>
    typeof window === "undefined" ? defaultSession : loadSession(),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, toasts: [] }));
  }, [session]);

  const regionId = session.scope === "india" || session.scope === "chittoor" ? undefined : session.scope;

  const fields = useMemo(() => {
    const all = demoDataProvider.getFields(regionId);
    if (session.scope === "chittoor") return all.filter((f: any) => f.signature);
    return all;
  }, [regionId, session.scope]);

  const selectedField =
    fields.find((f: any) => f.id === session.selectedFieldId) ??
    demoDataProvider.getField(session.selectedFieldId) ??
    fields[0];

  const linked = useMemo(() => {
    if (!selectedField) return null;
    const base = demoDataProvider.getLinkedRecord(selectedField.id);
    const extraV = session.extraVerification.find((v: any) => v.fieldId === selectedField.id);
    const extraC = session.extraTriage.find((c: any) => c.fieldId === selectedField.id);
    if (!extraV && !extraC) return base;
    return {
      ...(base ?? { field: selectedField }),
      case: extraC ?? base?.case,
      verification: extraV ?? base?.verification,
    };
  }, [selectedField, session.extraTriage, session.extraVerification]);

  const liveCases = useMemo(() => {
    const list = [
      ...demoDataProvider.getVerificationCases(regionId),
      ...session.extraVerification.filter((v: any) => !regionId || v.regionId === regionId),
    ];
    return list.map((v: any) => ({
      ...v,
      status: session.verification[v.id] ?? v.status,
    }));
  }, [regionId, session.extraVerification, session.verification]);

  const verificationOutcomes = useMemo(() => {
    const scopeList =
      session.scope === "chittoor" ? liveCases.filter((v: any) => v.regionId === "IN-AP") : liveCases;
    return {
      verified: scopeList.filter((v: any) => v.status === "Verified").length,
      pending: scopeList.filter((v: any) => v.status === "Pending").length,
      rejected: scopeList.filter((v: any) => v.status === "Rejected").length,
      moreEvidence: scopeList.filter((v: any) => v.status === "More evidence").length,
    };
  }, [liveCases, session.scope]);

  const kpis = useMemo(() => {
    const dash = demoDataProvider.getDashboard(session.scope === "chittoor" ? "chittoor" : "india");
    if (session.scope === "chittoor") {
      const sig = demoDataProvider.getFields().filter((f: any) => f.signature);
      let dV = 0;
      let dP = 0;
      sig.forEach((f: any) => {
        const rec = demoDataProvider.getLinkedRecord(f.id);
        const seed = rec?.verification?.status;
        const now = rec?.verification ? (session.verification[rec.verification.id] ?? seed) : seed;
        if (now === "Verified" && seed !== "Verified") dV += 1;
        if (seed === "Verified" && now !== "Verified") dV -= 1;
        const seedPending = seed === "Pending" || seed === "More evidence";
        const nowPending = now === "Pending" || now === "More evidence";
        if (nowPending && !seedPending) dP += 1;
        if (!nowPending && seedPending) dP -= 1;
      });
      return dash.kpis.map((k: any) => {
        if (k.id === "verifiedSubmissions") return { ...k, value: k.value + dV };
        if (k.id === "activeVerification") return { ...k, value: Math.max(0, k.value + dP) };
        if (k.id === "totalSubmissions") return { ...k, value: k.value + session.observations.length };
        return k;
      });
    }
    const verified = liveCases.filter((v: any) => v.status === "Verified").length;
    const pending = liveCases.filter((v: any) => v.status === "Pending" || v.status === "More evidence").length;
    return dash.kpis.map((k: any) => {
      if (k.id === "verifiedSubmissions") return { ...k, value: verified };
      if (k.id === "activeVerification") return { ...k, value: pending };
      if (k.id === "totalSubmissions") return { ...k, value: k.value + session.observations.length };
      return k;
    });
  }, [liveCases, session.observations.length, session.scope, session.verification]);

  const triageQueue = useMemo(() => {
    const base = demoDataProvider.getTriageCases(regionId);
    const extra = session.extraTriage.filter((c: any) => !regionId || c.regionId === regionId);
    const merged = [...extra, ...base];
    if (session.scope === "chittoor") return merged.filter((c: any) => c.regionId === "IN-AP");
    return merged;
  }, [regionId, session.extraTriage, session.scope]);

  const notifications = useMemo(() => {
    return demoDataProvider.getNotifications().map((n: any) => ({
      ...n,
      read: n.read || session.readNotifs.includes(n.id),
    }));
  }, [session.readNotifs]);

  const update = (patch: Partial<Session> | ((s: Session) => Session)) =>
    setSession((s) => (typeof patch === "function" ? patch(s) : { ...s, ...patch }));

  const setField = useCallback((id: string) => update({ selectedFieldId: id }), []);

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setSession((s) => {
      if (key === "allData") {
        if (s.layers.allData) {
          return {
            ...s,
            layers: s.layerBackup ?? { ...defaultLayers, satellite: s.layers.satellite },
            layerBackup: null,
          };
        }
        return {
          ...s,
          layerBackup: { ...s.layers },
          layers: { ...overlayLayersOn(), satellite: s.layers.satellite },
        };
      }
      return { ...s, layers: { ...s.layers, [key]: !s.layers[key], allData: false } };
    });
  }, []);

  const setLayer = useCallback((key: LayerKey | "satellite" | "soil", on: boolean) => {
    setSession((s) => ({ ...s, layers: { ...s.layers, [key]: on, allData: false } }));
  }, []);

  const enableAllData = useCallback(() => {
    setSession((s) => ({
      ...s,
      layerBackup: { ...s.layers },
      layers: { ...overlayLayersOn(), satellite: s.layers.satellite },
    }));
  }, []);

  const setVerification = useCallback((verifyId: string, status: VerifyStatus) => {
    setSession((s) => {
      const prev = s.verification[verifyId];
      const extra = [...s.extraCredits];
      const rec =
        demoDataProvider.getVerificationCases().find((v: any) => v.id === verifyId) ??
        s.extraVerification.find((v: any) => v.id === verifyId);
      if (status === "Verified" && prev !== "Verified") {
        extra.push({
          regionId: rec?.regionId ?? "IN-AP",
          amount: 100,
          reason: "Confirmed intervention",
          at: new Date().toISOString(),
        });
      }
      return {
        ...s,
        verification: { ...s.verification, [verifyId]: status },
        extraCredits: extra,
        toasts: [
          ...s.toasts,
          { id: `t-${Date.now()}`, title: "Verification updated", body: `Case set to ${status} (demo state).` },
        ],
      };
    });
  }, []);

  const addObservation = useCallback((obs: ObservationDraft) => {
    setSession((s) => {
      const n = Date.now();
      const caseId = `CASE-S-${n}`;
      const verifyId = `VERIFY-S-${n}`;
      return {
        ...s,
        observations: [obs, ...s.observations],
        extraTriage: [
          {
            id: caseId,
            fieldId: obs.fieldId,
            regionId: obs.regionId,
            priority: "Medium",
            title: (obs.userNotes || obs.waterBodyType).slice(0, 80),
            locationName: obs.waterBodyType,
            confidence: obs.vision?.confidence ?? 74,
            risk: "Medium",
            status: "Open",
            assignedTo: "Unassigned",
            provenance: "DEMO INTELLIGENCE",
          },
          ...s.extraTriage,
        ],
        extraVerification: [
          {
            id: verifyId,
            fieldId: obs.fieldId,
            regionId: obs.regionId,
            originalFinding: obs.userNotes || obs.waterBodyType,
            evidence: {
              satelliteLayer: obs.imageName ? `Session photo ${obs.imageName}` : "Community note",
              aiAnalysis: obs.vision?.scene ?? "Demo intake",
              location: `${obs.lat}, ${obs.lng}`,
            },
            verifierNotes: "Awaiting field visit.",
            status: "Pending",
            provenance: "DEMO INTELLIGENCE",
          },
          ...s.extraVerification,
        ],
        layers: { ...s.layers, jal: true },
        toasts: [
          ...s.toasts,
          {
            id: `t-${n}`,
            title: "Observation created",
            body: "Added to map (Jal layer), triage queue, and verification.",
          },
        ],
      };
    });
  }, []);

  const value: Store = {
    ...session,
    provider: demoDataProvider,
    fields,
    selectedField,
    linked,
    kpis,
    notifications,
    triageQueue,
    verificationOutcomes,
    setScope: (scope) => update({ scope }),
    setField,
    setDate: (selectedDate) => update({ selectedDate }),
    setChartRange: (chartStart, chartEnd) => update({ chartStart, chartEnd }),
    setChartKind: (chartKind) => update({ chartKind }),
    setChartFullscreen: (chartFullscreen) => update({ chartFullscreen }),
    setMetricIndex: (metricIndex) => update({ metricIndex }),
    setWeatherKey: (weatherKey) => update({ weatherKey }),
    toggleSidebar: () => update((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed })),
    toggleLayer,
    setLayer,
    enableAllData,
    setVerification,
    assignCase: (caseId, who) =>
      update((s) => ({
        ...s,
        assignments: { ...s.assignments, [caseId]: who },
        toasts: [...s.toasts, { id: `t-${Date.now()}`, title: "Case assigned", body: who }],
      })),
    addObservation,
    setCapturePickMode: (capturePickMode) => update({ capturePickMode }),
    setCapturePin: (capturePin) => update({ capturePin, capturePickMode: false }),
    setPendingSatelliteImage: (pendingSatelliteImage) => update({ pendingSatelliteImage }),
    markNotif: (id) => update((s) => ({ ...s, readNotifs: [...new Set([...s.readNotifs, id])] })),
    pushToast: (title, body) =>
      update((s) => ({ ...s, toasts: [...s.toasts, { id: `t-${Date.now()}`, title, body }] })),
    dismissToast: (id) => update((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGeoWise() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGeoWise outside provider");
  return ctx;
}
