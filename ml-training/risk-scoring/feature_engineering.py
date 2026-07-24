"""
Feature engineering for predictive risk scoring.
Rolls up per-incident CaseMaster rows into district x crime-type x week
aggregates, with lagged/trend features Zia AutoML can train a tabular
model on to predict next-week risk per district/crime-type.

Usage: python feature_engineering.py
Output: risk_features.csv
"""
import pandas as pd
import numpy as np

def load_data(path="CaseMaster.csv"):
    df = pd.read_csv(path, parse_dates=["IncidentFromDate"])
    return df

def build_weekly_aggregates(df):
    """
    Roll incidents up to (district, crime_subhead, week) granularity.
    This is the core shape: one row per district+crime-type+week, with a
    count — the label AutoML will learn to predict for future weeks.
    """
    df["week"] = df["IncidentFromDate"].dt.to_period("W").apply(lambda p: p.start_time)

    weekly = (
        df.groupby(["DistrictID", "CrimeMinorHeadID", "week"])
        .agg(incident_count=("CaseMasterID", "count"))
        .reset_index()
    )

    # Fill in missing (district, crime_type, week) combos with 0 — a week
    # with no incidents of a given type is a real data point, not a gap.
    all_districts = df["DistrictID"].unique()
    all_crimes = df["CrimeMinorHeadID"].unique()
    all_weeks = pd.date_range(df["week"].min(), df["week"].max(), freq="W-MON")

    full_index = pd.MultiIndex.from_product(
        [all_districts, all_crimes, all_weeks],
        names=["DistrictID", "CrimeMinorHeadID", "week"]
    )
    weekly = weekly.set_index(["DistrictID", "CrimeMinorHeadID", "week"]).reindex(full_index, fill_value=0).reset_index()

    return weekly

def add_time_features(weekly):
    weekly["week_of_year"] = weekly["week"].dt.isocalendar().week.astype(int)
    weekly["month"] = weekly["week"].dt.month
    return weekly

def add_lag_and_trend_features(weekly):
    """
    For each (district, crime_type) series, add:
    - lag_1, lag_2, lag_4: incident counts from 1/2/4 weeks ago
    - rolling_avg_4wk: trailing 4-week average (the baseline the trend-alert
      rule compares against — different consumer, same computation)
    - trend: this week vs. rolling average, as a ratio (feeds risk label)
    """
    weekly = weekly.sort_values(["DistrictID", "CrimeMinorHeadID", "week"])
    grp = weekly.groupby(["DistrictID", "CrimeMinorHeadID"])["incident_count"]

    weekly["lag_1"] = grp.shift(1)
    weekly["lag_2"] = grp.shift(2)
    weekly["lag_4"] = grp.shift(4)
    weekly["rolling_avg_4wk"] = grp.transform(lambda s: s.shift(1).rolling(4, min_periods=1).mean())

    weekly["trend_ratio"] = weekly["incident_count"] / weekly["rolling_avg_4wk"].replace(0, np.nan)
    weekly["trend_ratio"] = weekly["trend_ratio"].fillna(1.0)

    return weekly

def add_target_label(weekly):
    """
    Target: next week's incident_count for this district+crime_type — this
    is what Zia AutoML will be trained to predict (a regression target).
    A classification version (high/medium/low risk) can be derived from
    this by binning, if you'd rather train a classifier — mention which
    you're using in the pitch, don't build both and pick later under
    deadline pressure.
    """
    weekly = weekly.sort_values(["DistrictID", "CrimeMinorHeadID", "week"])
    weekly["target_next_week_count"] = weekly.groupby(
        ["DistrictID", "CrimeMinorHeadID"]
    )["incident_count"].shift(-1)
    return weekly

if __name__ == "__main__":
    df = load_data()
    weekly = build_weekly_aggregates(df)
    weekly = add_time_features(weekly)
    weekly = add_lag_and_trend_features(weekly)
    weekly = add_target_label(weekly)

    # Drop rows without enough history (first few weeks) or without a
    # target (last week, since there's no "next week" to predict) —
    # AutoML needs complete rows, not NaNs.
    before = len(weekly)
    weekly_clean = weekly.dropna(subset=["lag_4", "target_next_week_count"])
    after = len(weekly_clean)

    weekly_clean.to_csv("risk_features.csv", index=False)

    print(f"Raw incidents: {len(df)}")
    print(f"Weekly district x crime-type rows (before cleaning): {before}")
    print(f"Usable rows for training (after dropping incomplete history): {after}")
    print(f"\nSample rows:")
    print(weekly_clean.head(8).to_string())
    print(f"\nSaved to risk_features.csv — this is what feeds Zia AutoML.")