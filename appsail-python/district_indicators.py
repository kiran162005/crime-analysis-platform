"""
Static reference data — district-level socio-economic indicators.

Synthetic approximations for this demo (population density, literacy rate,
urbanization %), not real Census data — say this explicitly if asked.
Kept separate from app.py so reference data doesn't clutter request-handling
logic, and separate from ml-training/ so the deployed AppSail service is
self-contained (no cross-folder file dependency at runtime).

If real Census data becomes available, only this file needs updating —
app.py and its /socioeconomic endpoint don't change.
"""

DISTRICT_INDICATORS = {
    1:  {"name": "Bengaluru Urban",             "population_density": 4381, "literacy_rate": 87.7, "urbanization_pct": 91.0},
    2:  {"name": "Mysuru",                       "population_density": 481,  "literacy_rate": 72.6, "urbanization_pct": 46.6},
    3:  {"name": "Mangaluru (Dakshina Kannada)", "population_density": 460,  "literacy_rate": 88.6, "urbanization_pct": 46.4},
    4:  {"name": "Belagavi",                     "population_density": 316,  "literacy_rate": 73.9, "urbanization_pct": 27.9},
    5:  {"name": "Hubballi-Dharwad",              "population_density": 401,  "literacy_rate": 79.4, "urbanization_pct": 58.1},
    6:  {"name": "Kalaburagi",                    "population_density": 316,  "literacy_rate": 63.7, "urbanization_pct": 32.9},
    7:  {"name": "Ballari",                       "population_density": 332,  "literacy_rate": 67.4, "urbanization_pct": 39.6},
    8:  {"name": "Tumakuru",                      "population_density": 268,  "literacy_rate": 74.5, "urbanization_pct": 24.6},
    9:  {"name": "Shivamogga",                    "population_density": 246,  "literacy_rate": 81.3, "urbanization_pct": 30.9},
    10: {"name": "Davanagere",                    "population_density": 331,  "literacy_rate": 75.7, "urbanization_pct": 34.9},
}
