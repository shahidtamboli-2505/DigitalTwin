import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, AlertTriangle, Radio, Droplets, Thermometer, CloudRain, Wind, Clock, MapPin,
  ArrowUpRight, Box, Waves, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line,
} from "recharts";
import { api } from "../lib/api";
import { TEHSILS, FLOOD_HISTORY as MOCK_FLOOD, WEATHER_DATA as MOCK_WEATHER, ALERTS, SENSORS } from "../data/sangli-district";
import { CountUp, Stagger, Panel, Ring, panelVariants, chartTooltip, axisTick } from "../components/pro/ProUI";

const band = (s: number) =>
  s >= 70 ? { label: "Critical", color: "#ff3b4e" } : s >= 50 ? { label: "High", color: "#ffb020" } : s >= 30 ? { label: "Medium", color: "#ffe066" } : { label: "Low", color: "#2ee6a6" };
const sevColor: Record<string, string> = { critical: "#ff3b4e", high: "#ff6b3d", medium: "#ffb020", low: "#2ee6a6" };

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    population: 2822143, avg_risk_score: 58.1, sensors_online: 12, total_sensors: 14,
    sensors_warning: 1, sensors_offline: 1, active_alerts: 5, high_alerts: 2,
  });
  const [weatherData, setWeatherData] = useState(MOCK_WEATHER);
  const [floodHistory, setFloodHistory] = useState(MOCK_FLOOD);

  useEffect(() => {
    api.get("/api/analytics/summary").then((r) => r.data && setSummary(r.data)).catch(() => undefined);
    api.get("/api/analytics/climate").then((r) => r.data && setWeatherData(r.data)).catch(() => undefined);
    api.get("/api/analytics/flood-history").then((r) => r.data && setFloodHistory(r.data)).catch(() => undefined);
  }, []);

  const tehsils = [...TEHSILS].sort((a, b) => b.risk_score - a.risk_score);
  const floodData = [...floodHistory].sort((a, b) => a.year - b.year).filter((f) => f.year >= 2000)
    .map((f) => ({ year: f.year, affected: Math.round(f.affected_population / 1000), rainfall: f.rainfall_mm }));
  const riskDist = [
    { name: "Low", value: TEHSILS.filter((t) => t.risk_score < 30).length, color: "#2ee6a6" },
    { name: "Medium", value: TEHSILS.filter((t) => t.risk_score >= 30 && t.risk_score < 50).length, color: "#ffe066" },
    { name: "High", value: TEHSILS.filter((t) => t.risk_score >= 50 && t.risk_score < 70).length, color: "#ffb020" },
    { name: "Critical", value: TEHSILS.filter((t) => t.risk_score >= 70).length, color: "#ff3b4e" },
  ].filter((d) => d.value > 0);
  const water = SENSORS.filter((s) => s.type === "water_level");
  const b = band(summary.avg_risk_score);

  const kpis = [
    { label: "Population", value: summary.population / 100000, dec: 1, suffix: " L", sub: "Census 2011 · +9.18% decadal", icon: Users, color: "#60a5fa", to: "/reports" },
    { label: "Sensors online", value: summary.sensors_online, dec: 0, suffix: `/${summary.total_sensors}`, sub: `${summary.sensors_warning} warning · ${summary.sensors_offline} offline`, icon: Radio, color: "#2ee6a6", to: "/sensors" },
    { label: "Active alerts", value: summary.active_alerts, dec: 0, suffix: "", sub: `${summary.high_alerts} high priority`, icon: AlertTriangle, color: "#ff3b4e", to: "/alerts" },
    { label: "Assets monitored", value: 21, dec: 0, suffix: "", sub: "7 types · 10 tehsils", icon: Activity, color: "#a78bfa", to: "/infrastructure" },
  ];
  const weather = [
    { icon: Thermometer, v: "32.4°C", l: "Temperature" }, { icon: CloudRain, v: "12 mm", l: "Rainfall" },
    { icon: Droplets, v: "72%", l: "Humidity" }, { icon: Wind, v: "14 km/h", l: "Wind" }, { icon: Waves, v: "12.4 m", l: "Krishna @ Irwin" },
  ];

  return (
    <Stagger className="relative z-[1] grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* ===== hero: risk index ===== */}
      <Panel className="xl:col-span-5" kicker="District risk index" title="Sangli overall status" hover={false}
        action={<span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300"><span className="live-dot" />LIVE</span>}>
        <div className="flex flex-wrap items-center gap-6">
          <Ring value={summary.avg_risk_score} color={b.color} label="of 100" />
          <div className="min-w-[180px] flex-1 space-y-3">
            <div>
              <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: `${b.color}22`, color: b.color }}>{b.label} band</span>
              <p className="mt-2 text-sm text-slate-400">Mean of ten tehsil scores. Population-weighted index: <b className="text-slate-200">62.4</b></p>
            </div>
            <div className="space-y-1.5">
              {tehsils.slice(0, 4).map((t, i) => (
                <div key={t.name} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate text-slate-400">{t.name.split(" ")[0]}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div className="h-full rounded-full" style={{ background: band(t.risk_score).color }}
                      initial={{ width: 0 }} animate={{ width: `${t.risk_score}%` }} transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }} />
                  </div>
                  <span className="w-6 text-right font-mono text-slate-300">{t.risk_score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-2 gap-4 xl:col-span-4">
        {kpis.map((k) => (
          <motion.button key={k.label} variants={panelVariants} onClick={() => navigate(k.to)}
            className="glass glass-hover group p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${k.color}1a`, color: k.color }}><k.icon size={17} /></span>
              <ArrowUpRight size={15} className="text-slate-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-white"><CountUp value={k.value} decimals={k.dec} suffix={k.suffix} /></div>
            <div className="text-xs font-medium text-slate-300">{k.label}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">{k.sub}</div>
          </motion.button>
        ))}
      </div>

      {/* ===== 3D twin launcher ===== */}
      <motion.button variants={panelVariants} onClick={() => navigate("/map")}
        className="glass glass-hover scan-sweep group relative flex flex-col justify-between overflow-hidden p-5 text-left xl:col-span-3">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <svg viewBox="0 0 200 110" className="absolute bottom-0 right-0 w-full opacity-40">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${10 + i * 27} 95 Q${23 + i * 27} 62 ${37 + i * 27} 95`} fill="none" stroke="#22d3ee" strokeWidth="1.5" />)}
          <line x1="5" y1="62" x2="195" y2="62" stroke="#22d3ee" strokeWidth="2" />
          <path d="M0 100 Q50 92 100 100 T200 100" fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-pulse" />
        </svg>
        <div className="relative">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30"><Box size={19} /></span>
          <h3 className="mt-3 font-display text-lg font-semibold text-white">3D Digital Twin</h3>
          <p className="mt-1 text-xs text-slate-400">Satellite + terrain + live structural models of 7 critical assets</p>
        </div>
        <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">Launch twin <ArrowUpRight size={15} className="transition group-hover:translate-x-1" /></span>
      </motion.button>

      {/* ===== weather strip ===== */}
      <motion.div variants={panelVariants} className="glass flex flex-wrap items-center justify-between gap-4 px-5 py-3 xl:col-span-12">
        {weather.map((w) => (
          <div key={w.l} className="flex items-center gap-3">
            <w.icon size={17} className="text-cyan-300" />
            <div><div className="font-mono text-sm font-semibold text-white">{w.v}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">{w.l}</div></div>
          </div>
        ))}
        <span className="text-[10px] text-slate-600">Representative values · live weather API in Phase II</span>
      </motion.div>

      {/* ===== charts ===== */}
      <Panel className="xl:col-span-7" kicker="Disaster records" title="Flood history 2005–2023">
        <div className="h-64">
          <ResponsiveContainer>
            <ComposedChart data={floodData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gAff" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff3b4e" stopOpacity={0.9} /><stop offset="100%" stopColor="#ff3b4e" stopOpacity={0.15} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(120,180,255,0.08)" vertical={false} />
              <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(34,211,238,0.05)" }} />
              <Bar dataKey="affected" name="Affected (thousand)" fill="url(#gAff)" radius={[6, 6, 0, 0]} barSize={34} />
              <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: "#05080f", stroke: "#22d3ee", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="xl:col-span-5" kicker="Ten tehsils" title="Risk distribution">
        <div className="flex h-64 items-center gap-4">
          <div className="relative h-full flex-1">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskDist} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={4} stroke="none" animationDuration={1200}>
                  {riskDist.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltip} formatter={(v: number) => [`${v} tehsils`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><div className="font-display text-3xl font-bold text-white">{TEHSILS.length}</div><div className="text-[10px] uppercase tracking-widest text-slate-500">tehsils</div></div>
            </div>
          </div>
          <div className="space-y-2">
            {riskDist.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                <span className="w-16 text-slate-400">{d.name}</span><span className="font-mono text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="xl:col-span-7" kicker="IMD climate normals" title="Climate profile">
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={weatherData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gRain" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} /><stop offset="100%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient>
                <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffb020" stopOpacity={0.35} /><stop offset="100%" stopColor="#ffb020" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(120,180,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltip} />
              <Area type="monotone" dataKey="avg_rainfall_mm" name="Rainfall (mm)" stroke="#38bdf8" fill="url(#gRain)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="avg_temp_max" name="Max temp (°C)" stroke="#ffb020" fill="url(#gTemp)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="xl:col-span-5" kicker="Census 2011" title="Population vs risk by tehsil">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={tehsils.map((t) => ({ name: t.name.split(" ")[0], pop: t.population, risk: t.risk_score }))} layout="vertical" margin={{ top: 0, right: 8, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={78} />
              <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(34,211,238,0.05)" }} formatter={(v: number) => [v.toLocaleString("en-IN"), "Population"]} />
              <Bar dataKey="pop" radius={[0, 6, 6, 0]} barSize={12}>
                {tehsils.map((t) => <Cell key={t.name} fill={band(t.risk_score).color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* ===== sensors + alerts ===== */}
      <Panel className="xl:col-span-6" kicker="River gauges" title="Water-level sensors"
        action={<button onClick={() => navigate("/sensors")} className="text-xs text-cyan-300 hover:underline">View all →</button>}>
        <div className="space-y-3">
          {water.map((s, i) => {
            const pct = Math.min(100, (s.current_value / s.threshold_critical) * 100);
            const col = pct >= 85 ? "#ff3b4e" : pct >= 65 ? "#ffb020" : "#2ee6a6";
            return (
              <div key={s.id} className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-200"><MapPin size={13} className="text-slate-500" />{s.name}</span>
                  <span className="font-mono" style={{ color: col }}>{s.current_value} {s.unit}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${col}88, ${col})`, boxShadow: `0 0 10px ${col}` }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.1, delay: 0.2 + i * 0.08 }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>{s.status}</span><span>{pct.toFixed(0)}% of critical</span></div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="xl:col-span-6" kicker="Alert centre" title="Recent alerts"
        action={<button onClick={() => navigate("/alerts")} className="text-xs text-cyan-300 hover:underline">View all →</button>}>
        <div className="space-y-2">
          {ALERTS.slice(0, 5).map((a, i) => {
            const col = sevColor[a.severity] ?? "#94a3b8";
            return (
              <motion.div key={a.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                className="flex gap-3 rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/5 transition hover:ring-white/15">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${col}1f`, color: col }}><AlertTriangle size={15} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-100">{a.title}</span>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: `${col}22`, color: col }}>{a.severity}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{a.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} />{new Date(a.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} />{a.tehsil}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Panel>
    </Stagger>
  );
}
