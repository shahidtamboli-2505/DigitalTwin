"""
Build the multi-year Sangli climate & flood-risk dataset.

1. Downloads daily weather for Sangli (Open-Meteo ERA5 archive) for START_YEAR..END_YEAR
   and stores it as ai/datasets/weather/sangli_daily.csv
2. Engineers rolling-rainfall features (same as the flood model)
3. Scores every day with the trained XGBoost flood model (if available)
4. Aggregates a per-year summary (rainfall, flood-risk days, heat days,
   estimated Krishna river level, district health index, monthly rainfall,
   peak-monsoon hydrograph) into ai/datasets/weather/sangli_yearly.json
5. Copies the JSON to frontend/public/data/sangli-yearly.json so the UI works
   even without the backend (Vercel static deploy).

Run from the project root:
    python ai/training/build_yearly_dataset.py
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import httpx
import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT / "ai" / "datasets" / "weather"
DAILY_CSV = DATASET_DIR / "sangli_daily.csv"
YEARLY_JSON = DATASET_DIR / "sangli_yearly.json"
FRONTEND_JSON = ROOT / "frontend" / "public" / "data" / "sangli-yearly.json"
MODEL_PATH = ROOT / "ai" / "models" / "flood_xgboost.joblib"

SANGLI_LAT = 16.8524
SANGLI_LON = 74.5815
START_YEAR = 2000
END_YEAR = date.today().year  # current (partial) year is included and flagged

# Upstream Krishna catchment (Mahabaleshwar / Koyna, Western Ghats). Sangli floods are
# driven by Ghat rainfall + Koyna/Warna releases, not by local rain alone.
CATCHMENT_LAT = 17.92
CATCHMENT_LON = 73.66
CATCHMENT_WEIGHT = 0.65     # share of catchment rain in the river-level model

# Flood-day labelling thresholds. ERA5 reanalysis is a smoothed 0.25° grid, so the
# IMD station thresholds (64.5 mm "heavy", 115.6 mm "very heavy") are scaled down to the
# ≈99th percentile of this dataset (see flood_model_metrics.json for the label counts).
ONE_DAY_FLOOD_MM = 35.0
THREE_DAY_FLOOD_MM = 70.0
SEVEN_DAY_FLOOD_MM = 130.0
HEAT_WAVE_C = 40.0
RIVER_BASE_M = 9.5          # Krishna @ Irwin Bridge dry-season gauge
RIVER_WARN_M = 15.0
RIVER_CRIT_M = 18.0
RIVER_PEAK_2019_M = 22.8    # observed Aug-2019 peak used to calibrate the gauge model

FEATURES = ["temp_max", "temp_min", "precipitation", "rain_3d_sum", "rain_7d_sum", "wind_speed", "temp_range"]


# ──────────────────────────────────────────────────────────────────────────
# 1. Download
# ──────────────────────────────────────────────────────────────────────────
def _get_json(client: httpx.Client, url: str) -> dict:
    for attempt in range(4):
        res = client.get(url)
        if res.status_code == 429:          # free-tier rate limit: back off and retry
            time.sleep(10 * (attempt + 1))
            continue
        res.raise_for_status()
        return res.json()["daily"]
    raise RuntimeError("Open-Meteo rate limit: retry in a few minutes")


def _get_range(client: httpx.Client, start_date: str, end_date: str) -> pd.DataFrame:
    base = "https://archive-api.open-meteo.com/v1/archive?"
    local = _get_json(client, base +
        f"latitude={SANGLI_LAT}&longitude={SANGLI_LON}&start_date={start_date}&end_date={end_date}&"
        "daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max&timezone=Asia%2FKolkata")
    time.sleep(2)
    upstream = _get_json(client, base +
        f"latitude={CATCHMENT_LAT}&longitude={CATCHMENT_LON}&start_date={start_date}&end_date={end_date}&"
        "daily=precipitation_sum&timezone=Asia%2FKolkata")
    return pd.DataFrame({
        "date": local["time"],
        "temp_max": local["temperature_2m_max"],
        "temp_min": local["temperature_2m_min"],
        "precipitation": local["precipitation_sum"],
        "rain": local["rain_sum"],
        "wind_speed": local["wind_speed_10m_max"],
        "catchment_precip": upstream["precipitation_sum"],
    })


def fetch_daily(start: int, end: int) -> pd.DataFrame:
    """
    Fetch daily ERA5 reanalysis for Sangli.
    Full years are fetched in ONE request (Open-Meteo allows multi-year ranges);
    the current year is fetched separately because the archive lags ~1 week and
    may not be available yet - it is skipped if the API refuses it.
    """
    today = date.today()
    last_full = min(end, today.year - 1)
    frames: list[pd.DataFrame] = []
    with httpx.Client(timeout=120.0) as client:
        print(f"  [{start}-{last_full}] ...", end=" ", flush=True)
        frames.append(_get_range(client, f"{start}-01-01", f"{last_full}-12-31"))
        print(f"{len(frames[-1])} days")
        if end >= today.year:
            end_date = (today - timedelta(days=7)).isoformat()
            print(f"  [{today.year} partial to {end_date}] ...", end=" ", flush=True)
            try:
                frames.append(_get_range(client, f"{today.year}-01-01", end_date))
                print(f"{len(frames[-1])} days")
            except httpx.HTTPStatusError as e:
                print(f"skipped ({e.response.status_code})")
    df = pd.concat(frames, ignore_index=True)
    df["date"] = pd.to_datetime(df["date"])
    df = df.dropna(subset=["temp_max", "precipitation"], how="all")
    return df


# ──────────────────────────────────────────────────────────────────────────
# 2. Features (identical to train_flood_model.py)
# ──────────────────────────────────────────────────────────────────────────
def engineer(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("date").reset_index(drop=True)
    df["precipitation"] = df["precipitation"].fillna(0.0)
    df["rain"] = df["rain"].fillna(0.0)
    df["temp_max"] = df["temp_max"].ffill().fillna(30.0)
    df["temp_min"] = df["temp_min"].ffill().fillna(20.0)
    df["wind_speed"] = df["wind_speed"].ffill().fillna(10.0)
    if "catchment_precip" not in df.columns:
        df["catchment_precip"] = df["precipitation"]
    df["catchment_precip"] = df["catchment_precip"].fillna(0.0)
    df["rain_3d_sum"] = df["precipitation"].rolling(3, min_periods=1).sum()
    df["rain_7d_sum"] = df["precipitation"].rolling(7, min_periods=1).sum()
    df["temp_range"] = df["temp_max"] - df["temp_min"]
    # basin rainfall that actually drives the Krishna gauge at Sangli
    df["basin_rain"] = CATCHMENT_WEIGHT * df["catchment_precip"] + (1 - CATCHMENT_WEIGHT) * df["precipitation"]
    df["basin_7d_sum"] = df["basin_rain"].rolling(7, min_periods=1).sum()
    df["flood_risk"] = (
        (df["precipitation"] > ONE_DAY_FLOOD_MM)
        | (df["rain_3d_sum"] > THREE_DAY_FLOOD_MM)
        | (df["rain_7d_sum"] > SEVEN_DAY_FLOOD_MM)
    ).astype(int)
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    return df


# ──────────────────────────────────────────────────────────────────────────
# 3. Model scoring
# ──────────────────────────────────────────────────────────────────────────
def score_with_model(df: pd.DataFrame) -> tuple[pd.DataFrame, bool]:
    if not MODEL_PATH.exists():
        print("  [WARN] flood model not found — using rule-based probability")
        # smooth rule-based proxy so the UI still has a curve
        p = np.clip(df["rain_3d_sum"] / (THREE_DAY_FLOOD_MM * 1.4), 0, 1) ** 1.5
        df["flood_prob"] = p.round(4)
        return df, False
    bundle = joblib.load(MODEL_PATH)
    model, feats = bundle["model"], bundle["features"]
    df["flood_prob"] = model.predict_proba(df[feats])[:, 1].round(4)
    return df, True


# ──────────────────────────────────────────────────────────────────────────
# 4. Yearly aggregation
# ──────────────────────────────────────────────────────────────────────────
def river_scale(df: pd.DataFrame) -> float:
    """Calibrate the gauge model so the Aug-2019 basin 7-day rainfall peak maps to the observed 22.8 m."""
    peak_2019 = df.loc[df["year"] == 2019, "basin_7d_sum"].max()
    if not peak_2019 or np.isnan(peak_2019):
        return 0.04
    return (RIVER_PEAK_2019_M - RIVER_BASE_M) / float(peak_2019)


def est_river_level(basin_7d: pd.Series, k: float) -> pd.Series:
    """Linear rainfall-runoff proxy: gauge = base + k · basin 7-day rainfall (clipped to 26 m)."""
    return (RIVER_BASE_M + k * basin_7d).clip(RIVER_BASE_M, 26.0).round(2)


def year_risk(peak_level: float, flood_days: int, max_prob: float, heat_days: int) -> float:
    """
    Composite annual hazard score 0-100 (documented in the report):
        50 · river component  (peak gauge 12 m -> 0, 24 m -> 1)
      + 25 · flood-day component (capped at 10 days)
      + 15 · max XGBoost flood probability
      + 10 · heat component (capped at 30 days ≥ 40 °C)
    Health index = 100 − risk.
    """
    river = np.clip((peak_level - 12.0) / 12.0, 0, 1)
    flood = min(flood_days, 10) / 10
    heat = min(heat_days, 30) / 30
    return float(round(50 * river + 25 * flood + 15 * max_prob + 10 * heat, 1))


def severity(risk: float) -> str:
    return "catastrophic" if risk >= 60 else "severe" if risk >= 45 else "moderate" if risk >= 25 else "minor"


def build_yearly(df: pd.DataFrame, model_used: bool) -> dict:
    k = river_scale(df)
    df["river_level"] = est_river_level(df["basin_7d_sum"], k)
    today = date.today()
    years = []
    for year, g in df.groupby("year"):
        g = g.reset_index(drop=True)
        monthly = g.groupby("month")["precipitation"].sum().reindex(range(1, 13), fill_value=0.0).round(1).tolist()
        monthly_tmax = g.groupby("month")["temp_max"].mean().reindex(range(1, 13)).round(1).fillna(0).tolist()
        monsoon = g[g["month"].between(6, 9)]
        peak_idx = int(g["river_level"].idxmax())
        lo, hi = max(0, peak_idx - 7), min(len(g) - 1, peak_idx + 7)
        hydro = g.loc[lo:hi, ["date", "river_level", "precipitation", "catchment_precip", "flood_prob"]]
        flood_days = int(g["flood_risk"].sum())
        heat_days = int((g["temp_max"] >= HEAT_WAVE_C).sum())
        crit_days = int((g["river_level"] >= RIVER_CRIT_M).sum())
        warn_days = int((g["river_level"] >= RIVER_WARN_M).sum())
        max_prob = float(g["flood_prob"].max())
        peak_level = float(g["river_level"].max())
        peak_day = g.loc[int(g["precipitation"].idxmax())]
        risk = year_risk(peak_level, flood_days, max_prob, heat_days)
        years.append({
            "year": int(year),
            "partial": bool(year == today.year),
            "days": int(len(g)),
            "rainfall_total_mm": round(float(g["precipitation"].sum()), 1),
            "rainfall_monsoon_mm": round(float(monsoon["precipitation"].sum()), 1),
            "max_1d_rain_mm": round(float(g["precipitation"].max()), 1),
            "max_1d_rain_date": peak_day["date"].strftime("%Y-%m-%d"),
            "max_3d_rain_mm": round(float(g["rain_3d_sum"].max()), 1),
            "max_7d_rain_mm": round(float(g["rain_7d_sum"].max()), 1),
            "rainy_days": int((g["precipitation"] >= 2.5).sum()),
            "flood_risk_days": flood_days,
            "heat_wave_days": heat_days,
            "avg_temp_max": round(float(g["temp_max"].mean()), 1),
            "avg_temp_min": round(float(g["temp_min"].mean()), 1),
            "hottest_day_c": round(float(g["temp_max"].max()), 1),
            "max_wind_kmh": round(float(g["wind_speed"].max()), 1),
            "flood_prob_max": round(max_prob, 3),
            "flood_prob_mean": round(float(g["flood_prob"].mean()), 4),
            "river_peak_m": round(peak_level, 2),
            "river_peak_date": g.loc[int(g["river_level"].idxmax()), "date"].strftime("%Y-%m-%d"),
            "river_warning_days": warn_days,
            "river_critical_days": crit_days,
            "catchment_rain_mm": round(float(g["catchment_precip"].sum()), 1),
            "catchment_max_7d_mm": round(float(g["catchment_precip"].rolling(7, min_periods=1).sum().max()), 1),
            "risk_score": risk,
            "severity": severity(risk),
            "health_index": round(100 - risk, 1),
            "monthly_rain_mm": monthly,
            "monthly_temp_max": monthly_tmax,
            "hydrograph": [
                {"date": r.date.strftime("%Y-%m-%d"), "level": float(r.river_level),
                 "rain": round(float(r.precipitation), 1), "catchment_rain": round(float(r.catchment_precip), 1),
                 "prob": float(r.flood_prob)}
                for r in hydro.itertuples()
            ],
            # compact daily series for the timeline chart: [doy, rain, tmax, prob, level]
            "daily": [
                [int(r.date.timetuple().tm_yday), round(float(r.precipitation), 1), round(float(r.temp_max), 1),
                 float(r.flood_prob), float(r.river_level)]
                for r in g.itertuples()
            ],
        })

    return {
        "meta": {
            "location": {"name": "Sangli, Maharashtra", "lat": SANGLI_LAT, "lon": SANGLI_LON},
            "catchment": {"name": "Krishna upper catchment (Mahabaleshwar / Koyna)", "lat": CATCHMENT_LAT, "lon": CATCHMENT_LON, "weight": CATCHMENT_WEIGHT},
            "source": "Open-Meteo ERA5 reanalysis (archive-api.open-meteo.com)",
            "generated": date.today().isoformat(),
            "start_year": int(df["year"].min()),
            "end_year": int(df["year"].max()),
            "total_days": int(len(df)),
            "model_scored": model_used,
            "thresholds": {
                "one_day_flood_mm": ONE_DAY_FLOOD_MM, "three_day_flood_mm": THREE_DAY_FLOOD_MM,
                "seven_day_flood_mm": SEVEN_DAY_FLOOD_MM,
                "heat_wave_c": HEAT_WAVE_C, "river_base_m": RIVER_BASE_M,
                "river_warning_m": RIVER_WARN_M, "river_critical_m": RIVER_CRIT_M,
                "river_scale_m_per_mm7d": round(k, 5),
            },
            "risk_formula": "risk = 50*clip((river_peak-12)/12) + 25*min(flood_days,10)/10 + 15*max_flood_prob + 10*min(heat_days,30)/30",
            "health_formula": "health_index = 100 - risk",
            "severity_bands": {"catastrophic": ">=60", "severe": ">=45", "moderate": ">=25", "minor": "<25"},
        },
        "years": years,
    }


# ──────────────────────────────────────────────────────────────────────────
def main() -> None:
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    refresh = "--refresh" in sys.argv or not DAILY_CSV.exists()
    if refresh:
        print(f"Downloading Sangli daily climate {START_YEAR}-{END_YEAR} ...")
        df = fetch_daily(START_YEAR, END_YEAR)
        df.to_csv(DAILY_CSV, index=False)
        print(f"[OK] saved {DAILY_CSV} ({len(df)} rows)")
    else:
        df = pd.read_csv(DAILY_CSV, parse_dates=["date"])
        print(f"Loaded cached {DAILY_CSV} ({len(df)} rows). Use --refresh to re-download.")

    df = engineer(df)
    df, model_used = score_with_model(df)
    out = build_yearly(df, model_used)

    YEARLY_JSON.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    FRONTEND_JSON.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(YEARLY_JSON, FRONTEND_JSON)
    print(f"[OK] yearly summary -> {YEARLY_JSON}  ({YEARLY_JSON.stat().st_size // 1024} KB)")
    print(f"[OK] copied        -> {FRONTEND_JSON}")

    print("\nYear  Rain(mm)  FloodDays  Peak(m)  Health  Severity")
    for y in out["years"]:
        print(f"{y["year"]}  {y["rainfall_total_mm"]:8.1f}  {y["flood_risk_days"]:9d}  {y["river_peak_m"]:7.2f}  {y["health_index"]:6.1f}  {y["severity"]}")


if __name__ == "__main__":
    main()
