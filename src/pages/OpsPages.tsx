import { GeoMap } from "../components/GeoMap.tsx";
import { Button, DemoTag, Panel, StatusBadge } from "../components/ui.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { useNavigate } from "react-router-dom";

export function TriagePage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const cases = gw.provider.getTriageCases(gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope);
  const filtered = gw.scope === "chittoor" ? cases.filter((c: any) => c.regionId === "IN-AP") : cases;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Autonomous triage agent</p>
        <h1 className="text-xl font-semibold">Prioritize low-confidence and high-risk zones</h1>
        <p className="text-sm text-muted">
          Scans AI output for low-confidence or high-risk zones and queues field verification. Demo simulation only.
        </p>
        <DemoTag>DEMO AUTONOMOUS TRIAGE SIMULATION</DemoTag>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3 text-xs">
        <span>AI output</span><span className="text-muted">→</span>
        <span>Low confidence / high risk</span><span className="text-muted">→</span>
        <span>Triage</span><span className="text-muted">→</span>
        <span>Field verification</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <Panel title="Queue">
          <div className="max-h-[520px] space-y-2 overflow-auto">
            {filtered.map((c: any) => (
              <div
                key={c.id}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  gw.selectedField?.id === c.fieldId ? "border-emerald bg-emerald/10" : "border-line"
                }`}
              >
                <button type="button" className="w-full text-left" onClick={() => gw.setField(c.fieldId)}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{c.title}</p>
                    <StatusBadge value={c.priority} />
                  </div>
                  <p className="text-[11px] text-muted">
                    {c.locationName} · confidence {c.confidence}% · {gw.assignments[c.id] ?? c.assignedTo}
                  </p>
                </button>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" onClick={() => { gw.setField(c.fieldId); navigate("/geo-ai"); }}>
                    Review
                  </Button>
                  <Button variant="ghost" onClick={() => gw.assignCase(c.id, "Field Officer — demo cell")}>
                    Assign
                  </Button>
                  <Button onClick={() => { gw.setField(c.fieldId); navigate("/verification"); }}>Verify</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <GeoMap height="560px" />
      </div>
    </div>
  );
}

export function VerificationPage() {
  const gw = useGeoWise();
  const v = gw.linked?.verification;
  if (!v) return <p className="text-sm text-muted">Select a case to verify.</p>;
  const status = gw.verification[v.id] ?? v.status;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Field verification</p>
        <h1 className="text-xl font-semibold">{gw.selectedField.name}</h1>
        <DemoTag>DEMO VERIFICATION WORKSPACE</DemoTag>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Case file">
          <p className="text-xs text-muted">Original AI finding</p>
          <p className="text-sm">{v.originalFinding}</p>
          <p className="mt-3 text-xs text-muted">Evidence</p>
          <p className="text-sm">{v.evidence.satelliteLayer}</p>
          <p className="text-sm">{v.evidence.aiAnalysis}</p>
          <p className="text-sm">{v.evidence.location}</p>
          <p className="mt-3 text-xs text-muted">Verifier notes</p>
          <p className="text-sm">{v.verifierNotes}</p>
          <p className="mt-3 text-xs">
            Status <StatusBadge value={status} />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => gw.setVerification(v.id, "Verified")}>Confirm</Button>
            <Button variant="danger" onClick={() => gw.setVerification(v.id, "Rejected")}>
              Reject
            </Button>
            <Button variant="amber" onClick={() => gw.setVerification(v.id, "More evidence")}>
              Request more evidence
            </Button>
          </div>
        </Panel>
        <GeoMap height="420px" />
      </div>
    </div>
  );
}

export function RecommendationsPage() {
  const gw = useGeoWise();
  const rec = gw.linked?.recommendation;
  const all = gw.provider.getRecommendations(gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Predictive recommendation</p>
        <h1 className="text-xl font-semibold">Decision support</h1>
        <DemoTag>DEMO RECOMMENDATIONS</DemoTag>
      </div>
      {rec ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={rec.recommended}>
            <p className="text-3xl font-semibold text-emerald">{rec.suitability}%</p>
            <p className="text-xs text-muted">Suitability (demo)</p>
            {Object.entries(rec.factors).map(([k, val]) => (
              <p key={k} className="mt-2 text-sm">
                {k} · {String(val)}%
              </p>
            ))}
            <p className="mt-4 text-[10px] text-muted uppercase">Lifecycle</p>
            <p className="text-xs">
              {rec.lifecycle.observation} → {rec.lifecycle.aiAnalysis} → {rec.lifecycle.risk} → {rec.lifecycle.recommendation} →{" "}
              {gw.verification[rec.verifyId] ?? rec.lifecycle.verification} → {rec.lifecycle.outcome}
            </p>
          </Panel>
          <Panel title="Alternatives">
            {rec.alternatives.map((a: any) => (
              <p key={a.name} className="mb-2 text-sm">
                {a.name} · {a.suitability}%
              </p>
            ))}
          </Panel>
        </div>
      ) : (
        <p className="text-sm text-muted">No recommendation on this field. Pick a higher-risk parcel.</p>
      )}
      <Panel title="National recommendation queue">
        <div className="grid gap-2 md:grid-cols-2">
          {all.slice(0, 12).map((r: any) => (
            <button
              key={r.id}
              className="rounded-lg border border-line px-3 py-2 text-left text-xs"
              onClick={() => gw.setField(r.fieldId)}
            >
              {r.recommended} · {r.suitability}% · {r.fieldId}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
