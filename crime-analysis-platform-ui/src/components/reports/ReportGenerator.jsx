/**
 * components/reports/ReportGenerator.jsx
 * Triggers the real report-generator Catalyst Function to snapshot the
 * live dashboard (or Slate URL) into a PDF via SmartBrowz, then surfaces
 * a download link if the backend response includes one. See
 * services/reportApi.js for the fetch/response-shape handling.
 */
import React, { useState } from 'react';

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function ReportGenerator() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleGenerate() {
    setStatus(STATUS.LOADING);
    setErrorMessage('');
    try {
      // Lazy import keeps this component's failure mode isolated to itself
      // if reportApi.js has an issue, rather than breaking the whole
      // Dashboard bundle.
      const { generateReport } = await import('../../services/reportApi');
      const data = await generateReport();
      setResult(data);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setErrorMessage(err.message || 'Report generation failed.');
      setStatus(STATUS.ERROR);
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 16,
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Intelligence Report
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: 15, fontFamily: 'var(--font-display)' }}>
            PDF Snapshot of Current Dashboard
          </h3>
        </div>

        <button
          onClick={handleGenerate}
          disabled={status === STATUS.LOADING}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#ffffff',
            background: status === STATUS.LOADING ? 'var(--color-text-faint)' : 'var(--color-accent)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: status === STATUS.LOADING ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {status === STATUS.LOADING ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {status === STATUS.SUCCESS && result && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            fontSize: 13,
            color: '#166534',
          }}
        >
          <div style={{ marginBottom: 4 }}>✅ {result.message || 'Report generated successfully.'}</div>

          {result.downloadUrl ? (
            <a
              href={result.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)', fontWeight: 600 }}
            >
              Download PDF →
            </a>
          ) : (
            <div style={{ color: 'var(--color-text-muted)' }}>
              File stored (
              {result.file?.name || result.file?.id || 'see Catalyst console'}
              ) — no direct download link was returned by the backend yet.
              Retrieve it from Catalyst Console → File Store.
            </div>
          )}
        </div>
      )}

      {status === STATUS.ERROR && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            fontSize: 13,
            color: '#b91c1c',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}