import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Brain,
  CircleHelp,
  Cpu,
  GitBranch,
  LayoutDashboard,
  Leaf,
  Map as MapIcon,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  FileText,
  Camera,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGeoWise } from "../store/GeoWiseProvider.tsx";
import { Badge } from "./ui.tsx";
import { cn } from "../lib/utils.ts";

const nav = [
  { group: "Command Center", items: [{ to: "/", label: "Overview", icon: LayoutDashboard }] },
  {
    group: "Geospatial",
    items: [
      { to: "/map", label: "Live Map", icon: MapIcon },
      { to: "/geo-ai", label: "Geo AI", icon: Cpu },
      { to: "/capture", label: "Field capture", icon: Camera },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { to: "/xai", label: "XAI Insights", icon: CircleHelp },
      { to: "/triage", label: "Autonomous Triage", icon: ShieldCheck },
      { to: "/analytics", label: "Analytics", icon: Activity },
    ],
  },
  {
    group: "Operations",
    items: [
      { to: "/verification", label: "Verification", icon: GitBranch },
      { to: "/recommendations", label: "Recommendations", icon: Sparkles },
    ],
  },
  { group: "Community", items: [{ to: "/jal-saheli", label: "Jal Saheli", icon: Users }] },
  {
    group: "Learning",
    items: [
      { to: "/learning", label: "Closed-Loop Learning", icon: Brain },
      { to: "/credits", label: "Jal Credits", icon: Wallet },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/reports", label: "Reports", icon: FileText },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const gw = useGeoWise();
  const loc = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const results = useMemo(() => (q.length > 1 ? gw.provider.search(q) : []), [q, gw.provider]);
  const unread = gw.notifications.filter((n: { read: boolean }) => !n.read).length;
  const regions = gw.provider.getRegions();

  return (
    <div className="flex h-full bg-bg">
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-line bg-shell transition-[width] duration-200",
          gw.sidebarCollapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/15 text-emerald">
            <Leaf size={18} />
          </div>
          {!gw.sidebarCollapsed && (
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">GeoWise</p>
              <p className="text-[10px] leading-snug text-muted">The Self-Learning Watershed Brain</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-auto px-2 py-3">
          {nav.map((group) => (
            <div key={group.group} className="mb-3">
              {!gw.sidebarCollapsed && (
                <p className="px-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{group.group}</p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  title={item.label}
                  className={({ isActive }) =>
                    cn(
                      "mb-0.5 flex items-center gap-2 rounded-lg px-2 py-2 text-[13px]",
                      isActive
                        ? "bg-emerald/12 text-emerald shadow-[inset_2px_0_0_#10b981]"
                        : "text-slate-300 hover:bg-white/4",
                    )
                  }
                >
                  <item.icon size={16} />
                  {!gw.sidebarCollapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          {!gw.sidebarCollapsed && (
            <>
              <p className="text-[10px] text-muted uppercase tracking-wider">Workspace</p>
              <p className="mt-1 text-sm text-white">Demo Watershed</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                DEMO ENVIRONMENT
              </div>
              <div className="mt-3 rounded-lg border border-line bg-panel p-2">
                <p className="text-xs font-medium">Admin User</p>
                <p className="text-[10px] text-muted">admin@geowise.demo</p>
              </div>
            </>
          )}
          <button
            className="mt-2 flex w-full items-center justify-center rounded-lg border border-line py-2 text-muted hover:text-white"
            onClick={gw.toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <Menu size={16} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-shell/90 px-4">
          <p className="hidden text-xs text-muted lg:block">{loc.pathname === "/" ? "Command Center" : loc.pathname}</p>
          <div className="relative mx-auto w-full max-w-xl">
            <Search size={14} className="absolute top-2.5 left-3 text-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search fields, villages, analyses, or locations..."
              className="w-full rounded-lg border border-line bg-panel py-2 pr-3 pl-9 text-sm outline-none focus:border-emerald"
              aria-label="Global search"
            />
            {searchOpen && q && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-xl">
                <div className="flex justify-between px-3 py-2 text-[10px] text-muted">
                  Search results <button onClick={() => setSearchOpen(false)}><X size={12} /></button>
                </div>
                {results.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted">No matching demo records.</p>
                ) : (
                  results.slice(0, 8).map((r: any) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="block w-full border-t border-line px-3 py-2 text-left text-xs hover:bg-white/5"
                      onClick={() => {
                        if (r.type === "field" || r.type === "case" || r.type === "verification") gw.setField(r.fieldId ?? r.id);
                        if (r.type === "field") navigate("/map");
                        if (r.type === "case") navigate("/triage");
                        if (r.type === "jal") navigate("/jal-saheli");
                        if (r.type === "recommendation") navigate("/recommendations");
                        if (r.type === "location") gw.setScope(r.regionId ?? "india");
                        setSearchOpen(false);
                        setQ("");
                      }}
                    >
                      <span className="text-muted uppercase">{r.type}</span> · {r.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <select
            className="hidden rounded-lg border border-line bg-panel px-2 py-1.5 text-xs md:block"
            value={gw.scope}
            onChange={(e) => gw.setScope(e.target.value)}
            aria-label="Region"
          >
            <option value="india">India (national demo)</option>
            <option value="chittoor">Chittoor, Andhra Pradesh</option>
            {regions.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Badge tone="ok">Demo Environment</Badge>
          <div className="relative">
            <button className="relative rounded-full border border-line p-2" onClick={() => setBellOpen((v) => !v)} aria-label="Notifications">
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-[9px]">
                  {unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-line bg-panel p-2 shadow-xl">
                {gw.notifications.map((n: any) => (
                  <button
                    key={n.id}
                    className="mb-1 w-full rounded-lg px-2 py-2 text-left hover:bg-white/5"
                    onClick={() => gw.markNotif(n.id)}
                  >
                    <p className="text-xs font-medium">{n.title}</p>
                    <p className="text-[11px] text-muted">{n.body}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald/20 text-xs font-bold text-emerald">A</div>
        </header>
        <main className="app-scroll min-w-0 flex-1 p-4 md:p-5">{children}</main>
      </div>

      <div className="pointer-events-none fixed right-4 bottom-4 z-40 space-y-2">
        {gw.toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-72 rounded-lg border border-line bg-panel p-3 shadow-xl">
            <div className="flex justify-between gap-2">
              <p className="text-xs font-semibold">{t.title}</p>
              <button onClick={() => gw.dismissToast(t.id)}><X size={12} /></button>
            </div>
            <p className="mt-1 text-[11px] text-muted">{t.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
