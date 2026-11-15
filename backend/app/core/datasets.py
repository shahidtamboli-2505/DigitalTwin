"""
Loader for the multi-year Sangli climate / flood-risk dataset produced by
ai/training/build_yearly_dataset.py. Resolved relative to the repository root
so it works no matter which directory uvicorn is started from.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]
AI_DIR = REPO_ROOT / "ai"
YEARLY_JSON = AI_DIR / "datasets" / "weather" / "sangli_yearly.json"
FLOOD_MODEL_PATH = AI_DIR / "models" / "flood_xgboost.joblib"
FLOOD_METRICS_PATH = AI_DIR / "evaluation" / "flood_model_metrics.json"


@lru_cache(maxsize=1)
def load_yearly() -> dict[str, Any] | None:
    """Return the yearly dataset ({"meta", "years"}) or None if it has not been built yet."""
    if not YEARLY_JSON.exists():
        return None
    return json.loads(YEARLY_JSON.read_text(encoding="utf-8"))


def year_summary(y: dict[str, Any]) -> dict[str, Any]:
    """Light-weight version of a year record (no daily series) for list endpoints."""
    return {k: v for k, v in y.items() if k not in ("daily", "hydrograph")}


def load_flood_metrics() -> dict[str, Any] | None:
    if not FLOOD_METRICS_PATH.exists():
        return None
    return json.loads(FLOOD_METRICS_PATH.read_text(encoding="utf-8"))
