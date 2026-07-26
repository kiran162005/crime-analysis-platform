import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    """
    Routes (note: function is named links-crud, but the underlying table is
    `link` singular — see datastore.py for why):
      GET    /links           -> list all links
      GET    /links/<id>      -> get one link
      POST   /links           -> create a link
      PUT    /links/<id>      -> update a link
      DELETE /links/<id>      -> delete a link
    """
    try:
        app = zcatalyst_sdk.initialize()

        path_parts = [p for p in request.path.strip("/").split("/") if p]
        if path_parts and path_parts[0] == "links":
            path_parts = path_parts[1:]

        link_id = path_parts[0] if path_parts else None

        if request.method == "GET":
            if link_id:
                link = datastore.get_link_by_id(app, link_id)
                if link is None:
                    response = make_response(jsonify({"message": "Link Not Found"}))
                    response.status_code = 404
                    return response
                return jsonify(link), 200
            else:
                links = datastore.get_links(app)
                return jsonify(links), 200

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            created = datastore.create_link(app, data)
            return jsonify({"message": "Link Created", "data": created}), 201

        elif request.method == "PUT":
            if not link_id:
                response = make_response(jsonify({"message": "link_id required"}))
                response.status_code = 400
                return response
            data = request.get_json(silent=True) or {}
            updated = datastore.update_link(app, link_id, data)
            if updated is None:
                response = make_response(jsonify({"message": "Link Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Updated", "data": updated}), 200

        elif request.method == "DELETE":
            if not link_id:
                response = make_response(jsonify({"message": "link_id required"}))
                response.status_code = 400
                return response
            deleted = datastore.delete_link(app, link_id)
            if not deleted:
                response = make_response(jsonify({"message": "Link Not Found"}))
                response.status_code = 404
                return response
            return jsonify({"message": "Deleted"}), 200

        else:
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

    except Exception as err:
        logger.error(f"Exception in links-crud: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response