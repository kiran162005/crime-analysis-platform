/**
 * pages/Login.jsx
 * Minimal mock login — picks one of the seeded mock users. Swap for a
 * real form + API Gateway auth call once the Team Lead's endpoint is up.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@scrb.gov.in', label: 'SCRB Admin (full access)' },
  { email: 'officer.mysuru@scrb.gov.in', label: 'District Officer — Mysuru' },
  { email: 'investigator@scrb.gov.in', label: 'Investigator' },
];

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
        background: '#f9fafb',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          width: 340,
        }}
      >
        <h2 style={{ margin: '0 0 4px' }}>Karnataka Crime Analytics</h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
          Sign in to continue (demo accounts — no real auth yet)
        </p>

        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            onClick={() => handleLogin(acc.email)}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 12px',
              marginBottom: 8,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {acc.label}
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{acc.email}</div>
          </button>
        ))}

        {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}