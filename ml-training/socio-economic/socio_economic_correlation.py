"""
Socio-economic correlation — statistical, NOT machine learning.
Correlates district-level crime rates against public socio-economic
indicators (population density, literacy rate, urbanization %) to
answer "why here" rather than just "where."

This is explicitly a correlation/regression analysis, computed directly
in Functions-equivalent logic — no model training, no AutoML. Say this
clearly in the pitch alongside the other rule-based/statistical pieces
(trend-alert, this) vs. genuine ML (hotspot, risk score, anomaly, RAG).

Usage: python socio_economic_correlation.py
"""
import pandas as pd
import numpy as np
from scipy import stats

# Synthetic district-level socio-economic indicators — since real KSP/
# Census data wasn't available for the hackathon. Values are plausible
# approximations for these Karnataka districts, not sourced from an
# actual dataset. Say this explicitly if asked — these are illustrative,
# not real Census figures.
DISTRICT_INDICATORS = {
    1:  {"name": "Bengaluru Urban",              "population_density": 4381, "literacy_rate": 87.7, "urbanization_pct": 91.0},
    2:  {"name": "Mysuru",                        "population_density": 481,  "literacy_rate": 72.6, "urbanization_pct": 46.6},
    3:  {"name": "Mangaluru (Dakshina Kannada)",  "population_density": 460,  "literacy_rate": 88.6, "urbanization_pct": 46.4},
    4:  {"name": "Belagavi",                      "population_density": 316,  "literacy_rate": 73.9, "urbanization_pct": 27.9},
    5:  {"name": "Hubballi-Dharwad",               "population_density": 401,  "literacy_rate": 79.4, "urbanization_pct": 58.1},
    6:  {"name": "Kalaburagi",                     "population_density": 316,  "literacy_rate": 63.7, "urbanization_pct": 32.9},
    7:  {"name": "Ballari",                        "population_density": 332,  "literacy_rate": 67.4, "urbanization_pct": 39.6},
    8:  {"name": "Tumakuru",                       "population_density": 268,  "literacy_rate": 74.5, "urbanization_pct": 24.6},
    9:  {"name": "Shivamogga",                     "population_density": 246,  "literacy_rate": 81.3, "urbanization_pct": 30.9},
    10: {"name": "Davanagere",                     "population_density": 331,  "literacy_rate": 75.7, "urbanization_pct": 34.9},
}

def load_case_data(path="../synthetic-data-gen/output/CaseMaster.csv"):
    return pd.read_csv(path, parse_dates=["IncidentFromDate"])

def compute_district_crime_rates(df):
    crime_counts = df.groupby("DistrictID").size().rename("total_incidents")

    indicators_df = pd.DataFrame.from_dict(DISTRICT_INDICATORS, orient="index")
    indicators_df.index.name = "DistrictID"

    merged = indicators_df.join(crime_counts)
    # Crime rate per 1000 "population units" — since we don't have real
    # population totals, use density as a proxy scaling factor. This is
    # a simplification — flag it if asked, don't present it as a precise
    # per-capita rate.
    merged["crime_rate_proxy"] = merged["total_incidents"] / merged["population_density"] * 1000

    return merged.reset_index()

def compute_correlations(merged):
    results = {}
    for indicator in ["population_density", "literacy_rate", "urbanization_pct"]:
        corr, p_value = stats.pearsonr(merged[indicator], merged["total_incidents"])
        results[indicator] = {"correlation": round(corr, 3), "p_value": round(p_value, 4)}
    return results

if __name__ == "__main__":
    df = load_case_data()
    merged = compute_district_crime_rates(df)
    correlations = compute_correlations(merged)

    print("District-level crime counts vs. socio-economic indicators:\n")
    print(merged[["name", "total_incidents", "population_density", "literacy_rate", "urbanization_pct", "crime_rate_proxy"]].to_string(index=False))

    print("\nPearson correlation (indicator vs. total_incidents):")
    for indicator, res in correlations.items():
        significance = "significant" if res["p_value"] < 0.05 else "not significant"
        print(f"  {indicator}: r={res['correlation']}, p={res['p_value']} ({significance}, n=10)")

    print("\nCaveat: n=10 districts is a very small sample for correlation —")
    print("statistical significance claims here are weak regardless of p-value.")
    print("Present this as an illustrative overlay, not a rigorous finding.")

    merged.to_csv("district_socioeconomic_correlation.csv", index=False)