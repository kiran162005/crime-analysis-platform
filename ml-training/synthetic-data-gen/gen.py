import random
import csv
from datetime import datetime, timedelta

random.seed(42)

STATE = [(1, "Karnataka")]

DISTRICTS = [
    (1, "Bengaluru Urban", 12.9716, 77.5946),
    (2, "Mysuru", 12.2958, 76.6394),
    (3, "Mangaluru (Dakshina Kannada)", 12.9141, 74.8560),
    (4, "Belagavi", 15.8497, 74.4977),
    (5, "Hubballi-Dharwad", 15.3647, 75.1240),
    (6, "Kalaburagi", 17.3297, 76.8343),
    (7, "Ballari", 15.1394, 76.9214),
    (8, "Tumakuru", 13.3379, 77.1173),
    (9, "Shivamogga", 13.9299, 75.5681),
    (10, "Davanagere", 14.4644, 75.9218),
]

UNITS = []
unit_id = 1
for did, dname, dlat, dlon in DISTRICTS:
    n_stations = random.randint(4, 7)
    for i in range(n_stations):
        lat = dlat + random.uniform(-0.15, 0.15)
        lon = dlon + random.uniform(-0.15, 0.15)
        UNITS.append((unit_id, f"{dname.split(' ')[0]} PS-{i+1}", did, lat, lon))
        unit_id += 1

CRIME_HEADS = [
    (1, "Crimes Against Body"),
    (2, "Crimes Against Property"),
    (3, "Crimes Against Women"),
    (4, "Cyber Crimes"),
    (5, "Narcotics & NDPS"),
    (6, "Public Order & Miscellaneous"),
]

CRIME_SUBHEADS = [
    (1, 1, "Murder"),
    (2, 1, "Grievous Hurt"),
    (3, 1, "Attempt to Murder"),
    (4, 2, "House Burglary"),
    (5, 2, "Vehicle Theft"),
    (6, 2, "Chain Snatching"),
    (7, 3, "Assault on Woman"),
    (8, 3, "Dowry Harassment"),
    (9, 4, "Online Financial Fraud"),
    (10, 4, "Phishing / Identity Theft"),
    (11, 5, "Drug Peddling"),
    (12, 5, "Drug Possession"),
    (13, 6, "Rioting"),
    (14, 6, "Public Nuisance"),
]

CASE_STATUS = [
    (1, "Under Investigation"),
    (2, "Charge Sheeted"),
    (3, "Closed"),
    (4, "Undetected"),
]

GRAVITY = [
    (1, "Heinous"),
    (2, "Non-Heinous"),
]

FIRST_NAMES_M = ["Ravi","Suresh","Manjunath","Prakash","Anil","Naveen","Ramesh","Vijay","Basavaraj","Shivaraj",
                 "Ganesh","Nagaraj","Kumar","Srinivas","Harish","Girish","Yogesh","Santosh","Mahesh","Raghu"]
FIRST_NAMES_F = ["Lakshmi","Sunita","Kavya","Deepa","Anita","Shwetha","Priya","Radha","Geeta","Manjula",
                  "Savitha","Pooja","Rekha","Nandini","Bhagya","Shobha","Roopa","Vidya","Chaya","Sowmya"]
LAST_NAMES = ["Gowda","Naik","Reddy","Shetty","Rao","Hegde","Patil","Kumar","Murthy","Achar",
              "Bhat","Poojary","Naidu","Iyer","Setty"]

def random_name(gender):
    fn = random.choice(FIRST_NAMES_M if gender == "M" else FIRST_NAMES_F)
    ln = random.choice(LAST_NAMES)
    return f"{fn} {ln}"

REPEAT_OFFENDERS = []
for i in range(60):
    gender = random.choice(["M","M","M","F"])
    REPEAT_OFFENDERS.append({
        "person_id": f"REPEAT-{i+1:03d}",
        "name": random_name(gender),
        "age": random.randint(19, 45),
        "gender": gender,
        "home_districts": random.sample([d[0] for d in DISTRICTS], k=random.choice([1,1,2,2,3])),
        "preferred_crime": random.choice(CRIME_SUBHEADS),
    })

HOTSPOTS = [
    (1, 12.9352, 77.6146, 6, (18,23), 0.14),
    (1, 12.9784, 77.6408, 9, (10,17), 0.10),
    (3, 12.8703, 74.8420, 5, (0,4), 0.08),
    (6, 17.3350, 76.8290, 11, (20,23), 0.09),
    (7, 15.1420, 76.9260, 13, (17,21), 0.07),
    (2, 12.3070, 76.6520, 8, (19,22), 0.07),
]

def pick_unit_for_district(did):
    candidates = [u for u in UNITS if u[2] == did]
    return random.choice(candidates)

def gen_case_time():
    start = datetime(2024, 1, 1)
    end = datetime(2026, 6, 30)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))

N_CASES = 18000
N_HOTSPOT_CASES = int(N_CASES * 0.55)
N_BACKGROUND = N_CASES - N_HOTSPOT_CASES

case_rows = []
accused_rows = []
victim_rows = []

case_id = 1
accused_id = 1
victim_id = 1

