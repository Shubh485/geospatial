import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DemoTag, EmptyState, Panel, StatusBadge } from "../components/ui.tsx";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";

export function JalSaheliPage() {
  const gw = useGeoWise();
  const navigate = useNavigate();
  const items = gw.provider.getJalSaheli(gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope);
  const [msg, setMsg] = useState("");
  const [channel, setChannel] = useState(
    items.slice(0, 4).map((j: any) => ({
      id: j.id,
      who: j.contributor,
      text: j.message,
      at: j.timestamp,
    })),
  );

  const verified = items.filter((j: any) => j.status === "Verified").length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Jal Saheli</p>
        <h1 className="text-xl font-semibold">Water stewardship network</h1>
        <p className="text-sm text-muted">Demo community channel — not Telegram, not a live field network.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Community observations", items.length + gw.observations.length],
          ["Pending verification", items.filter((j: any) => j.status === "Pending").length],
          ["Verified", verified],
          ["Active contributors", 12],
        ].map(([l, v]) => (
          <Panel key={String(l)}>
            <p className="text-[10px] text-muted uppercase">{l}</p>
            <p className="text-2xl font-semibold">{v}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Observations">
          <div className="max-h-[480px] space-y-2 overflow-auto">
            {items.map((j: any) => (
              <article key={j.id} className="rounded-lg border border-line p-3">
                <div className="flex justify-between">
                  <p className="text-xs font-medium">{j.village}</p>
                  <StatusBadge value={j.status} />
                </div>
                <p className="mt-1 text-sm">{j.message}</p>
                <p className="text-[11px] text-muted">
                  {j.category} · AI triage {j.aiTriage} · {j.timestamp}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" onClick={() => navigate("/verification")}>
                    Verify
                  </Button>
                  <Button
                    onClick={() => {
                      if (j.fieldId) gw.setField(j.fieldId);
                      navigate("/map");
                    }}
                  >
                    View on map
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Jal Saheli demo community channel" action={<DemoTag>NOT TELEGRAM</DemoTag>}>
          <div className="mb-3 max-h-72 space-y-2 overflow-auto rounded-lg bg-shell p-3">
            {channel.map((m: { id: string; who: string; text: string }) => (
              <div key={m.id} className="rounded-lg bg-panel px-3 py-2">
                <p className="text-[10px] text-emerald">{m.who}</p>
                <p className="text-sm">{m.text}</p>
              </div>
            ))}
            {gw.observations.map((o) => (
              <div key={o.id} className="rounded-lg bg-panel px-3 py-2">
                <p className="text-[10px] text-emerald">You · capture</p>
                <p className="text-sm">
                  {o.waterBodyType} at {o.lat.toFixed(3)}, {o.lng.toFixed(3)}
                </p>
              </div>
            ))}
            {channel.length === 0 && <EmptyState title="No messages" body="Submit a demo observation." />}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!msg.trim()) return;
              gw.addObservation({
                id: `JAL-LIVE-${Date.now()}`,
                fieldId: gw.selectedField?.id ?? "FIELD-001",
                regionId: gw.selectedField?.regionId ?? "IN-AP",
                capturedAt: new Date().toISOString(),
                lat: gw.selectedField?.lat ?? 13.2172,
                lng: gw.selectedField?.lng ?? 79.1003,
                locationSource: "Jal Saheli channel",
                waterBodyType: "Community observation",
                userNotes: msg,
              });
              setChannel((c: { id: string; who: string; text: string; at: string }[]) => [
                ...c,
                { id: `local-${Date.now()}`, who: "You", text: msg, at: new Date().toISOString() },
              ]);
              setMsg("");
            }}
          >
            <input
              className="flex-1 rounded-lg border border-line bg-shell px-3 py-2 text-sm"
              placeholder="Share a demo observation..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <Button type="submit">Send</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

export function CreditsPage() {
  const gw = useGeoWise();
  const ledgers = gw.provider.getCredits(gw.scope === "india" || gw.scope === "chittoor" ? undefined : gw.scope);
  const focus =
    ledgers.find((l: any) => l.regionId === gw.selectedField?.regionId) ??
    (gw.scope === "chittoor" ? ledgers.find((l: any) => l.regionId === "IN-AP") : ledgers[0]);
  if (!focus) return <EmptyState title="No ledger" body="No demo credits for this scope." />;
  const bonus = gw.extraCredits.filter((t) => t.regionId === focus.regionId).reduce((s, x) => s + x.amount, 0);
  const score = focus.villageStewardshipScore + bonus;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Jal Credits</p>
        <h1 className="text-xl font-semibold">Water stewardship credits</h1>
        <DemoTag>DEMO REWARD SIMULATION — not money</DemoTag>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Panel title="Village stewardship score">
          <p className="text-3xl font-semibold">{score.toLocaleString("en-IN")}</p>
        </Panel>
        <Panel title="Verified improvements">
          <p className="text-3xl font-semibold">{focus.verifiedImprovements + gw.extraCredits.length}</p>
        </Panel>
        <Panel title="Eligible benefits">
          <p className="text-3xl font-semibold">{focus.eligibleBenefits}</p>
        </Panel>
      </div>
      <Panel title="Ledger">
        {[...gw.extraCredits.map((t) => ({ ...t, id: t.at })), ...focus.transactions].slice(0, 20).map((t: any) => (
          <div key={t.id} className="flex justify-between border-b border-line py-2 text-sm">
            <span>{t.reason}</span>
            <span className="text-emerald">+{t.amount}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

export function LearningPage() {
  const gw = useGeoWise();
  const v = gw.linked?.verification;
  const status = v ? gw.verification[v.id] ?? v.status : "—";
  const outcomes = gw.verificationOutcomes;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.16em] text-emerald uppercase">Closed-loop learning</p>
        <h1 className="text-xl font-semibold">Prediction → verification → outcome → learning signal</h1>
        <DemoTag>DEMO LEARNING SIMULATION — model is not retraining</DemoTag>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {["AI prediction", "Field verification", "Outcome", "Learning signal", "Model improvement"].map((s) => (
          <div key={s} className="rounded-xl border border-line bg-panel p-3 text-xs">
            {s}
          </div>
        ))}
      </div>
      <Panel title="Current example">
        <p>Prediction: {gw.linked?.analysis?.finding ?? "—"}</p>
        <p>Verification: {status}</p>
        <p>Outcome: {status === "Verified" ? "Intervention recommended" : "Awaiting verification"}</p>
        <p>Learning: {status === "Verified" ? "Positive confirmation" : "No weight update (demo)"}</p>
      </Panel>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(outcomes).map(([k, val]) => (
          <Panel key={k} title={k}>
            <p className="text-2xl">{String(val)}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
