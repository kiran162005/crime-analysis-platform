"""Real Data Store operations for the `alerts` table.
Schema (confirmed): alert_id, district, crime_type, spike_ratio, generated_at
"""

TABLE_NAME = "alerts"


def get_alerts(app):
    """Fetch all alerts (paged), most recent first for the frontend's feed."""
    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)

    all_rows = []
    next_token = None
    while True:
        result = table.get_paged_rows(next_token=next_token, max_rows=200)
        all_rows.extend(result.get("data", []))
        next_token = result.get("next_token")
        if not result.get("more_records"):
            break

    all_rows.sort(key=lambda r: r.get("generated_at", ""), reverse=True)
    return all_rows