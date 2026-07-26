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
    """Generate a PDF snapshot of a live dashboard URL.

    IMPORTANT — confirmed via Catalyst's own console-generated SDK snippet:
    convert_to_pdf() takes raw HTML *content*, it does NOT navigate to a URL
    despite earlier docs implying otherwise (that's what caused the "URL
    printed as literal text" bug). Only take_screenshot() does real browser
    navigation with JS rendering. So for a live URL, this does it in two
    steps: screenshot the real rendered page, then wrap that image in a
    minimal HTML document and convert THAT to PDF.

    If is_url=False, `source` is already raw HTML and skips the screenshot
    step entirely, going straight to convert_to_pdf()."""
    import base64
    import logging
    logger = logging.getLogger()

    smart_browz = app.smart_browz()

    if is_url:
        screenshot_result = smart_browz.take_screenshot(
            source=source,
            screenshot_options={"type": "jpeg", "quality": 90, "full_page": True},
            page_options={
                "viewport": {"width": 1440, "height": 900},
                "javascript_enabled": True,
            },
            navigation_options={"timeout": 15000, "wait_until": "networkidle0"},
        )
        image_bytes = screenshot_result.content if hasattr(screenshot_result, "content") else screenshot_result
        logger.info(f"generate_report_pdf: screenshot captured, {len(image_bytes)} bytes")

        b64_image = base64.b64encode(image_bytes).decode("ascii")
        html_content = (
            f'<html><body style="margin:0;padding:0;">'
            f'<img src="data:image/jpeg;base64,{b64_image}" style="width:100%;" />'
            f'</body></html>'
        )
    else:
        html_content = source

    options = pdf_options or {
        "format": "A4",
        "scale": 1,
        "display_header_footer": True,
        "print_background": True,
        "landscape": False,
    }

    result = smart_browz.convert_to_pdf(source=html_content, pdf_options=options)

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