import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarRange, CloudRain, Waves, Flame, Brain, Droplets, Download, Info, ArrowLeftRight,
  AlertTriangle, Building2, Sparkles, Database,
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  ReferenceLine, Legend,
} from "recharts";
import { CountUp, Stagger, Panel, Ring, panelVariants, chartTooltip, axisTick } from "../components/pro/ProUI";
import { FLOOD_HISTORY } from "../data/sangli-district";
import {
  loadYearly, loadYear, assetHealthForYear, yearInsight, yearToCsv, doyLabel, fmtDate,
  SEVERITY_COLOR, healthColor, MONTHS,
} from "../lib/yearly";
import type { YearRecord, YearlyDataset } from "../lib/yearly";

const bandColor = { good: "#2ee6a6", watch: "#ffe066", high: "#ffb020", critical: "#ff3b4e" } as const;

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase" style={{ background: `${color}22`, color }}>{children}</span>;
}

export default function YearAnalysis() {
  const [ds, setDs] = useState<YearlyDataset | null>(null);
  const [year, setYear] = useState<number>(2019);
  const [compare, setCompare] = useState<number | null>(null);
  const [detail, setDetail] = useState<YearRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadYearly()
      .then((d) => { setDs(d); if (!d.years.some((y) => y.year === year)) setYear(d.meta.end_year); })
      .catch(() => setError("Dataset not found. Run `python ai/training/build_yearly_dataset.py` and rebuild."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ds) return;
    let alive = true;
    loadYear(year).then((y) => alive && setDetail(y)).catch(() => undefined);
    return () => { alive = false; };
  }, [ds, year]);

  const years = ds?.years ?? [];
  const cmp = useMemo(() => years.find((y) => y.year === compare) ?? null, [years, compare]);
  const y = detail ?? years.find((x) => x.year === year) ?? null;
  const documented = FLOOD_HISTORY.find((f) => f.year === year);

  const monthly = useMemo(() => {
    if (!y) return [];
    return MONTHS.map((m, i) => ({ month: m, rain: y.monthly_rain_mm[i] ?? 0, cmp: cmp?.monthly_rain_mm[i] ?? 0, tmax: y.monthly_temp_max[i] ?? 0 }));
  }, [y, cmp]);

  const daily = useMemo(() => {
    if (!y) return [];
    return y.daily.map(([doy, rain, tmax, prob, level]) => ({ doy, label: doyLabel(y.year, doy), rain, tmax, prob: +(prob * 100).toFixed(1), level }));
  }, [y]);

  const hydro = useMemo(() => (y ? y.hydrograph.map((h) => ({ ...h, label: fmtDate(h.date).replace(/ \d{4}$/, ""), prob: +(h.prob * 100).toFixed(0) })) : []), [y]);
  const overview = useMemo(() => years.map((x) => ({ year: x.year, rain: x.rainfall_total_mm, risk: x.risk_score, health: x.health_index, sev: x.severity, partial: x.partial })), [years]);
  const assets = useMemo(() => (y ? assetHealthForYear(y) : []), [y]);
  const insight = useMemo(() => (y ? yearInsight(y, years) : []), [y, years]);

  const exportCsv = () => {
    if (!y) return;
    const blob = new Blob([yearToCsv(y)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sangli-${y.year}-daily.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) {
    return <div className="glass p-6 text-sm text-amber-300"><AlertTriangle className="mr-2 inline" size={16} />{error}</div>;
  }
  if (!ds || !y) {
    return <div className="glass grid h-64 place-items-center text-sm text-slate-400"><span className="live-dot mr-2" />Loading {ds ? year : "dataset"}…</div>;
  }

  const sev = SEVERITY_COLOR[y.severity];
  const kpis = [
    { icon: CloudRain, label: "Total rainfall", value: y.rainfall_total_mm, dec: 0, suffix: " mm", sub: `monsoon ${Math.round(y.rainfall_monsoon_mm)} mm · ${y.rainy_days} rainy days`, color: "#38bdf8", d: cmp ? y.rainfall_total_mm - cmp.rainfall_total_mm : null, unit: "mm" },
    { icon: Waves, label: "Krishna peak level", value: y.river_peak_m, dec: 1, suffix: " m", sub: fmtDate(y.river_peak_date), color: y.river_peak_m >= 18 ? "#ff3b4e" : y.river_peak_m >= 15 ? "#ffb020" : "#67e8f9", d: cmp ? y.river_peak_m - cmp.river_peak_m : null, unit: "m" },
    { icon: Droplets, label: "Flood-risk days", value: y.flood_risk_days, dec: 0, suffix: "", sub: `${y.river_critical_days} d above danger · ${y.river_warning_days} d above warning`, color: "#ff6b3d", d: cmp ? y.flood_risk_days - cmp.flood_risk_days : null, unit: "d" },
    { icon: Brain, label: "Max flood probability", value: y.flood_prob_max * 100, dec: 0, suffix: "%", sub: `XGBoost · mean ${(y.flood_prob_mean * 100).toFixed(1)}%`, color: "#a78bfa", d: cmp ? (y.flood_prob_max - cmp.flood_prob_max) * 100 : null, unit: "pp" },
    { icon: Flame, label: "Heat-wave days", value: y.heat_wave_days, dec: 0, suffix: "", sub: `hottest ${y.hottest_day_c} °C · avg max ${y.avg_temp_max} °C`, color: "#ffb020", d: cmp ? y.heat_wave_days - cmp.heat_wave_days : null, unit: "d" },
    { icon: CloudRain, label: "Catchment rainfall", value: y.catchment_rain_mm, dec: 0, suffix: " mm", sub: `Ghats · peak 7-day ${Math.round(y.catchment_max_7d_mm)} mm`, color: "#22d3ee", d: cmp ? y.catchment_rain_mm - cmp.catchment_rain_mm : null, unit: "mm" },
  ];

  return (
    <Stagger className="relative z-[1] space-y-4">
      {/* ===== header ===== */}
      <motion.div variants={panelVariants} className="glass flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30"><CalendarRange size={20} /></span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold text-white">Historical Year Analysis</h2>
          <p className="text-sm text-slate-400">
            {ds.meta.start_year}–{ds.meta.end_year} · {ds.meta.total_days.toLocaleString("en-IN")} days of daily climate data · {ds.meta.source.split(" (")[0]}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
          <Database size={13} /> {ds.meta.model_scored ? "Scored by XGBoost flood model" : "Rule-based scoring"}
        </span>
        <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/10 hover:bg-white/10">
          <Download size={14} /> Export {y.year} CSV
        </button>
      </motion.div>

      {/* ===== year picker ===== */}
      <Panel kicker="Select year" title="Every year in the dataset" hover={false}
        action={
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowLeftRight size={14} /> Compare with
            <select value={compare ?? ""} onChange={(e) => setCompare(e.target.value ? +e.target.value : null)}
              className="rounded-md bg-white/5 px-2 py-1 text-slate-100 ring-1 ring-white/10 focus:outline-none">
              <option value="">none</option>
              {years.filter((x) => x.year !== year).map((x) => <option key={x.year} value={x.year}>{x.year}</option>)}
            </select>
          </label>
        }>
        <div className="flex flex-wrap gap-1.5">
          {years.map((x) => {
            const c = SEVERITY_COLOR[x.severity];
            const active = x.year === year;
            return (
              <button key={x.year} onClick={() => setYear(x.year)} title={`${x.year}: ${x.severity}, health ${x.health_index}`}
                className={`relative rounded-md px-2.5 py-1.5 font-mono text-xs transition ${active ? "text-slate-950" : "text-slate-200 hover:bg-white/10"}`}
                style={{ background: active ? c : `${c}1a`, boxShadow: active ? `0 0 14px ${c}88` : undefined, outline: x.year === compare ? `1px dashed ${c}` : undefined }}>
                {x.year}{x.partial && <sup className="ml-0.5 text-[8px]">YTD</sup>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          {(Object.keys(SEVERITY_COLOR) as (keyof typeof SEVERITY_COLOR)[]).map((s) => (
            <span key={s} className="flex items-center gap-1 capitalize"><span className="h-2 w-2 rounded-sm" style={{ background: SEVERITY_COLOR[s] }} />{s}</span>
          ))}
          <span className="ml-auto">Colour = annual hazard severity · dashed outline = comparison year</span>
        </div>
      </Panel>

      {/* ===== health hero + KPIs ===== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-4" kicker={`District health · ${y.year}`} title={y.partial ? `${y.year} (year to date)` : `${y.year} annual outcome`} hover={false}
          action={<Chip color={sev}>{y.severity}</Chip>}>
          <div className="flex items-center gap-5">
            <Ring value={y.health_index} color={healthColor(y.health_index)} label="health index" />
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Hazard score</span><b className="font-mono" style={{ color: sev }}>{y.risk_score}</b></div>
              <div className="flex justify-between"><span className="text-slate-400">Health index</span><b className="font-mono text-white">{y.health_index}</b></div>
              {cmp && (
                <div className="flex justify-between"><span className="text-slate-400">vs {cmp.year}</span>
                  <b className="font-mono" style={{ color: y.health_index >= cmp.health_index ? "#2ee6a6" : "#ff3b4e" }}>
                    {y.health_index >= cmp.health_index ? "+" : ""}{(y.health_index - cmp.health_index).toFixed(1)}
                  </b>
                </div>
              )}
              <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
                health = 100 − (50·river + 25·flood-days + 15·AI probability + 10·heat)
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 xl:col-span-8 lg:grid-cols-3">
          {kpis.map((k) => (
            <motion.div key={k.label} variants={panelVariants} className="glass glass-hover p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${k.color}1a`, color: k.color }}><k.icon size={15} /></span>
                {k.d !== null && (
                  <span className="font-mono text-[11px]" style={{ color: k.d > 0 ? "#ff6b3d" : k.d < 0 ? "#2ee6a6" : "#64748b" }}>
                    {k.d > 0 ? "▲" : k.d < 0 ? "▼" : "•"} {Math.abs(k.d).toFixed(k.unit === "m" ? 1 : 0)} {k.unit}
                  </span>
                )}
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-white"><CountUp value={k.value} decimals={k.dec} suffix={k.suffix} /></div>
              <div className="text-xs font-medium text-slate-300">{k.label}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500" title={k.sub}>{k.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== insight + documented event ===== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7" kicker="Generated from the data" title={`What happened in ${y.year}`} hover={false}
          action={<Sparkles size={16} className="text-violet-300" />}>
          <ul className="space-y-2 text-sm text-slate-300">
            {insight.map((l, i) => <li key={i} className="flex gap-2"><span className="text-cyan-300">›</span><span>{l}</span></li>)}
          </ul>
        </Panel>
        <Panel className="xl:col-span-5" kicker="Disaster records" title={documented ? `Documented flood · ${y.year}` : "Documented flood"} hover={false}>
          {documented ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Chip color={SEVERITY_COLOR[documented.severity]}>{documented.severity}</Chip><span className="text-xs text-slate-500">{documented.duration_days} days · gauge {documented.river_level_m} m</span></div>
              <p className="text-slate-300">{documented.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="rounded-lg bg-white/5 p-2"><div className="text-slate-500">Affected population</div><div className="font-mono text-white">{documented.affected_population.toLocaleString("en-IN")}</div></div>
                <div className="rounded-lg bg-white/5 p-2"><div className="text-slate-500">Damages</div><div className="font-mono text-white">₹{documented.damages_crore.toLocaleString("en-IN")} Cr</div></div>
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-sm text-slate-400"><Info size={15} className="mt-0.5 shrink-0 text-slate-500" />
              No major flood disaster is on record for {y.year} in the Sangli DDMA archive. The figures above are derived from reanalysis rainfall and the AI model.</p>
          )}
        </Panel>
      </div>

      {/* ===== charts ===== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-5" kicker="Monthly rainfall" title={cmp ? `${y.year} vs ${cmp.year}` : `${y.year} by month`}>
          <div className="h-60">
            <ResponsiveContainer>
              <ComposedChart data={monthly} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(120,180,255,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(34,211,238,0.05)" }} />
                <Bar dataKey="rain" name={`${y.year} rain (mm)`} fill="#38bdf8" radius={[5, 5, 0, 0]} barSize={cmp ? 10 : 18} />
                {cmp && <Bar dataKey="cmp" name={`${cmp.year} rain (mm)`} fill="#a78bfa" radius={[5, 5, 0, 0]} barSize={10} />}
                {!cmp && <Line type="monotone" dataKey="tmax" name="Avg max temp (°C)" stroke="#ffb020" strokeWidth={2} dot={false} />}
                {cmp && <Legend wrapperStyle={{ fontSize: 11 }} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="xl:col-span-7" kicker="Daily timeline" title={`Rainfall, river level & AI flood probability · ${y.year}`}>
          <div className="h-60">
            <ResponsiveContainer>
              <ComposedChart data={daily} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gProb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(120,180,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={30} />
                <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltip} />
                <Bar yAxisId="l" dataKey="rain" name="Rain (mm)" fill="#38bdf8" fillOpacity={0.7} />
                <Line yAxisId="l" type="monotone" dataKey="level" name="Krishna level (m)" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Area yAxisId="r" type="monotone" dataKey="prob" name="Flood probability (%)" stroke="#a78bfa" fill="url(#gProb)" strokeWidth={1.5} />
                <ReferenceLine yAxisId="l" y={18} stroke="#ff3b4e" strokeDasharray="4 4" label={{ value: "danger 18 m", fill: "#ff3b4e", fontSize: 10, position: "insideTopRight" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="xl:col-span-5" kicker="Peak event" title={`Hydrograph around the ${y.year} peak`}>
          <div className="h-56">
            <ResponsiveContainer>
              <ComposedChart data={hydro} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(120,180,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={2} />
                <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} domain={[8, 26]} />
                <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltip} />
                <Bar yAxisId="r" dataKey="catchment_rain" name="Catchment rain (mm)" fill="#0ea5e9" fillOpacity={0.45} />
                <Bar yAxisId="r" dataKey="rain" name="Sangli rain (mm)" fill="#38bdf8" fillOpacity={0.8} />
                <Line yAxisId="l" type="monotone" dataKey="level" name="Krishna level (m)" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3, fill: "#05080f", stroke: "#22d3ee", strokeWidth: 2 }} />
                <ReferenceLine yAxisId="l" y={15} stroke="#ffb020" strokeDasharray="4 4" />
                <ReferenceLine yAxisId="l" y={18} stroke="#ff3b4e" strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>warning 15 m</span><span>danger 18 m</span><span>2019 observed 22.8 m</span></div>
        </Panel>

        <Panel className="xl:col-span-7" kicker="All years" title="Annual rainfall & hazard — click a bar to select">
          <div className="h-56">
            <ResponsiveContainer>
              <ComposedChart data={overview} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(120,180,255,0.08)" vertical={false} />
                <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} interval={1} />
                <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(34,211,238,0.05)" }} />
                <Bar yAxisId="l" dataKey="rain" name="Rainfall (mm)" radius={[5, 5, 0, 0]} barSize={16} onClick={(d: { year?: number }) => d.year && setYear(d.year)} cursor="pointer">
                  {overview.map((d) => <Cell key={d.year} fill={SEVERITY_COLOR[d.sev]} fillOpacity={d.year === year ? 1 : 0.55} stroke={d.year === year ? "#fff" : undefined} />)}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="health" name="Health index" stroke="#2ee6a6" strokeWidth={2} dot={{ r: 2.5, fill: "#2ee6a6" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ===== infrastructure health for that year ===== */}
      <Panel kicker="Digital twin" title={`Infrastructure health in ${y.year}`} hover={false}
        action={<span className="flex items-center gap-1 text-[11px] text-slate-500"><Building2 size={13} /> risk = base(condition) + age factor + exposure × hazard {y.risk_score}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500">
              <tr><th className="pb-2 pr-3">Asset</th><th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">Tehsil</th><th className="pb-2 pr-3 text-right">Age</th><th className="pb-2 pr-3 text-right">Age factor</th><th className="pb-2 pr-3 text-right">Hazard</th><th className="pb-2 pr-3 text-right">Risk</th><th className="pb-2 pr-3">Health</th></tr>
            </thead>
            <tbody>
              {assets.map(({ asset, built, age, ageFactor, hazardFactor, risk, health, band }) => (
                <tr key={asset.id} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-slate-100">{asset.name}</td>
                  <td className="py-2 pr-3 capitalize text-slate-400">{asset.type.replace(/_/g, " ")}</td>
                  <td className="py-2 pr-3 text-slate-400">{asset.tehsil}</td>
                  {built ? (
                    <>
                      <td className="py-2 pr-3 text-right font-mono text-slate-300">{age} y</td>
                      <td className="py-2 pr-3 text-right font-mono text-slate-300">+{ageFactor.toFixed(1)}</td>
                      <td className="py-2 pr-3 text-right font-mono text-slate-300">+{hazardFactor.toFixed(1)}</td>
                      <td className="py-2 pr-3 text-right font-mono" style={{ color: bandColor[band] }}>{risk}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${health}%`, background: bandColor[band], boxShadow: `0 0 8px ${bandColor[band]}` }} /></div>
                          <span className="w-10 font-mono text-xs text-white">{health}</span>
                          <Chip color={bandColor[band]}>{band}</Chip>
                        </div>
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} className="py-2 pr-3 text-xs italic text-slate-600">not yet built (commissioned {asset.year_built})</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <motion.p variants={panelVariants} className="px-1 text-[11px] leading-relaxed text-slate-600">
        Method: daily ERA5 reanalysis for Sangli ({ds.meta.location.lat}, {ds.meta.location.lon}) and the upper Krishna catchment ({ds.meta.catchment.lat}, {ds.meta.catchment.lon}).
        River level is a linear rainfall–runoff proxy on basin 7-day rainfall ({ds.meta.catchment.weight * 100}% catchment / {100 - ds.meta.catchment.weight * 100}% local), calibrated to the observed Aug-2019 peak of 22.8 m.
        Flood-risk days: &gt; {ds.meta.thresholds.one_day_flood_mm} mm/day, &gt; {ds.meta.thresholds.three_day_flood_mm} mm/3-day or &gt; {ds.meta.thresholds.seven_day_flood_mm} mm/7-day (ERA5-scaled IMD thresholds). Generated {ds.meta.generated}.
      </motion.p>
    </Stagger>
  );
}
