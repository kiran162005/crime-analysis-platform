"""
Role lookup against the `user_roles` companion table.

Real signup/login is NOT handled here — that's Catalyst's own hosted/embedded
auth, wired up client-side by the Frontend Engineer using catalyst.auth.signUp()
/ catalyst.auth.signIn(). This module only answers "given a logged-in user,
what's their role/district/assigned_cases" — and is meant to be imported by
other CRUD functions too (e.g. incident-crud can call get_role_for_user() to
filter District Officers to their own district), not just called from here.
"""

TABLE_NAME = "user_roles"


def get_role_for_zuid(app, zuid):
    """Look up role/district/assigned_cases for a given Catalyst user ID.
    Returns None if the user has signed up but hasn't been assigned a role
    yet — callers should treat that as 'no access', not 'error'."""
    zcql = app.zcql()
    query = f"SELECT * FROM {TABLE_NAME} WHERE zuid = '{zuid}'"
    result = zcql.execute_query(query)
    if not result:
        return None
    return result[0].get(TABLE_NAME)


def check_access(role_row, district=None, incident_id=None):
    """Shared authorization check other functions can reuse.
    SCRB Admin: full access.
    District Officer: only their own district.
    Investigator: only their assigned cases.
    """
    if role_row is None:
        return False

    role = role_row.get("role")

    if role == "SCRB Admin":
        return True
    elif role == "District Officer":
        return district is not None and district == role_row.get("district")
    elif role == "Investigator":
        if incident_id is None:
            return False
        import json
        try:
            assigned = json.loads(role_row.get("assigned_cases") or "[]")
        except (TypeError, ValueError):
            assigned = []
        return incident_id in assigned

    return False