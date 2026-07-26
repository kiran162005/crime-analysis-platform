import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    """
    Routes:
      GET    /victims           -> list all victims
      GET    /victims/<id>      -> get one victim
      POST   /victims           -> create a victim
      PUT    /victims/<id>      -> update a victim
      DELETE /victims/<id>      -> delete a victim
    """
    try:
        app = zcatalyst_sdk.initialize()

        path_parts = [p for p in request.path.strip("/").split("/") if p]
        if path_parts and path_parts[0] == "victims":
            path_parts = path_parts[1:]

        victim_id = path_parts[0] if path_parts else None

        if request.method == "GET":
            if victim_id:
                victim = datastore.get_victim_by_id(app, victim_id)
                if victim is None:
                    response = make_response(jsonify({"message": "Victim Not Found"}))
                    response.status_code = 404
                    return response
                return jsonify(victim), 200
            else:
                victims = datastore.get_victims(app)
                return jsonify(victims), 200

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            created = datastore.create_victim(app, data)
            return jsonify({"message": "Victim Created", "data": created}), 201

        elif request.method == "PUT":
            if not victim_id:
                response = make_response(jsonify({"message": "victim_id required"}))
                response.status_code = 400
                return response
            data = request.get_json(silent=True) or {}
            updated = datastore.update_victim(app, victim_id, data)
            if updated is None:
                response = make_response(jsonify({"message": "Victim Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Updated", "data": updated}), 200

        elif request.method == "DELETE":
            if not victim_id:
                response = make_response(jsonify({"message": "victim_id required"}))
                response.status_code = 400
                return response
            deleted = datastore.delete_victim(app, victim_id)
            if not deleted:
                response = make_response(jsonify({"message": "Victim Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Deleted"}), 200

        else:
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

    except Exception as err:
        logger.error(f"Exception in victim-crud: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response