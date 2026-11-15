"""
Train the XGBoost Flood-Risk model for Sangli on the full multi-year
Open-Meteo dataset (ai/datasets/weather/sangli_daily.csv).

If the CSV is missing it is downloaded by build_yearly_dataset.fetch_daily().

Run from the project root:
    python ai/training/train_flood_model.py
Outputs:
    ai/models/flood_xgboost.joblib        - {"model", "features", "metrics"}
    ai/evaluation/flood_model_metrics.json - held-out metrics for the report
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_yearly_dataset import (  # noqa: E402
    DAILY_CSV, FEATURES, MODEL_PATH, START_YEAR, END_YEAR, engineer, fetch_daily,
)

ROOT = Path(__file__).resolve().parents[2]
METRICS_PATH = ROOT / "ai" / "evaluation" / "flood_model_metrics.json"


def load_dataset() -> pd.DataFrame:
    if DAILY_CSV.exists():
        print(f"Loading {DAILY_CSV}")
        df = pd.read_csv(DAILY_CSV, parse_dates=["date"])
    else:
        DAILY_CSV.parent.mkdir(parents=True, exist_ok=True)
        df = fetch_daily(START_YEAR, END_YEAR)
        df.to_csv(DAILY_CSV, index=False)
    return engineer(df)


def train_model() -> None:
    df = load_dataset()
    print(f"Dataset: {len(df)} days, {df['year'].min()}-{df['year'].max()}")
    print(f"Flood-risk days: {int(df['flood_risk'].sum())} / {len(df)}")

    X, y = df[FEATURES], df["flood_risk"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        scale_pos_weight=max(1.0, (len(y) - y.sum()) / max(1, y.sum())),
        random_state=42,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    metrics = {
        "train_years": f"{int(df['year'].min())}-{int(df['year'].max())}",
        "n_samples": int(len(df)),
        "n_positive": int(y.sum()),
        "test_size": int(len(y_test)),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
        "f1": round(float(f1_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "feature_importance": {f: round(float(v), 4) for f, v in zip(FEATURES, model.feature_importances_)},
    }
    print("\nEvaluation (held-out 20%):")
    print(classification_report(y_test, y_pred))
    print(json.dumps(metrics, indent=2))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES, "metrics": metrics}, MODEL_PATH)
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"\n[OK] model   -> {MODEL_PATH}")
    print(f"[OK] metrics -> {METRICS_PATH}")


if __name__ == "__main__":
    train_model()
