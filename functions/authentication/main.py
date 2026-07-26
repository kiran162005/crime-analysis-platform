import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    """
    GET /me -> returns the currently logged-in Catalyst user's identity
    plus their role/district/assigned_cases from the user_roles table.

    IMPORTANT: this does NOT log anyone in. Real signup/login happens
    client-side via Catalyst's own auth (catalyst.auth.signUp/signIn) —
    the Frontend Engineer wires that up. This endpoint just answers
    "who is currently logged in, and what can they access" for a session
    that Catalyst's own auth already established.

    NOTE: get_current_user() is the Python SDK's method for this per
    convention, mirroring the Node SDK's getCurrentUser() — verify this
    exact call against your installed zcatalyst-sdk version once you test,
    since I don't have a confirmed Python code sample for this specific
    call, only the JS equivalent and the general app.authentication()
    service pattern.
    """
    try:
        if request.method != "GET":
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

        # User-scoped init — required for identity checks like current user.
        user_app = zcatalyst_sdk.initialize(req=request)
        auth_service = user_app.authentication()

        current_user = auth_service.get_current_user()
        if current_user is None:
            response = make_response(jsonify({"message": "Not logged in"}))
            response.status_code = 401
            return response

        zuid = current_user.get("user_id") or current_user.get("zuid")

        # Admin-scoped init — required for Data Store reads.
        admin_app = zcatalyst_sdk.initialize(req=request, scope="admin")
        role_row = datastore.get_role_for_zuid(admin_app, zuid)

        if role_row is None:
            return jsonify({
                "user": current_user,
                "role": None,
                "message": "Signed up but no role assigned yet — contact an SCRB Admin"
            }), 200

        return jsonify({
            "user": current_user,
            "role": role_row.get("role"),
            "district": role_row.get("district"),
            "assigned_cases": role_row.get("assigned_cases")
        }), 200

    except Exception as err:
        logger.error(f"Exception in authentication: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response