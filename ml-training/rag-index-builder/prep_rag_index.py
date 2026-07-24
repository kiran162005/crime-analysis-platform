"""
Prep FIR narrative text (BriefFacts) for QuickML RAG indexing.
Each case becomes one chunk with metadata attached, so retrieval can
filter by district/crime-type/date before doing similarity search —
much better than embedding raw unstructured text with no structure.

Usage: python prep_rag_index.py
Output: rag_chunks.csv (or .jsonl, whichever QuickML's upload expects —
check the console upload screen and tell me which format it wants)
"""
import pandas as pd
import json

def load_data(path="../synthetic-data-gen/output/CaseMaster.csv"):
    df = pd.read_csv(path, parse_dates=["IncidentFromDate"])
    return df

def build_chunks(df):
    chunks = []
    for _, row in df.iterrows():
        # The chunk text itself — narrative + key structured facts folded
        # in as readable text, so the LLM can reference them in an answer
        # even without a separate metadata lookup.
        text = (
            f"Case {row['CaseMasterID']} (Crime No: {row['CrimeNo']}): "
            f"{row['BriefFacts']} "
            f"Registered on {row['CrimeRegisteredDate']}. "
            f"District ID {row['DistrictID']}, Police Station ID {row['PoliceStationID']}. "
            f"Case status ID: {row['CaseStatusID']}. Gravity ID: {row['GravityOffenceID']}."
        )
        chunks.append({
            "case_id": int(row["CaseMasterID"]),
            "text": text,
            "district_id": int(row["DistrictID"]),
            "crime_subhead_id": int(row["CrimeMinorHeadID"]),
            "date": row["CrimeRegisteredDate"],
            "case_status_id": int(row["CaseStatusID"]),
        })
    return chunks

if __name__ == "__main__":
    df = load_data()
    chunks = build_chunks(df)

    # CSV version (flat, one row per case)
    pd.DataFrame(chunks).to_csv("rag_chunks.csv", index=False)

    # JSONL version (one JSON object per line) — many RAG ingestion tools
    # expect this format instead of CSV; keep both ready.
    with open("rag_chunks.jsonl", "w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c) + "\n")

    print(f"Prepped {len(chunks)} chunks.")
    print("\nSample chunk:")
    print(json.dumps(chunks[0], indent=2))
    print("\nSaved rag_chunks.csv and rag_chunks.jsonl — check QuickML's")
    print("upload screen to see which format it actually wants.")