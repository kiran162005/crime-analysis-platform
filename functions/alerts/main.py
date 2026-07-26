import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    """
    GET /alerts -> list all alerts, most recent first.
    Read-only for now — no acknowledgment/update workflow exists yet on the
    alerts table's confirmed schema, so this doesn't invent one.
    """
    try:
        if request.method != "GET":
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

        app = zcatalyst_sdk.initialize()
        alerts = datastore.get_alerts(app)
        return jsonify(alerts), 200

    except Exception as err:
        logger.error(f"Exception in alerts: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response