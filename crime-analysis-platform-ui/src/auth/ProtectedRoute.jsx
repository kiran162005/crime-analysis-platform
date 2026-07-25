/**
 * auth/ProtectedRoute.jsx
 * Wrap any <Route element={...}> with this to require login, and
 * optionally restrict to specific roles. The backend enforces the real
 * security boundary — this just keeps the UI honest about what a role
 * is allowed to navigate to, instead of showing-then-hiding data.
 *
 * Usage:
 *   <Route path="/admin" element={
 *     <ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>
 *   } />
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <h2 style={{ color: '#111827' }}>Access restricted</h2>
        <p>Your role ({user.role}) doesn't have access to this page.</p>
      </div>
    );
  }

  return children;
}