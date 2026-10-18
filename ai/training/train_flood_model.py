"""
Train XGBoost Flood Risk Prediction Model using real Open-Meteo historical climate data for Sangli.
"""

import os
import sys
import json
import httpx
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier

# Sangli District Coordinates
SANGLI_LAT = 16.8524
SANGLI_LON = 74.5815

def fetch_open_meteo_data():
    """Fetch daily historical climate data for Sangli from Open-Meteo API (2018 to 2023)."""
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={SANGLI_LAT}&longitude={SANGLI_LON}&"
        f"start_date=2018-01-01&end_date=2023-12-31&"
        f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max&"
        f"timezone=Asia%2FKolkata"
    )
    print(f"Fetching Open-Meteo climate dataset from: {url}...")
    with httpx.Client(timeout=30.0) as client:
        res = client.get(url)
        res.raise_for_status()
        data = res.json()

    daily = data["daily"]
    df = pd.DataFrame({
        "date": daily["time"],
        "temp_max": daily["temperature_2m_max"],
        "temp_min": daily["temperature_2m_min"],
        "precipitation": daily["precipitation_sum"],
        "rain": daily["rain_sum"],
        "wind_speed": daily["wind_speed_10m_max"],
    })
    return df


def preprocess_and_engineer_features(df: pd.DataFrame):
    """Engineers rolling rainfall features (3-day, 7-day cumulative) and defines flood risk target."""
    df["precipitation"] = df["precipitation"].fillna(0.0)
    df["rain"] = df["rain"].fillna(0.0)
    df["temp_max"] = df["temp_max"].fillna(30.0)
    df["wind_speed"] = df["wind_speed"].fillna(10.0)

    # Feature engineering: rolling cumulative rainfall
    df["rain_3d_sum"] = df["precipitation"].rolling(window=3, min_periods=1).sum()
    df["rain_7d_sum"] = df["precipitation"].rolling(window=7, min_periods=1).sum()
    df["temp_range"] = df["temp_max"] - df["temp_min"]

    # Target labeling based on Sangli hydrological thresholds:
    # High Flood Risk (1) if 1-day precip > 75mm OR 3-day accum precip > 140mm
    df["flood_risk"] = ((df["precipitation"] > 75.0) | (df["rain_3d_sum"] > 140.0)).astype(int)

    return df


def train_model():
    df = fetch_open_meteo_data()
    df = preprocess_and_engineer_features(df)

    print(f"Dataset shape: {df.shape}")
    print(f"Flood risk events count: {df['flood_risk'].sum()} / {len(df)}")

    features = ["temp_max", "temp_min", "precipitation", "rain_3d_sum", "rain_7d_sum", "wind_speed", "temp_range"]
    X = df[features]
    y = df["flood_risk"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=max(1, (len(y) - y.sum()) / max(1, y.sum())), # Handle class imbalance
        random_state=42,
        eval_metric="logloss"
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\nModel Evaluation Report:")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

    # Save model and feature list
    output_dir = "ai/models"
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "flood_xgboost.joblib")
    joblib.dump({"model": model, "features": features}, model_path)
    print(f"\n✅ Flood risk model successfully saved to: {model_path}")

if __name__ == "__main__":
    train_model()
