import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Activity, Box, Camera, Eye, Flame, Play, Radar, Waves, AlertTriangle } from "lucide-react";
import { useTwinStore, statusOf } from "./useTwinStore";
import type { ViewMode } from "./useTwinStore";
import { ASSETS, healthColor, FLOOD_2019 } from "./twinData";

const glass = "rounded-xl border border-cyan-400/25 bg-slate-950/70 backdrop-blur-md shadow-[0_0_24px_rgba(34,211,238,0.12)]";

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-cyan-300">{now.toLocaleTimeString("en-IN")}</span>;
}

function Spark({ data, color }: { data: number[]; color: string }) {
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer>
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <YAxis hide domain={["auto", "auto"]} />
          <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TwinHUD() {
  const { mode, setMode, setCamera, cameraTarget, selected, sensors, history, replayIndex, startReplay } = useTwinStore();
  const asset = ASSETS.find((a) => a.id === selected) ?? ASSETS[0];
  const shs = 100 - asset.risk; // Structural Health Score
  const krishna = sensors.find((s) => s.id === "krishna-irwin")!;
  const alerts = [
    ...sensors.filter((s) => statusOf(s) !== "online").map((s) => ({
      sev: statusOf(s), text: `${s.name}: ${s.value} ${s.unit} (warning ${s.warning})`,
    })),
    { sev: "critical", text: "Crack finding (demo): Span 4 pier, Irwin Bridge" },
    ...(krishna.value >= 21 ? [{ sev: "critical", text: "Krishna overtopping banks — evacuation advisory" }] : []),
  ];

  const modes: { id: ViewMode; label: string; icon: typeof Eye }[] = [
    { id: "realistic", label: "Realistic", icon: Eye },
    { id: "hologram", label: "Hologram", icon: Radar },
    { id: "stress", label: "Health map", icon: Flame },
  ];
  const cams = ["overview", "bridge", "underside", "dam", "city"];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 text-slate-100">
      {/* top bar */}
      <div className={`${glass} pointer-events-auto flex flex-wrap items-center gap-3 px-4 py-2`}>
        <Box className="h-5 w-5 text-cyan-300" />
        <div className="font-semibold tracking-[0.2em] text-cyan-200">SANGLI DIGITAL TWIN</div>
        <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE (simulated)
        </span>
        <Clock />
        <div className="ml-auto flex flex-wrap gap-1">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs transition ${mode === m.id ? "bg-cyan-400 text-slate-950" : "bg-white/5 hover:bg-white/10"}`}>
              <m.icon className="h-3.5 w-3.5" />{m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-1 justify-between gap-3 overflow-hidden">
        {/* left: asset health */}
        <div className={`${glass} pointer-events-auto w-80 self-start p-4`}>
          <div className="text-[11px] uppercase tracking-widest text-cyan-400">Selected asset</div>
          <div className="mt-1 text-lg font-semibold">{asset.name}</div>
          <div className="text-xs text-slate-400">{asset.tehsil} tehsil · built {asset.built} · condition {asset.condition}</div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={healthColor(asset.risk)} strokeWidth="3"
                  strokeDasharray={`${shs} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{shs}</span><span className="text-[9px] text-slate-400">SHS</span>
              </div>
            </div>
            <div className="text-sm">
              <div>Risk score <b style={{ color: healthColor(asset.risk) }}>{asset.risk}</b>/100</div>
              <div className="text-xs text-slate-400">Structural Health Score = 100 − risk</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {sensors.filter((s) => asset.sensors.includes(s.id)).map((s) => {
              const st = statusOf(s);
              const col = st === "online" ? "#2ee6a6" : st === "warning" ? "#ffb020" : "#ff3b4e";
              return (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <div className="text-xs text-slate-300">{s.name}</div>
                    <div className="font-mono text-sm" style={{ color: col }}>{s.value} {s.unit}</div>
                  </div>
                  <Spark data={history[s.id] ?? []} color={col} />
                </div>
              );
            })}
            {asset.sensors.length === 0 && <div className="text-xs text-slate-500">No sensors installed (Phase II)</div>}
          </div>
          <div className="mt-3 text-[10px] text-slate-500">Click any structure in the scene to inspect it.</div>
        </div>

        {/* right: alerts + flood */}
        <div className="flex w-80 flex-col gap-3 self-start">
          <div className={`${glass} pointer-events-auto p-4`}>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Live alerts
            </div>
            <div className="space-y-1.5">
              {alerts.map((a, i) => (
                <div key={i} className={`rounded-md border-l-2 bg-white/5 px-2 py-1.5 text-xs ${a.sev === "critical" ? "border-red-500" : "border-amber-400"}`}>{a.text}</div>
              ))}
            </div>
          </div>
          <div className={`${glass} pointer-events-auto p-4`}>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-400">
              <Waves className="h-3.5 w-3.5" /> Krishna @ Irwin Bridge
            </div>
            <div className="font-mono text-3xl" style={{ color: krishna.value >= 18 ? "#ff3b4e" : krishna.value >= 15 ? "#ffb020" : "#67e8f9" }}>
              {krishna.value.toFixed(1)} m
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800">
              <div className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500 transition-all" style={{ width: `${Math.min(100, (krishna.value / 24) * 100)}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>warn 15 m</span><span>crit 18 m</span><span>2019: 22.8 m</span></div>
            <button onClick={startReplay} disabled={replayIndex !== null}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-red-500/80 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-60">
              <Play className="h-4 w-4" />
              {replayIndex === null ? "Replay 2019 flood" : `Replaying… day ${replayIndex + 1}/${FLOOD_2019.length}`}
            </button>
          </div>
        </div>
      </div>

      {/* bottom: camera presets + legend */}
      <div className={`${glass} pointer-events-auto mt-3 flex flex-wrap items-center gap-2 self-center px-3 py-2`}>
        <Camera className="h-4 w-4 text-cyan-300" />
        {cams.map((c) => (
          <button key={c} onClick={() => setCamera(c)}
            className={`rounded px-3 py-1 text-xs capitalize ${cameraTarget === c ? "bg-cyan-400 text-slate-950" : "bg-white/5 hover:bg-white/10"}`}>{c}</button>
        ))}
        <span className="mx-2 h-4 w-px bg-white/20" />
        <Activity className="h-4 w-4 text-cyan-300" />
        {[["Good", "#2ee6a6"], ["Watch", "#ffe066"], ["High", "#ffb020"], ["Critical", "#ff3b4e"]].map(([l, c]) => (
          <span key={l} className="flex items-center gap-1 text-[11px]"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}</span>
        ))}
      </div>
    </div>
  );
}
