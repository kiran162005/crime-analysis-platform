"""
Real Data Store operations for the `incidents` table.

Note: `incident_id` is a business-key column on the table, distinct from
Catalyst's internal ROWID. Update/delete operations require ROWID, so for any
op keyed by incident_id we first look up the matching ROWID via ZCQL, then
act on it. This is a real limitation of Data Store, not extra complexity for
its own sake.
"""

TABLE_NAME = "incidents"


def get_incidents(app):
    """Fetch all incidents (paged, since a table can exceed one page)."""
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
    return all_rows


def get_incident_by_id(app, incident_id):
    """Fetch a single incident by its business-key incident_id (not ROWID)."""
    zcql = app.zcql()
    query = f"SELECT * FROM {TABLE_NAME} WHERE incident_id = '{incident_id}'"
    result = zcql.execute_query(query)
    if not result:
        return None
    return result[0].get(TABLE_NAME)


def create_incident(app, data):
    """Insert a new incident row. `data` should already contain the fields
    matching the table schema (incident_id, crime_type, crime_description,
    date_time, district)."""
    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    return table.insert_row(data)


def update_incident(app, incident_id, data):
    """Update an incident identified by incident_id. Looks up its ROWID
    first since update_row requires ROWID, not the business key."""
    existing = get_incident_by_id(app, incident_id)
    if existing is None:
        return None

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    update_payload = dict(data)
    update_payload["ROWID"] = existing["ROWID"]
    return table.update_row(update_payload)


def delete_incident(app, incident_id):
    """Delete an incident identified by incident_id. Same ROWID lookup
    requirement as update."""
    existing = get_incident_by_id(app, incident_id)
    if existing is None:
        return False

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    table.delete_rows([existing["ROWID"]])
    return True