/**
 * Multi-year Sangli climate / flood-risk dataset (2000 → today).
 * Built by ai/training/build_yearly_dataset.py.
 *
 * Loading order: backend API (/api/analytics/years/{y}) → static copy in
 * /public/data/sangli-yearly.json, so the UI works on Vercel without a backend.
 */
import { api } from "./api";
import { INFRASTRUCTURE, TEHSILS } from "../data/sangli-district";
import type { InfrastructureAsset } from "../data/sangli-district";

export type Severity = "catastrophic" | "severe" | "moderate" | "minor";

export interface HydroPoint { date: string; level: number; rain: number; catchment_rain: number; prob: number }
/** [day-of-year, rain mm, temp max °C, flood probability, river level m] */
export type DailyRow = [number, number, number, number, number];

export interface YearRecord {
  year: number;
  partial: boolean;
  days: number;
  rainfall_total_mm: number;
  rainfall_monsoon_mm: number;
  max_1d_rain_mm: number;
  max_1d_rain_date: string;
  max_3d_rain_mm: number;
  max_7d_rain_mm: number;
  rainy_days: number;
  flood_risk_days: number;
  heat_wave_days: number;
  avg_temp_max: number;
  avg_temp_min: number;
  hottest_day_c: number;
  max_wind_kmh: number;
  flood_prob_max: number;
  flood_prob_mean: number;
  river_peak_m: number;
  river_peak_date: string;
  river_warning_days: number;
  river_critical_days: number;
  catchment_rain_mm: number;
  catchment_max_7d_mm: number;
  risk_score: number;
  severity: Severity;
  health_index: number;
  monthly_rain_mm: number[];
  monthly_temp_max: number[];
  hydrograph: HydroPoint[];
  daily: DailyRow[];
}

export interface YearlyMeta {
  location: { name: string; lat: number; lon: number };
  catchment: { name: string; lat: number; lon: number; weight: number };
  source: string;
  generated: string;
  start_year: number;
  end_year: number;
  total_days: number;
  model_scored: boolean;
  thresholds: Record<string, number>;
  risk_formula: string;
  health_formula: string;
  severity_bands: Record<string, string>;
}

export interface YearlyDataset { meta: YearlyMeta; years: YearRecord[] }

let cache: Promise<YearlyDataset> | null = null;

/** Load the whole dataset once (static JSON ~380 KB, cached for the session). */
export function loadYearly(): Promise<YearlyDataset> {
  if (!cache) {
    cache = fetch("/data/sangli-yearly.json")
      .then((r) => { if (!r.ok) throw new Error(`dataset ${r.status}`); return r.json() as Promise<YearlyDataset>; })
      .catch((e) => { cache = null; throw e; });
  }
  return cache;
}

/** Prefer the live backend for one year; fall back to the static dataset. */
export async function loadYear(year: number): Promise<YearRecord> {
  try {
    const r = await api.get<{ year: YearRecord }>(`/api/analytics/years/${year}`, { timeout: 2500 });
    if (r.data?.year) return r.data.year;
  } catch { /* backend offline – use the static copy */ }
  const ds = await loadYearly();
  const y = ds.years.find((x) => x.year === year);
  if (!y) throw new Error(`year ${year} not in dataset`);
  return y;
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  catastrophic: "#ff3b4e",
  severe: "#ff6b3d",
  moderate: "#ffb020",
  minor: "#2ee6a6",
};

export const healthColor = (h: number) => (h < 30 ? "#ff3b4e" : h < 50 ? "#ff6b3d" : h < 75 ? "#ffb020" : "#2ee6a6");

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Day-of-year → "12 Aug" for a given year. */
export const doyLabel = (year: number, doy: number) =>
  new Date(year, 0, doy).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// ─── Infrastructure health for a given year ────────────────────────────────
// Mirrors the backend /api/analytics/risk-engine formula:
//   risk = base(condition) + age factor + hazard exposure · annual risk score

const CONDITION_BASE: Record<InfrastructureAsset["condition"], number> = { good: 10, fair: 25, poor: 45, critical: 65 };
const EXPOSURE: Record<InfrastructureAsset["type"], number> = {
  bridge: 0.40, dam: 0.35, road: 0.30, water_treatment: 0.25, power_station: 0.20, hospital: 0.15, school: 0.10,
};

