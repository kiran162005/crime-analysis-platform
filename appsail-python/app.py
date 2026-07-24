from flask import Flask, request, jsonify
import os
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)


@app.route('/')
def index():
    return 'Crime Analytics ML Service — Flask on Catalyst AppSail'


@app.route('/hotspots', methods=['POST'])
def detect_hotspots():
    """
    POST a JSON body: {"incidents": [{"CaseMasterID":.., "latitude":.., "longitude":..,
    "IncidentFromDate":.., "CrimeMinorHeadID":..}, ...]}

    Returns detected hotspot clusters above a minimum size threshold, with
    centroid, dominant crime type, and average hour — ready for the frontend
    map layer.
    """
    body = request.get_json(force=True)
    if not body or "incidents" not in body:
        return jsonify({"error": "Expected JSON body with an 'incidents' array"}), 400

    df = pd.DataFrame(body["incidents"])
    if df.empty:
        return jsonify({"hotspots": [], "noise_count": 0, "total": 0})

    required_cols = {"latitude", "longitude", "IncidentFromDate", "CrimeMinorHeadID"}
    missing = required_cols - set(df.columns)
    if missing:
        return jsonify({"error": f"Missing required fields: {sorted(missing)}"}), 400

    df["IncidentFromDate"] = pd.to_datetime(df["IncidentFromDate"])
    df["hour"] = df["IncidentFromDate"].dt.hour

    min_cluster_size = int(request.args.get("min_size", 500))
    eps = float(request.args.get("eps", 0.6))
    min_samples = int(request.args.get("min_samples", 25))

    features = df[["latitude", "longitude", "hour"]].copy()
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    crime_dummies = pd.get_dummies(df["CrimeMinorHeadID"], prefix="crime").values.astype(float)
    crime_dummies *= 2.5  # weight crime type up so co-located, adjacent-hour
                          # hotspots of different crime types don't merge —
                          # see the Bengaluru chain-snatching/cyber-fraud case

    combined = np.hstack([scaled, crime_dummies])
    db = DBSCAN(eps=eps, min_samples=min_samples).fit(combined)
    df["cluster"] = db.labels_

    noise_count = int((df["cluster"] == -1).sum())
    clustered = df[df["cluster"] != -1]

    hotspots = []
    if not clustered.empty:
        grouped = clustered.groupby("cluster")
        for cluster_id, group in grouped:
            if len(group) < min_cluster_size:
                continue  # filter out small background clusters — not real hotspots
            hotspots.append({
                "cluster_id": int(cluster_id),
                "size": int(len(group)),
                "centroid_lat": round(float(group["latitude"].mean()), 6),
                "centroid_lon": round(float(group["longitude"].mean()), 6),
                "avg_hour": round(float(group["hour"].mean()), 1),
                "top_district": int(group["DistrictID"].mode()[0]) if "DistrictID" in group else None,
                "top_crime_subhead": int(group["CrimeMinorHeadID"].mode()[0]),
                # Sample only — don't ship every case_id in the payload, the
                # frontend can query incidents for a district/time range
                # separately if it needs the full list (e.g. on marker click).
                "sample_case_ids": group["CaseMasterID"].tolist()[:20] if "CaseMasterID" in group else [],
            })

    hotspots.sort(key=lambda h: h["size"], reverse=True)

    return jsonify({
        "hotspots": hotspots,
        "noise_count": noise_count,
        "total": int(len(df)),
        "params": {"eps": eps, "min_samples": min_samples, "min_cluster_size": min_cluster_size},
    })


@app.route('/anomalies', methods=['POST'])
def detect_anomalies_endpoint():
    """
    POST a JSON body: {"incidents": [{"CaseMasterID":.., "DistrictID":..,
    "CrimeMinorHeadID":.., "IncidentFromDate":.., "GravityOffenceID":..}, ...]}

    Flags incidents that deviate from the normal pattern for their
    district/crime-type/time-of-day — e.g. a crime type rare for that
    district, or a case at an unusual hour for that crime type.
    """
    body = request.get_json(force=True)
    if not body or "incidents" not in body:
        return jsonify({"error": "Expected JSON body with an 'incidents' array"}), 400

    df = pd.DataFrame(body["incidents"])
    if df.empty:
        return jsonify({"anomalies": [], "total": 0})

    required_cols = {"DistrictID", "CrimeMinorHeadID", "IncidentFromDate", "GravityOffenceID"}
    missing = required_cols - set(df.columns)
    if missing:
        return jsonify({"error": f"Missing required fields: {sorted(missing)}"}), 400

    df["IncidentFromDate"] = pd.to_datetime(df["IncidentFromDate"])
    df["hour"] = df["IncidentFromDate"].dt.hour
    df["day_of_week"] = df["IncidentFromDate"].dt.dayofweek

    contamination = float(request.args.get("contamination", 0.02))

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
    crime_hour_std = df.groupby("CrimeMinorHeadID")["hour"].transform("std").replace(0, 1).fillna(1)
    df["hour_deviation"] = (df["hour"] - crime_hour_mean).abs() / crime_hour_std

    features = df[["district_crime_share", "hour_deviation", "hour", "day_of_week", "GravityOffenceID"]].copy()
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    iso = IsolationForest(contamination=contamination, random_state=42, n_estimators=200)
    df["anomaly_flag"] = iso.fit_predict(scaled)  # -1 = anomaly, 1 = normal
    df["anomaly_raw_score"] = iso.decision_function(scaled)

    flagged = df[df["anomaly_flag"] == -1].sort_values("anomaly_raw_score")

    anomalies = [{
        "case_id": int(row["CaseMasterID"]) if "CaseMasterID" in row else None,
        "district_id": int(row["DistrictID"]),
        "crime_subhead": int(row["CrimeMinorHeadID"]),
        "hour": int(row["hour"]),
        "district_crime_share": round(float(row["district_crime_share"]), 4),
        "hour_deviation": round(float(row["hour_deviation"]), 3),
        "anomaly_score": round(float(row["anomaly_raw_score"]), 4),
    } for _, row in flagged.iterrows()]

    return jsonify({
        "anomalies": anomalies,
        "total": int(len(df)),
        "flagged_count": int(len(flagged)),
        "params": {"contamination": contamination},
    })


@app.route('/health')
def health():
    return jsonify({"status": "ok"})


listen_port = os.getenv('X_ZOHO_CATALYST_LISTEN_PORT', 9000)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(listen_port))