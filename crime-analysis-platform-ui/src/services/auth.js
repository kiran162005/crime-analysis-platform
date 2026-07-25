/**
 * services/auth.js
 * Mock authentication for local dev. Swap `login()`'s body for a real
 * call to your Team Lead's auth endpoint once it exists — keep the
 * same returned user shape ({ name, role, district }) so nothing else
 * needs to change.
 *
 * Roles, per the brief:
 *   - "admin"      -> SCRB Admin: full access, all districts
 *   - "officer"    -> District Officer: their district only
 *   - "investigator" -> Investigator: case-level access to links/network data
 */

const MOCK_USERS = {
  'admin@scrb.gov.in': {
    name: 'SCRB Admin',
    role: 'admin',
    district: null, // null = not restricted to one district
  },
  'officer.mysuru@scrb.gov.in': {
    name: 'Officer — Mysuru',
    role: 'officer',
    district: 'Mysuru',
  },
  'investigator@scrb.gov.in': {
    name: 'Investigator Rao',
    role: 'investigator',
    district: null,
  },
};

const STORAGE_KEY = 'crime_analytics_mock_user';

/** Mock login — accepts any password, looks the email up in MOCK_USERS.
 *  Replace this body with a real fetch() to your auth endpoint later. */
export async function login(email) {
  const user = MOCK_USERS[email.trim().toLowerCase()];
  if (!user) {
    throw new Error('Unknown user. Try admin@scrb.gov.in, officer.mysuru@scrb.gov.in, or investigator@scrb.gov.in');
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}