/**
 * auth/AuthContext.jsx
 * Provides the current user (name/role/district) to the whole app,
 * so any component can ask "what can this person see" without prop-
 * drilling. Wrap <App /> in <AuthProvider> (see App.js).
 */
import React, { createContext, useContext, useState } from 'react';
import { login as loginService, logout as logoutService, getCurrentUser } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  async function login(email) {
    const loggedInUser = await loginService(email);
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    logoutService();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook: const { user, login, logout } = useAuth(); */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}