def make_case(district_id, subhead_id, hour_choice=None):
    global case_id
    unit = pick_unit_for_district(district_id)
    subhead = next(s for s in CRIME_SUBHEADS if s[0] == subhead_id)
    head_id = subhead[1]
    dt = gen_case_time()
    if hour_choice:
        h = random.randint(hour_choice[0], hour_choice[1]) if hour_choice[0] <= hour_choice[1] else random.choice(list(range(hour_choice[0],24))+list(range(0,hour_choice[1]+1)))
        dt = dt.replace(hour=h % 24, minute=random.randint(0,59))
    lat = unit[3] + random.uniform(-0.02, 0.02)
    lon = unit[4] + random.uniform(-0.02, 0.02)
    status = random.choices([s[0] for s in CASE_STATUS], weights=[0.4,0.3,0.2,0.1])[0]
    gravity = 1 if head_id in (1,3) else random.choice([1,2])
    crime_no = f"1{district_id:04d}{unit[0]:04d}{dt.year}{case_id:05d}"
    case_no = f"{dt.year}{case_id:05d}"
    row = {
        "CaseMasterID": case_id,
        "CrimeNo": crime_no,
        "CaseNo": case_no,
        "CrimeRegisteredDate": dt.date().isoformat(),
        "PoliceStationID": unit[0],
        "DistrictID": district_id,
        "GravityOffenceID": gravity,
        "CrimeMajorHeadID": head_id,
        "CrimeMinorHeadID": subhead_id,
        "CaseStatusID": status,
        "IncidentFromDate": dt.isoformat(sep=" "),
        "IncidentToDate": dt.isoformat(sep=" "),
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "BriefFacts": f"{subhead[2]} reported near {unit[1]} jurisdiction.",
    }
    case_id += 1
    return row

for _ in range(N_HOTSPOT_CASES):
    hs = random.choices(HOTSPOTS, weights=[h[5] for h in HOTSPOTS])[0]
    did, hlat, hlon, subhead_id, hour_range, _ = hs
    row = make_case(did, subhead_id, hour_choice=hour_range)
    case_rows.append(row)

for _ in range(N_BACKGROUND):
    did = random.choice([d[0] for d in DISTRICTS])
    subhead_id = random.choice([s[0] for s in CRIME_SUBHEADS])
    row = make_case(did, subhead_id)
    case_rows.append(row)

random.shuffle(case_rows)
for i, row in enumerate(case_rows, start=1):
    row["CaseMasterID"] = i

for row in case_rows:
    did = row["DistrictID"]
    n_accused = random.choices([1,2,3],[0.6,0.3,0.1])[0]
    use_repeat = random.random() < 0.22
    for a in range(n_accused):
        if use_repeat and a == 0:
            candidates = [r for r in REPEAT_OFFENDERS if did in r["home_districts"]]
            if not candidates:
                candidates = REPEAT_OFFENDERS
            r = random.choice(candidates)
            name = r["name"]
            age = r["age"] + random.choice([0,0,1])
            gender = r["gender"]
            person_tag = r["person_id"]
        else:
            gender = random.choice(["M","M","F"])
            name = random_name(gender)
            age = random.randint(18, 55)
            person_tag = ""
        accused_rows.append({
            "AccusedMasterID": accused_id,
            "CaseMasterID": row["CaseMasterID"],
            "AccusedName": name,
            "AgeYear": age,
            "GenderID": gender,
            "PersonID": f"A{a+1}",
            "_RepeatOffenderTag_forValidationOnly": person_tag,
        })
        accused_id += 1

for row in case_rows:
    n_victims = random.choices([1,2],[0.85,0.15])[0]
    for v in range(n_victims):
        gender = random.choice(["M","F"])
        victim_rows.append({
            "VictimMasterID": victim_id,
            "CaseMasterID": row["CaseMasterID"],
            "VictimName": random_name(gender),
            "AgeYear": random.randint(5, 75),
            "GenderID": gender,
            "VictimPolice": 0,
        })
        victim_id += 1

def write_csv(filename, rows, fieldnames):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

write_csv("CaseMaster.csv", case_rows, list(case_rows[0].keys()))
write_csv("Accused.csv", accused_rows, list(accused_rows[0].keys()))
write_csv("Victim.csv", victim_rows, list(victim_rows[0].keys()))
write_csv("State.csv", [{"StateID":s[0],"StateName":s[1]} for s in STATE], ["StateID","StateName"])
write_csv("District.csv", [{"DistrictID":d[0],"DistrictName":d[1],"StateID":1,"CentroidLat":d[2],"CentroidLon":d[3]} for d in DISTRICTS],
          ["DistrictID","DistrictName","StateID","CentroidLat","CentroidLon"])
write_csv("Unit.csv", [{"UnitID":u[0],"UnitName":u[1],"DistrictID":u[2],"latitude":round(u[3],6),"longitude":round(u[4],6)} for u in UNITS],
          ["UnitID","UnitName","DistrictID","latitude","longitude"])
write_csv("CrimeHead.csv", [{"CrimeHeadID":c[0],"CrimeGroupName":c[1]} for c in CRIME_HEADS], ["CrimeHeadID","CrimeGroupName"])
write_csv("CrimeSubHead.csv", [{"CrimeSubHeadID":c[0],"CrimeHeadID":c[1],"CrimeHeadName":c[2]} for c in CRIME_SUBHEADS],
          ["CrimeSubHeadID","CrimeHeadID","CrimeHeadName"])
write_csv("CaseStatusMaster.csv", [{"CaseStatusID":c[0],"CaseStatusName":c[1]} for c in CASE_STATUS], ["CaseStatusID","CaseStatusName"])
write_csv("GravityOffence.csv", [{"GravityOffenceID":g[0],"LookupValue":g[1]} for g in GRAVITY], ["GravityOffenceID","LookupValue"])

print(f"Cases: {len(case_rows)}, Accused: {len(accused_rows)}, Victims: {len(victim_rows)}, Units: {len(UNITS)}")
print("Repeat offenders embedded:", len(REPEAT_OFFENDERS))