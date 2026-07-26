"""
Real Data Store operations for the `stations` table.
Schema (confirmed): station_id (varchar), station_name (varchar), district (varchar)

Note: station_id is a business-key column, distinct from Catalyst's internal
ROWID. Update/delete require ROWID, so we look it up via ZCQL first.
"""

TABLE_NAME = "stations"


def get_stations(app):
    """Fetch all stations (paged)."""
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


def get_station_by_id(app, station_id):
    """Fetch a single station by its business-key station_id (not ROWID)."""
    zcql = app.zcql()
    query = f"SELECT * FROM {TABLE_NAME} WHERE station_id = '{station_id}'"
    result = zcql.execute_query(query)
    if not result:
        return None
    return result[0].get(TABLE_NAME)


def create_station(app, data):
    """Insert a new station row. Expects station_id, station_name, district."""
    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    return table.insert_row(data)


def update_station(app, station_id, data):
    """Update a station identified by station_id."""
    existing = get_station_by_id(app, station_id)
    if existing is None:
        return None

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    update_payload = dict(data)
    update_payload["ROWID"] = existing["ROWID"]
    return table.update_row(update_payload)


def delete_station(app, station_id):
    """Delete a station identified by station_id."""
    existing = get_station_by_id(app, station_id)
    if existing is None:
        return False

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    table.delete_rows([existing["ROWID"]])
    return True