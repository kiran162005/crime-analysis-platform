"""
Real Data Store operations for the `link` table (singular — confirmed via
console as the real table; a duplicate empty `links` table also exists and
should be deleted once the team's aligned on this).

Schema (confirmed): link_id (varchar), entity_a (varchar), entity_b (varchar),
relation_type (varchar)

Note: no `weight` column yet, unlike the original plan doc — flagged to the
Network Engineer, not something to invent a default for here.
"""

TABLE_NAME = "link"


def get_links(app):
    """Fetch all links (paged)."""
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


def get_link_by_id(app, link_id):
    """Fetch a single link by its business-key link_id (not ROWID)."""
    zcql = app.zcql()
    query = f"SELECT * FROM {TABLE_NAME} WHERE link_id = '{link_id}'"
    result = zcql.execute_query(query)
    if not result:
        return None
    return result[0].get(TABLE_NAME)


def create_link(app, data):
    """Insert a new link row. Expects link_id, entity_a, entity_b, relation_type."""
    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    return table.insert_row(data)


def update_link(app, link_id, data):
    """Update a link identified by link_id."""
    existing = get_link_by_id(app, link_id)
    if existing is None:
        return None

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    update_payload = dict(data)
    update_payload["ROWID"] = existing["ROWID"]
    return table.update_row(update_payload)


def delete_link(app, link_id):
    """Delete a link identified by link_id."""
    existing = get_link_by_id(app, link_id)
    if existing is None:
        return False

    datastore = app.datastore()
    table = datastore.table(TABLE_NAME)
    table.delete_rows([existing["ROWID"]])
    return True