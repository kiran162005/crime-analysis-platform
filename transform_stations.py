import csv

with open("ml-training/synthetic-data-gen/output/District.csv", newline="", encoding="utf-8") as f:
    district_lookup = {row["DistrictID"]: row["DistrictName"] for row in csv.DictReader(f)}

rows_written = 0
skipped = 0

with open("ml-training/synthetic-data-gen/output/Unit.csv", newline="", encoding="utf-8") as infile, \
     open("stations_import.csv", "w", newline="", encoding="utf-8") as outfile:

    reader = csv.DictReader(infile)
    writer = csv.DictWriter(outfile, fieldnames=["station_id", "station_name", "district"])
    writer.writeheader()

    for row in reader:
        district_name = district_lookup.get(row["DistrictID"])
        if district_name is None:
            skipped += 1
            continue
        writer.writerow({
            "station_id": row["UnitID"],
            "station_name": row["UnitName"],
            "district": district_name
        })
        rows_written += 1

print(f"Wrote {rows_written} rows to stations_import.csv")
if skipped:
    print(f"Skipped {skipped} rows")
