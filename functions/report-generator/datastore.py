"""
Report generation: dashboard HTML/URL -> PDF (SmartBrowz) -> stored file (File Store).

Uses File Store, not Stratus, because Stratus is in Early Access mode and
requires emailing support@zohocatalyst.com for access — not viable inside
a hackathon timeline. Swap to Stratus later if/when EA access comes through;
the SmartBrowz PDF-generation half of this doesn't change either way, only
the storage call at the end would.
"""

FOLDER_ID = "55774000000043442"  # Console → File Store → your folder


def generate_report_pdf(app, source, is_url=True, pdf_options=None):
    """Generate a PDF from either a dashboard URL or a raw HTML snapshot.
    source: URL string, or HTML string if is_url=False.
    Returns the raw result from SmartBrowz — verify its actual shape (bytes
    vs. stream vs. dict-with-content-key) on first real test; I don't have a
    confirmed Python sample of the result object's structure, only the call
    signature itself."""
    smart_browz = app.smart_browz()

    options = pdf_options or {
        "format": "A4",
        "scale": 1,
        "display_header_footer": True,
        "print_background": True,
        "landscape": False,
    }

    result = smart_browz.convert_to_pdf(
        source,
        pdf_options=options,
        page_options={
            "viewport": {"width": 1440, "height": 900},
            "javascript_enabled": True,
        },
        navigation_options={"timeout": 15000, "wait_until": "networkidle0"},
    )

    import logging
    logger = logging.getLogger()
    logger.info(f"generate_report_pdf: result type={type(result)}")

    # Confirmed via real runtime log: convert_to_pdf() returns a raw
    # requests.Response object, not bytes directly — the PDF content lives
    # in .content. Extracting it here so callers always get plain bytes.
    if hasattr(result, "content"):
        pdf_bytes = result.content
        status = getattr(result, "status_code", None)
        logger.info(f"generate_report_pdf: extracted {len(pdf_bytes)} bytes, status={status}")
        return pdf_bytes

    # Fallback in case the SDK's return shape differs in some other code path
    logger.info(f"generate_report_pdf: no .content attribute, returning raw result as-is")
    return result


def store_report(app, pdf_result, file_name):
    """Upload the generated PDF to File Store. Returns file details
    (including whatever ID/URL Catalyst assigns) so the caller can hand a
    link back to the dashboard.

    NOTE: app.filestore()/.folder()/.upload_file() naming is inferred from
    the consistent Node/Java/Flutter SDK pattern, not a directly confirmed
    Python code sample — verify method names on first real deploy/test."""
    filestore = app.filestore()
    folder = filestore.folder(FOLDER_ID)

    # Confirmed via real runtime error: the SDK wants an actual
    # io.BufferedReader (what open(path, 'rb') returns), not io.BytesIO —
    # despite both being "file-like," the SDK's internal type check appears
    # to reject BytesIO specifically. Writing to a real temp file to get a
    # genuine BufferedReader instance.
    import tempfile
    import os

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_result)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as file_handle:
            uploaded = folder.upload_file(name=file_name, file=file_handle)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return uploaded