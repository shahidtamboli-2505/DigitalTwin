import { motion } from "framer-motion";
import { Brain, TrendingUp, Shield, AlertTriangle, MapPin, CheckCircle2, Target, Waves, Sun, Flame, Building2, Mountain, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import GaugeChart from "../components/charts/GaugeChart";
import { RISK_PREDICTIONS } from "../data/sangli-district";
import { CountUp, Stagger, panelVariants } from "../components/pro/ProUI";

const CATEGORY: Record<string, { icon: LucideIcon; color: string }> = {
  flood: { icon: Waves, color: "#38bdf8" },
  drought: { icon: Sun, color: "#ffb020" },
  heat_wave: { icon: Flame, color: "#ff3b4e" },
  infrastructure_failure: { icon: Building2, color: "#a78bfa" },
  landslide: { icon: Mountain, color: "#fb923c" },
};
const sevColor = (s: string) => (s === "catastrophic" ? "#ff3b4e" : s === "severe" ? "#ff6b3d" : s === "moderate" ? "#ffb020" : "#2ee6a6");

export default function AIPredictions() {
  const preds = [...RISK_PREDICTIONS].sort((a, b) => b.probability - a.probability);
  const avgConf = (preds.reduce((s, p) => s + p.confidence, 0) / preds.length) * 100;
  const summary = [
    { icon: Target, v: preds.length, s: "", l: "Active scenarios" },
    { icon: TrendingUp, v: avgConf, s: "%", l: "Avg confidence" },
    { icon: AlertTriangle, v: preds.filter((p) => p.probability >= 0.5).length, s: "", l: "High probability" },
    { icon: Shield, v: preds.reduce((s, p) => s + p.affected_tehsils.length, 0), s: "", l: "Tehsil exposures" },
  ];

  return (
    <Stagger className="relative z-[1] space-y-4">
      <motion.div variants={panelVariants} className="glass flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/30"><Brain size={20} /></span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold text-white">AI Risk Prediction Engine</h2>
          <p className="text-sm text-slate-400">Multi-hazard scenario outlook for Sangli District</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
          <Info size={13} /> Illustrative scenarios · RF/XGBoost models in progress
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <motion.div key={s.l} variants={panelVariants} className="glass glass-hover flex items-center gap-3 p-4">
            <s.icon size={18} className="text-cyan-300" />
            <div>
              <div className="font-display text-2xl font-bold text-white"><CountUp value={s.v} suffix={s.s} /></div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">{s.l}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {preds.map((p) => {
          const cfg = CATEGORY[p.category] ?? { icon: AlertTriangle, color: "#94a3b8" };
          const Icon = cfg.icon;
          return (
            <motion.article key={p.id} variants={panelVariants} className="glass glass-hover overflow-hidden p-5">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize" style={{ background: `${cfg.color}1a`, color: cfg.color }}>
                  <Icon size={14} /> {p.category.replace(/_/g, " ")}
                </span>
                <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-300">{p.timeframe}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-white">{p.title}</h3>

              <div className="mt-3 flex justify-around">
                <GaugeChart value={p.probability} label="Probability" size={110} color={cfg.color} />
                <GaugeChart value={p.confidence} label="Confidence" size={110} />
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                Severity if occurs
                <span className="rounded px-1.5 py-0.5 font-semibold uppercase" style={{ background: `${sevColor(p.severity_if_occurs)}22`, color: sevColor(p.severity_if_occurs) }}>{p.severity_if_occurs}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <MapPin size={13} className="text-slate-500" />
                {p.affected_tehsils.map((t) => <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 ring-1 ring-white/5">{t}</span>)}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><AlertTriangle size={12} /> Key factors</h4>
                  <ul className="space-y-1 text-xs text-slate-300">{p.key_factors.map((f, i) => <li key={i} className="flex gap-1.5"><span style={{ color: cfg.color }}>›</span>{f}</li>)}</ul>
                </div>
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><CheckCircle2 size={12} /> Actions</h4>
                  <ul className="space-y-1 text-xs text-slate-300">{p.recommended_actions.map((a, i) => <li key={i} className="flex gap-1.5"><span className="text-emerald-400">✓</span>{a}</li>)}</ul>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </Stagger>
  );
}