export interface AssetYearHealth {
  asset: InfrastructureAsset;
  built: boolean;
  age: number;
  ageFactor: number;
  hazardFactor: number;
  risk: number;
  health: number;
  band: "good" | "watch" | "high" | "critical";
}

export function assetHealthForYear(year: YearRecord, assets: InfrastructureAsset[] = INFRASTRUCTURE): AssetYearHealth[] {
  const floodProne = new Set(TEHSILS.filter((t) => t.flood_prone).map((t) => t.name.split(" ")[0]));
  return assets.map((asset) => {
    const built = asset.year_built <= year.year;
    const age = built ? year.year - asset.year_built : 0;
    const ageFactor = Math.min(25, Math.max(0, (age - 10) * 0.5));
    const tehsilMul = floodProne.has(asset.tehsil.split(" ")[0] ?? "") ? 1.0 : 0.6;
    const hazardFactor = +(EXPOSURE[asset.type] * year.risk_score * tehsilMul).toFixed(1);
    const risk = built ? Math.min(100, Math.max(0, CONDITION_BASE[asset.condition] + ageFactor + hazardFactor)) : 0;
    const health = +(100 - risk).toFixed(1);
    const band = health >= 70 ? "good" : health >= 50 ? "watch" : health >= 30 ? "high" : "critical";
    return { asset, built, age, ageFactor, hazardFactor, risk: +risk.toFixed(1), health, band };
  });
}

/** Rule-based narrative for the selected year (shown as the "AI insight" card). */
export function yearInsight(y: YearRecord, all: YearRecord[]): string[] {
  const full = all.filter((x) => !x.partial);
  const avgRain = full.reduce((s, x) => s + x.rainfall_total_mm, 0) / Math.max(1, full.length);
  const pct = Math.round(((y.rainfall_total_mm - avgRain) / avgRain) * 100);
  const rank = [...full].sort((a, b) => b.risk_score - a.risk_score).findIndex((x) => x.year === y.year) + 1;
  const lines: string[] = [];
  lines.push(
    `${y.year}${y.partial ? " (year to date)" : ""} received ${y.rainfall_total_mm.toLocaleString("en-IN")} mm of rainfall, ` +
    `${pct >= 0 ? `${pct}% above` : `${Math.abs(pct)}% below`} the ${full[0]?.year}–${full[full.length - 1]?.year} average of ${Math.round(avgRain)} mm.`
  );
  lines.push(
    `The Krishna gauge at Irwin Bridge is estimated to have peaked at ${y.river_peak_m} m on ${fmtDate(y.river_peak_date)}` +
    (y.river_peak_m >= 18 ? " — above the 18 m danger level." : y.river_peak_m >= 15 ? " — above the 15 m warning level." : ", below the warning level.")
  );
  if (y.flood_risk_days > 0) {
    lines.push(`${y.flood_risk_days} day${y.flood_risk_days > 1 ? "s" : ""} crossed the flood-risk rainfall thresholds; the XGBoost model's peak flood probability was ${(y.flood_prob_max * 100).toFixed(0)}%.`);
  } else {
    lines.push("No day crossed the flood-risk rainfall thresholds; the XGBoost model stayed below its alert level all year.");
  }
  if (y.heat_wave_days > 0) lines.push(`${y.heat_wave_days} heat-wave day${y.heat_wave_days > 1 ? "s" : ""} (≥ 40 °C), hottest ${y.hottest_day_c} °C.`);
  if (rank > 0) lines.push(`Overall hazard rank: #${rank} of ${full.length} years (severity: ${y.severity}).`);
  return lines;
}

/** CSV export of the daily series for one year. */
export function yearToCsv(y: YearRecord): string {
  const head = "date,rain_mm,temp_max_c,flood_probability,river_level_m";
  const rows = y.daily.map(([doy, rain, tmax, prob, level]) => {
    const d = new Date(y.year, 0, doy);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return `${iso},${rain},${tmax},${prob},${level}`;
  });
  return [head, ...rows].join("\n");
}
