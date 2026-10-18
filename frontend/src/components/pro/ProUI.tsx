import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, animate, useInView } from "framer-motion";

/** Number that counts up when it scrolls into view. */
export function CountUp({ value, decimals = 0, suffix = "", duration = 1.4 }: { value: number; decimals?: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, value, duration]);
  return <span ref={ref}>{v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/** Container that staggers its <Panel> children in. */
export function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}>
      {children}
    </motion.div>
  );
}

export const panelVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Glass panel with optional header. */
export function Panel({ title, kicker, action, children, className = "", hover = true }: {
  title?: string; kicker?: string; action?: ReactNode; children: ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <motion.section variants={panelVariants} className={`glass ${hover ? "glass-hover" : ""} p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {kicker && <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80">{kicker}</div>}
            {title && <h3 className="font-display text-[15px] font-semibold text-white">{title}</h3>}
          </div>
          {action}
        </header>
      )}
      {children}
    </motion.section>
  );
}

/** Animated radial gauge (0-100). */
export function Ring({ value, color, size = 132, label }: { value: number; color: string; size?: number; label?: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="-rotate-90" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(120,180,255,0.1)" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(120,180,255,0.06)" strokeWidth="1" strokeDasharray="2 4" transform="scale(1.12) translate(-6.4 -6.4)" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-bold text-white"><CountUp value={value} decimals={1} /></div>
          {label && <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>}
        </div>
      </div>
    </div>
  );
}

export const chartTooltip = {
  backgroundColor: "rgba(8,14,28,0.95)",
  border: "1px solid rgba(34,211,238,0.3)",
  borderRadius: 10,
  color: "#e6f1ff",
  fontSize: 12,
  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)",
};
export const axisTick = { fill: "#5c6f8e", fontSize: 11 };
