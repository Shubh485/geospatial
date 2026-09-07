import type { ReactNode } from "react";
import { cn, riskTone } from "../lib/utils.ts";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-line bg-panel", className)}>
      {(title || action || eyebrow) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">{eyebrow}</p>
            )}
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Badge({ children, tone = "ok" }: { children: ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    ok: "bg-emerald/15 text-emerald",
    warn: "bg-amber/15 text-amber",
    critical: "bg-danger/15 text-danger",
    info: "bg-cyan/15 text-cyan",
    mute: "bg-white/5 text-muted",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", map[tone] ?? map.mute)}>
      {children}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={riskTone(value)}>{value}</Badge>;
}

export function DemoTag({ children = "DEMO DATA" }: { children?: string }) {
  return <span className="rounded border border-line px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-muted">{children}</span>;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "amber";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-emerald text-black hover:brightness-110",
    ghost: "border border-line text-white hover:bg-white/5",
    danger: "bg-danger text-white",
    amber: "bg-amber text-black",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-muted">{body}</p>
    </div>
  );
}
