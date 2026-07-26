"""
Real Data Store operations for the `victims` table.
Schema (confirmed): victim_id (varchar), incident_id (varchar), gender (varchar), age (int)

Note: victim_id is a business-key column, distinct from Catalyst's internal
ROWID. Update/delete require ROWID, so we look it up via ZCQL first.
"""

TABLE_NAME = "victims"


def get_victims(app):
    """Fetch all victims (paged)."""
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


def get_victim_by_id(app, victim_id):
    """Fetch a single victim by its business-key victim_id (not ROWID)."""
    zcql = app.zcql()
    query = f"SELECT * FROM {TABLE_NAME} WHERE victim_id = '{victim_id}'"
    result = zcql.execute_query(query)
    if not result:
        return None
    return result[0].get(TABLE_NAME)


def create_victim(app, data):
    """Insert a new victim row. Expects victim_id, incident_id, gender, age."""
    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    return table.insert_row(data)


def update_victim(app, victim_id, data):
    """Update a victim identified by victim_id."""
    existing = get_victim_by_id(app, victim_id)
    if existing is None:
        return None

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    update_payload = dict(data)
    update_payload["ROWID"] = existing["ROWID"]
    return table.update_row(update_payload)


def delete_victim(app, victim_id):
    """Delete a victim identified by victim_id."""
    existing = get_victim_by_id(app, victim_id)
    if existing is None:
        return False

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    table.delete_rows([existing["ROWID"]])
    return True