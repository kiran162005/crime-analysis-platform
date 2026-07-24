"""
Anomaly detection — Isolation Forest over per-incident features.
Flags incidents that deviate from the normal pattern for their
district/crime-type/time-of-day combination, e.g. a crime type that
almost never occurs in a given district suddenly appearing, or an
incident at a highly unusual hour for that crime type.

Usage: python anomaly_detection.py
Output: prints flagged anomalies, saves anomalies.csv
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def load_data(path="../../ml-training/synthetic-data-gen/output/CaseMaster.csv"):
    df = pd.read_csv(path, parse_dates=["IncidentFromDate"])
    df["hour"] = df["IncidentFromDate"].dt.hour
    df["day_of_week"] = df["IncidentFromDate"].dt.dayofweek
    return df

def build_features(df):
    """
    Features describe each incident relative to its own district+crime-type
    context, not just raw values — this is what lets Isolation Forest catch
    "wrong place/wrong time" patterns rather than just rare crime types
    in general.
    """
    # How common is this crime type in this district overall? (rare
    # combinations are inherently more suspicious)
    district_crime_freq = df.groupby(["DistrictID", "CrimeMinorHeadID"]).size()
    total_per_district = df.groupby("DistrictID").size()
    df["district_crime_share"] = df.apply(
        lambda r: district_crime_freq.get((r["DistrictID"], r["CrimeMinorHeadID"]), 0)
                  / total_per_district.get(r["DistrictID"], 1),
        axis=1
    )

    # How typical is this hour for this specific crime type overall?
    crime_hour_mean = df.groupby("CrimeMinorHeadID")["hour"].transform("mean")
    crime_hour_std = df.groupby("CrimeMinorHeadID")["hour"].transform("std").replace(0, 1)
    df["hour_deviation"] = (df["hour"] - crime_hour_mean).abs() / crime_hour_std

    features = df[["district_crime_share", "hour_deviation", "hour", "day_of_week", "GravityOffenceID"]].copy()
    return df, features

def detect_anomalies(df, features, contamination=0.02):
    """
    contamination=0.02 means we expect ~2% of incidents to be flagged as
    anomalies — tune this based on how many alerts is actually useful for
    investigators (too high = alert fatigue, too low = misses real cases).
    """
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    iso = IsolationForest(contamination=contamination, random_state=42, n_estimators=200)
    df["anomaly_score"] = iso.fit_predict(scaled)  # -1 = anomaly, 1 = normal
    df["anomaly_raw_score"] = iso.decision_function(scaled)  # lower = more anomalous

    return df

if __name__ == "__main__":
    df = load_data()
    df, features = build_features(df)
    df = detect_anomalies(df, features)

    anomalies = df[df["anomaly_score"] == -1].sort_values("anomaly_raw_score")

    print(f"Total incidents: {len(df)}")
    print(f"Flagged anomalies: {len(anomalies)} ({len(anomalies)/len(df)*100:.2f}%)")
    print(f"\nTop 15 most anomalous incidents:")
    print(anomalies[[
        "CaseMasterID", "DistrictID", "CrimeMinorHeadID", "hour",
        "district_crime_share", "hour_deviation", "anomaly_raw_score"
    ]].head(15).to_string(index=False))

    anomalies.to_csv("anomalies.csv", index=False)
    print(f"\nSaved {len(anomalies)} flagged anomalies to anomalies.csv")