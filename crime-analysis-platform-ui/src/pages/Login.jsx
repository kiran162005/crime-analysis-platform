/**
 * pages/Login.jsx
 * Minimal mock login, matching the app's navy/shield identity from
 * AppHeader — this is the first screen anyone sees. Swap for a real
 * form + API Gateway auth call once the Team Lead's endpoint is up.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@scrb.gov.in', label: 'SCRB Admin', hint: 'Full access, all districts' },
  { email: 'officer.mysuru@scrb.gov.in', label: 'District Officer', hint: 'Locked to Mysuru' },
  { email: 'investigator@scrb.gov.in', label: 'Investigator', hint: 'Case-level network access' },
];

function ShieldMark() {
  return (
    <svg width="40" height="46" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0L25 4.5V13.5C25 21 20 26.5 13 30C6 26.5 1 21 1 13.5V4.5L13 0Z" fill="#c2410c" />
      <path d="M13 3.3L22 6.7V13.5C22 19.3 18.2 23.8 13 26.6C7.8 23.8 4 19.3 4 13.5V6.7L13 3.3Z" fill="#101d33" />
      <circle cx="13" cy="14" r="4.2" fill="#f4f5f7" />
    </svg>
  );
}

export default function Login() {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(email) {
    setError('');
    try {
      await login(email);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-navy-950)',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, var(--color-navy-800) 0%, transparent 45%), radial-gradient(circle at 85% 80%, var(--color-navy-800) 0%, transparent 40%)',
      }}
    >
      <div style={{ width: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <ShieldMark />
          <div>
            <div style={{ color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>
              Karnataka SCRB
            </div>
            <div style={{ color: '#8fa3c2', fontSize: 12, letterSpacing: '0.03em' }}>
              Crime Analytics Platform
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#ffffff' }}>
          <span className="eyebrow">Sign in</span>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '0 0 18px' }}>
            Demo accounts — no real authentication yet.
          </p>

          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => handleLogin(acc.email)}
              style={{
                display: 'block',
                width: '100%',
                padding: '11px 14px',
                marginBottom: 8,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text)',
              }}
            >
              {acc.label}
              <div style={{ fontSize: 11, color: 'var(--color-text-faint)', fontWeight: 400, marginTop: 2 }}>
                {acc.hint}
              </div>
            </button>
          ))}

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}