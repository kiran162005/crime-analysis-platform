import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    """
    Routes:
      GET    /stations           -> list all stations
      GET    /stations/<id>      -> get one station
      POST   /stations           -> create a station
      PUT    /stations/<id>      -> update a station
      DELETE /stations/<id>      -> delete a station
    """
    try:
        app = zcatalyst_sdk.initialize()

        path_parts = [p for p in request.path.strip("/").split("/") if p]
        if path_parts and path_parts[0] == "stations":
            path_parts = path_parts[1:]

        station_id = path_parts[0] if path_parts else None

        if request.method == "GET":
            if station_id:
                station = datastore.get_station_by_id(app, station_id)
                if station is None:
                    response = make_response(jsonify({"message": "Station Not Found"}))
                    response.status_code = 404
                    return response
                return jsonify(station), 200
            else:
                stations = datastore.get_stations(app)
                return jsonify(stations), 200

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            created = datastore.create_station(app, data)
            return jsonify({"message": "Station Created", "data": created}), 201

        elif request.method == "PUT":
            if not station_id:
                response = make_response(jsonify({"message": "station_id required"}))
                response.status_code = 400
                return response
            data = request.get_json(silent=True) or {}
            updated = datastore.update_station(app, station_id, data)
            if updated is None:
                response = make_response(jsonify({"message": "Station Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Updated", "data": updated}), 200

        elif request.method == "DELETE":
            if not station_id:
                response = make_response(jsonify({"message": "station_id required"}))
                response.status_code = 400
                return response
            deleted = datastore.delete_station(app, station_id)
            if not deleted:
                response = make_response(jsonify({"message": "Station Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Deleted"}), 200

        else:
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

    except Exception as err:
        logger.error(f"Exception in station-crud: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response