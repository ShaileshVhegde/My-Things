import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, getToken } = useAuth();

  // Wait for /me fetch to complete before deciding
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bgBase">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}
