"""
Data Store operations for spike-check-signal.
Reuses the same district+crime_type baseline logic as trend_alert_job, but
scoped to a single slice (the one the newly inserted incident belongs to)
instead of scanning the whole table — this is what makes it fast enough to
run per-insert rather than nightly.
"""

from datetime import datetime, timedelta

LOOKBACK_DAYS = 14
SPIKE_THRESHOLD = 1.5
MIN_BASELINE_SAMPLE = 3
ESCALATION_THRESHOLD = 3.0  # 2x the base SPIKE_THRESHOLD — treated as urgent in the email only,
                             # since there's no severity/escalated column on `alerts` to persist this


def send_alert_email(app, district, crime_type, spike_ratio):
    """Mail-only notification, since Push Notifications and Circuits are
    both unavailable on this project's data center (confirmed IN DC).
    Best-effort: a mail failure should never block the alert from having
    been recorded in Data Store — caller should not treat this as fatal."""
    is_escalated = spike_ratio >= ESCALATION_THRESHOLD
    subject_prefix = "[ESCALATED] " if is_escalated else "[Alert] "

    config = {
        "from_email": "crimeanalysisplatform2026@gmail.com",  # must be a
        # Catalyst-verified sender — unverified senders silently fail to send
        "to_email": ["crimeanalysisplatform2026@gmail.com"],
        "subject": f"{subject_prefix}Crime spike detected — {district} / {crime_type}",
        "content": (
            f"A spike was detected for {crime_type} incidents in {district}.\n"
            f"Current count is {round(spike_ratio, 2)}x the rolling baseline average.\n"
            f"{'This exceeds the escalation threshold and needs prompt review.' if is_escalated else ''}\n\n"
            f"This is an automated alert from the real-time spike detection system."
        ),
        "html_mode": False
    }

    mail_service = app.email()
    mail_service.send_mail(config)


def to_catalyst_datetime(dt, tz_offset_minutes=330):
    """Format a datetime as Catalyst's expected 'YYYY-MM-DD HH:MM:SS',
    shifted by tz_offset_minutes (default IST, UTC+5:30) since Python's
    utcnow()-based timestamps are UTC by default and day-boundary
    comparisons need to match the project's actual local timezone —
    same gotcha as trend_alert_job's isoDaysAgo(), fixed here up front
    rather than discovered the same way again."""
    shifted = dt + timedelta(minutes=tz_offset_minutes)
    return shifted.strftime("%Y-%m-%d %H:%M:%S")


def check_and_raise_alert(app, district, crime_type):
    """Check whether today's count for (district, crime_type) has spiked
    vs. the rolling baseline, and write an alert row if so. Returns True
    if an alert was raised, False otherwise (including 'not enough history
    yet' — that's correct behavior, not a failure)."""
    zcql = app.zcql()
    now_utc = datetime.utcnow()

    today_start = to_catalyst_datetime(now_utc - timedelta(days=1))
    baseline_start = to_catalyst_datetime(now_utc - timedelta(days=LOOKBACK_DAYS))

    today_query = (
        f"SELECT incident_id FROM incidents "
        f"WHERE district = '{district}' AND crime_type = '{crime_type}' "
        f"AND date_time >= '{today_start}'"
    )
    baseline_query = (
        f"SELECT incident_id FROM incidents "
        f"WHERE district = '{district}' AND crime_type = '{crime_type}' "
        f"AND date_time >= '{baseline_start}' AND date_time < '{today_start}'"
    )

    today_count = len(zcql.execute_query(today_query))
    baseline_count = len(zcql.execute_query(baseline_query))
    baseline_avg = baseline_count / LOOKBACK_DAYS

    has_enough_history = baseline_count >= MIN_BASELINE_SAMPLE
    if not has_enough_history or baseline_avg == 0:
        return False

    spike_ratio = today_count / baseline_avg
    if spike_ratio < SPIKE_THRESHOLD:
        return False

    datastore = app.datastore()
    table = datastore.table("alerts")
    now = to_catalyst_datetime(now_utc)
    table.insert_row({
        "alert_id": f"{district}_{crime_type}_{now[:10]}_realtime".replace(" ", "_"),
        "district": district,
        "crime_type": crime_type,
        "spike_ratio": round(spike_ratio, 2),
        "generated_at": now
    })

    # Notify — best-effort, chained directly (no Circuits available on IN DC).
    # A mail failure here is logged but doesn't undo the alert already written.
    try:
        send_alert_email(app, district, crime_type, spike_ratio)
    except Exception as mail_err:
        import logging
        logging.getLogger().error(f"send_alert_email failed (alert was still recorded): {mail_err}")

    return True