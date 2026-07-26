import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    try:
        app = zcatalyst_sdk.initialize()

        path_parts = [p for p in request.path.strip("/").split("/") if p]

        if not path_parts or path_parts[0] != "incidents":
            response = make_response(jsonify({"message": "Unknown path"}))
            response.status_code = 404
            return response

        incident_id = path_parts[1] if len(path_parts) > 1 else None

        if request.method == "GET":
            if incident_id:
                incident = datastore.get_incident_by_id(app, incident_id)
                if incident is None:
                    response = make_response(jsonify({"message": "Incident Not Found"}))
                    response.status_code = 404
                    return response
                return jsonify(incident), 200
            else:
                incidents = datastore.get_incidents(app)
                return jsonify(incidents), 200

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            created = datastore.create_incident(app, data)
            return jsonify({"message": "Incident Created", "data": created}), 201

        elif request.method == "PUT":
            if not incident_id:
                response = make_response(jsonify({"message": "incident_id required"}))
                response.status_code = 400
                return response
            data = request.get_json(silent=True) or {}
            updated = datastore.update_incident(app, incident_id, data)
            if updated is None:
                response = make_response(jsonify({"message": "Incident Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Updated", "data": updated}), 200

        elif request.method == "DELETE":
            if not incident_id:
                response = make_response(jsonify({"message": "incident_id required"}))
                response.status_code = 400
                return response
            deleted = datastore.delete_incident(app, incident_id)
            if not deleted:
                response = make_response(jsonify({"message": "Incident Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Deleted"}), 200

        else:
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

    except Exception as err:
        logger.error(f"Exception in incident-crud: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response