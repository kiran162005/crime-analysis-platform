import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

import datastore

logger = logging.getLogger()


def handler(request: Request):
    """
    GET /report?url=<dashboard-url>  -> generates a PDF snapshot of that
    dashboard URL, stores it in File Store, returns file details/link.

    If no `url` param is given, falls back to a placeholder dashboard URL —
    replace DEFAULT_DASHBOARD_URL below once the Frontend Engineer's actual
    hosted URL is known, or always require the query param instead.
    """
    DEFAULT_DASHBOARD_URL = "https://crime-analysis-platform-60079412156.development.catalystserverless.in/app/index.html"

    try:
        if request.method != "GET":
            response = make_response(jsonify({"message": "Method not allowed"}))
            response.status_code = 405
            return response

        app = zcatalyst_sdk.initialize()

        source_url = request.args.get("url", DEFAULT_DASHBOARD_URL)
        if source_url == "REPLACE_WITH_YOUR_HOSTED_DASHBOARD_URL":
            response = make_response(jsonify({
                "message": "No dashboard URL configured — pass ?url=... or set DEFAULT_DASHBOARD_URL"
            }))
            response.status_code = 400
            return response

        # TEMP isolation test: ?test=1 bypasses the live dashboard entirely
        # and converts a trivial static string, to check whether SmartBrowz
        # itself is reliable or whether the dashboard page is the bottleneck.
        if request.args.get("test") == "1":
            pdf_result = datastore.generate_report_pdf(app, "<h1>Test PDF</h1>", is_url=False)
        else:
            pdf_result = datastore.generate_report_pdf(app, source_url, is_url=True)

        from datetime import datetime
        file_name = f"intelligence-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.pdf"

        uploaded = datastore.store_report(app, pdf_result, file_name)

        return jsonify({
            "message": "Report generated",
            "file": uploaded
        }), 200

    except Exception as err:
        logger.error(f"Exception in report-generator: {err}")
        response = make_response(jsonify({"error": "Internal server error occurred. Please try again"}))
        response.status_code = 500
        return response