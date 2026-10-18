import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Map, Waves, Building2, Radio, Brain, Bell, FileText,
  ChevronLeft, ChevronRight, Menu, X, Search, BellRing, Hexagon, Code2,
} from "lucide-react";
import { ALERTS } from "../data/sangli-district";
import "../styles/pro-theme.css";

const NAV_GROUPS = [
  { title: "Overview", items: [
    { to: "/", icon: LayoutDashboard, label: "Command Center" },
    { to: "/map", icon: Map, label: "3D Digital Twin" },
    { to: "/twin", icon: Waves, label: "Flood Simulator" },
  ] },
  { title: "Monitoring", items: [
    { to: "/infrastructure", icon: Building2, label: "Infrastructure" },
    { to: "/sensors", icon: Radio, label: "Live Sensors" },
    { to: "/alerts", icon: Bell, label: "Alerts" },
  ] },
  { title: "Intelligence", items: [
    { to: "/ai-predictions", icon: Brain, label: "AI Predictions" },
    { to: "/reports", icon: FileText, label: "Reports" },
  ] },
];
const ALL = NAV_GROUPS.flatMap((g) => g.items);

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="hidden flex-col items-end leading-tight lg:flex">
      <span className="font-mono text-sm text-cyan-200">{now.toLocaleTimeString("en-IN", { hour12: false })} IST</span>
      <span className="text-[10px] uppercase tracking-widest text-slate-500">
        {now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </span>
    </div>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const activeAlerts = ALERTS.filter((a) => a.status === "active").length;
  const current = ALL.find((i) => i.to === location.pathname)?.label ?? "Command Center";

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  const sidebar = (
    <motion.aside
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-white/5 bg-[#070c18]/90 backdrop-blur-xl"
    >
      {/* brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.8 }}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/25 to-emerald-400/10 ring-1 ring-cyan-400/40">
          <Hexagon className="h-5 w-5 text-cyan-300" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#2ee6a6]" />
        </motion.div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
            <div className="font-display text-[15px] font-semibold text-white">SANGLI<span className="text-cyan-300">·</span>TWIN</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Infrastructure DT · MH</div>
          </motion.div>
        )}
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((g) => (
          <div key={g.title}>
            {!collapsed && <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">{g.title}</div>}
            <div className="space-y-1">
              {g.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}
                  className={({ isActive }) => `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? "text-white" : "text-slate-400 hover:text-slate-100"}`}>
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="nav-active" transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/15 to-transparent ring-1 ring-cyan-400/25">
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
                        </motion.span>
                      )}
                      <Icon size={18} className={`relative shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-cyan-300" : ""}`} />
                      {!collapsed && <span className="relative truncate">{label}</span>}
                      {label === "Alerts" && activeAlerts > 0 && (
                        <span className={`relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white ${collapsed ? "absolute right-1 top-1" : ""}`}>{activeAlerts}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* status footer */}
      <div className="border-t border-white/5 p-4">
        {!collapsed ? (
          <div className="rounded-lg bg-white/[0.03] p-3 ring-1 ring-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-300"><span className="live-dot" /> All systems nominal</div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500"><span>Phase I · Review-II</span><span>v2.1</span></div>
          </div>
        ) : <span className="live-dot mx-auto block" />}
      </div>

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 hidden h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#0d1528] text-slate-400 hover:text-cyan-300 md:grid">
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );

  return (
    <div className="pro flex h-screen overflow-hidden">
      {/* desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>
      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed inset-y-0 left-0 z-40 md:hidden">
              {sidebar}
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 text-slate-400"><X size={18} /></button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/5 bg-[#070c18]/70 px-4 backdrop-blur-xl md:px-6">
          <button className="text-slate-400 md:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Sangli District · Maharashtra</div>
            <AnimatePresence mode="wait">
              <motion.h1 key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="font-display truncate text-lg font-semibold text-white">{current}</motion.h1>
            </AnimatePresence>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-slate-500 xl:flex">
              <Search size={15} />
              <input placeholder="Search assets, sensors, alerts…" className="w-56 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600" />
              <kbd className="rounded border border-white/10 px-1.5 font-mono text-[10px]">Ctrl K</kbd>
            </div>
            <LiveClock />
            <NavLink to="/alerts" className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-300 hover:text-cyan-300">
              <BellRing size={17} />
              {activeAlerts > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{activeAlerts}</span>}
            </NavLink>
            {/* developer credit */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.06] py-1 pl-1 pr-3 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-[11px] font-bold text-slate-950">ST</span>
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-slate-500"><Code2 size={10} /> Developed by</div>
                <div className="credit-shimmer font-display text-[13px] font-semibold">Shahid Tamboli</div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* page with transition */}
        <main className="relative flex-1 overflow-y-auto p-4 md:p-5">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
