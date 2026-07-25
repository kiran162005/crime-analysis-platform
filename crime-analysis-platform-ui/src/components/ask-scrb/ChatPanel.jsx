/**
 * ask-scrb/ChatPanel.jsx
 * "Ask SCRB" chat UI — posts free-text queries to the real /chat
 * endpoint (QuickML RAG, confirmed working by the ML Engineer) and
 * renders the answer with source citations. Slides out as a panel
 * rather than a separate page, so it's reachable from any dashboard
 * view without losing context.
 */
import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { askScrb, isMlApiConfigured } from '../../services/mlApi';
import { getMockChatResponse } from '../../data/mockChatResponses';

const SUGGESTED_QUERIES = [
  'What chain snatching incidents have been reported in Bengaluru?',
  'Are there any repeat offenders in Mysuru?',
  'Summarize recent burglary trends in Kalaburagi.',
];

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const apiConfigured = isMlApiConfigured();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function sendQuery(query) {
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);

    try {
      const result = await askScrb(query);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: result.answer || 'No answer returned.', sources: result.sources || [] },
      ]);
    } catch (err) {
      // A network-level failure (TypeError: Failed to fetch) means the
      // service isn't reachable at all — likely not deployed yet. Fall
      // back to a clearly-labeled simulated answer rather than a dead
      // end. A reachable-but-erroring response (e.g. 502 token expiry)
      // is a real backend problem and should surface as an error instead
      // of being silently masked by a fake answer.
      const isUnreachable = err instanceof TypeError;

      if (isUnreachable) {
        const mock = getMockChatResponse(query);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: mock.answer,
            sources: mock.sources,
            isSimulated: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: err.message, isError: true },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        width: 380,
        height: 520,
        background: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--color-navy-950)',
          borderRadius: '14px 14px 0 0',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>
            Ask SCRB
          </div>
          <div style={{ color: '#8fa3c2', fontSize: 11 }}>Query FIR records via QuickML</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#8fa3c2', fontSize: 18, cursor: 'pointer' }}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--color-bg)' }}>
        {!apiConfigured && (
          <div
            style={{
              fontSize: 12,
              color: '#92400e',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: '8px 10px',
              marginBottom: 12,
            }}
          >
            ML service not yet deployed — set <code>REACT_APP_ML_API_URL</code> in <code>.env</code> once it's live.
            You can still try queries below to see the UI flow.
          </div>
        )}
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Ask a free-text question about incidents, offenders, or trends. Answers cite the source
              FIR records they're drawn from.
            </p>
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: 12,
                  padding: '8px 10px',
                  marginBottom: 6,
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} sources={m.sources} isError={m.isError} isSimulated={m.isSimulated} />
        ))}

        {loading && (
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', paddingLeft: 4 }}>
            SCRB is retrieving relevant records…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuery(input);
        }}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--color-border)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about incidents, offenders, trends…"
          style={{
            flex: 1,
            fontSize: 13,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: loading || !input.trim() ? '#d1d5db' : 'var(--color-accent)',
            color: '#ffffff',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}