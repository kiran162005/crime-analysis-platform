/**
 * layout/AppHeader.jsx
 * Shared command-bar header for every authenticated page — replaces the
 * ad hoc header markup duplicated in Dashboard.jsx and NetworkGraph.jsx.
 * Navy bar for authority/officialdom, shield emblem mark, role pill,
 * nav links gated the same way the routes already are.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function ShieldMark() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 0L25 4.5V13.5C25 21 20 26.5 13 30C6 26.5 1 21 1 13.5V4.5L13 0Z"
        fill="#c2410c"
      />
      <path
        d="M13 3.3L22 6.7V13.5C22 19.3 18.2 23.8 13 26.6C7.8 23.8 4 19.3 4 13.5V6.7L13 3.3Z"
        fill="#101d33"
      />
      <circle cx="13" cy="14" r="4.2" fill="#f4f5f7" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: null },
  { to: '/network-graph', label: 'Network Graph', roles: ['investigator', 'admin'] },
];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header
      style={{
        background: 'var(--color-navy-950)',
        borderBottom: '1px solid var(--color-navy-800)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldMark />
          <div>
            <div style={{ color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
              Karnataka SCRB
            </div>
            <div style={{ color: '#8fa3c2', fontSize: 11, letterSpacing: '0.03em' }}>
              Crime Analytics Platform
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 4, marginLeft: 28 }}>
            {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: 6,
                    color: isActive ? '#ffffff' : '#9db1cf',
                    background: isActive ? 'var(--color-navy-800)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
          </div>
          <span className="badge-pill">{user?.role}</span>
          <button
            onClick={logout}
            style={{
              fontSize: 12,
              color: '#9db1cf',
              background: 'transparent',
              border: '1px solid var(--color-navy-700)',
              borderRadius: 6,
              padding: '5px 10px',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
