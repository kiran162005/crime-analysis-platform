import json
import logging
import zcatalyst_sdk

import datastore

logger = logging.getLogger()


def handler(event, context):
    """
    Triggered by a Signals rule on incidents row_inserted.

    Corrected against real runtime errors (not guessed):
    - event.get_argument() doesn't exist on EventDetails -> use get_raw_data()
    - context.close() doesn't exist -> use close_with_success()/close_with_failure(),
      same pattern as the Cron/Job function templates.
    """
    try:
        app = zcatalyst_sdk.initialize()

        raw_payload = event.get_raw_data()
        payload = json.loads(raw_payload) if isinstance(raw_payload, str) else raw_payload

        logger.info(f"spike-check-signal: received payload: {payload}")

        # Confirmed actual structure from a real test event:
        # payload["events"] is a list (Signals can batch, though we're using
        # Instant dispatch so it'll typically be one); the row's actual
        # column data lives at events[i]["event_config"]["data"].
        events = payload.get("events", [])
        if not events:
            logger.info("spike-check-signal: no events in payload, skipping")
            context.close_with_success()
            return

        for evt in events:
            logger.info(f"spike-check-signal: processing event: {evt}")
            row = evt.get("event_config", {}).get("data", {})

            district = row.get("district")
            crime_type = row.get("crime_type")

            if not district or not crime_type:
                logger.info(f"spike-check-signal: missing district/crime_type in row, skipping: {row}")
                continue

            raised = datastore.check_and_raise_alert(app, district, crime_type)
            logger.info(f"spike-check-signal: district={district} crime_type={crime_type} alert_raised={raised}")

        context.close_with_success()

    except Exception as err:
        logger.error(f"spike-check-signal failed: {err}")
        context.close_with_failure()