/**
 * ask-scrb/MessageBubble.jsx
 * Single chat message — user or assistant. Assistant messages show
 * source citations from QuickML's RAG retrieval when present, since
 * that's the strong demo point the brief calls out explicitly.
 */
import React, { useState } from 'react';

export default function MessageBubble({ role, text, sources = [], isError = false, isSimulated = false }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = role === 'user';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{ maxWidth: '80%' }}>
        {isSimulated && (
          <div style={{ fontSize: 10, color: '#a16207', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Simulated — live service not yet reachable
          </div>
        )}
        <div
          style={{
            background: isUser ? 'var(--color-navy-900)' : isError ? '#fef2f2' : isSimulated ? '#fefce8' : '#f4f5f7',
            color: isUser ? '#ffffff' : isError ? '#b91c1c' : 'var(--color-text)',
            border: isError ? '1px solid #fecaca' : isSimulated ? '1px solid #fde68a' : 'none',
            borderRadius: 12,
            borderBottomRightRadius: isUser ? 4 : 12,
            borderBottomLeftRadius: isUser ? 12 : 4,
            padding: '10px 14px',
            fontSize: 14,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>

        {!isUser && sources.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <button
              onClick={() => setSourcesOpen((v) => !v)}
              style={{
                fontSize: 11,
                color: 'var(--color-accent)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 600,
              }}
            >
              {sourcesOpen ? 'Hide' : 'Show'} {sources.length} source{sources.length === 1 ? '' : 's'} ▾
            </button>

            {sourcesOpen && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sources.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {src.document_title || src.document_id || 'Source'}
                    </div>
                    {src.content_preview && (
                      <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {src.content_preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}