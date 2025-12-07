import React from 'react';
import { Navigate } from 'react-router-dom';

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem('authToken') ||
    window.sessionStorage.getItem('authToken')
  );
}

export default function ProtectedRoute({ children }) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
