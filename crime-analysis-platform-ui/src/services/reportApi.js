/**
 * services/reportApi.js
 * Calls the real report-generator Catalyst Function (see
 * functions/report-generator/main.py) to convert a dashboard URL into a
 * PDF and store it in Catalyst File Store.
 *
 * NOTE: the exact shape of the "file" object in the response is flagged as
 * unverified in the backend code (folder.upload_file()'s return shape
 * wasn't confirmed against a real Python SDK sample at the time it was
 * written). This client defensively checks several possible field names
 * for a usable download URL rather than assuming one specific shape, and
 * falls back to showing whatever identifying info it does get so the UI
 * never just dies silently on an unexpected shape.
 */

// Set this once the report-generator function's real deployed URL is
// confirmed — see .env.example. Falls back to the API Gateway route
// configured for this function (Console → API Gateway → report-generator-api:
// ANY /api/report/* -> Advanced I/O report-generator), NOT the raw function
// execution URL — direct /server/report-generator/ calls get rejected with
// INVALID_URL once API Gateway is enabled for the project.
const REPORT_API_BASE_URL =
  process.env.REACT_APP_REPORT_API_URL ||
  'https://crime-analysis-platform-60079412156.development.catalystserverless.in/api/report';

/**
 * Trigger report generation.
 * @param {string} [dashboardUrl] - optional URL to screenshot; defaults to
 *   whatever DEFAULT_DASHBOARD_URL is set to on the backend (the Slate URL).
 * @returns {Promise<{message: string, file: object, downloadUrl: string|null}>}
 */
export async function generateReport(dashboardUrl) {
  const params = new URLSearchParams();
  if (dashboardUrl) params.set('url', dashboardUrl);

  const query = params.toString();
  const requestUrl = query
    ? `${REPORT_API_BASE_URL}/?${query}`
    : `${REPORT_API_BASE_URL}/`;

  const res = await fetch(requestUrl, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Report generation failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const file = data.file || {};

  // Defensively probe several plausible field names for a usable link,
  // since the backend's own comments flag this shape as unconfirmed.
  const downloadUrl =
    file.download_url ||
    file.downloadUrl ||
    file.url ||
    file.file_url ||
    (file.content && file.content.download_url) ||
    null;

  return { message: data.message, file, downloadUrl };
}