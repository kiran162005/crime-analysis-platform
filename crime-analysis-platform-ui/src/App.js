
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NetworkGraph from './pages/NetworkGraph';
 
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Investigator gets case-level network/link access; Admin has full access too. */}
          <Route
            path="/network-graph"
            element={
              <ProtectedRoute allowedRoles={['investigator', 'admin']}>
                <NetworkGraph />
              </ProtectedRoute>
            }
          />
          {/* Admin-only example route — add real admin page later */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div style={{ padding: 40 }}>Admin panel — build this next.</div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
 
export default App;