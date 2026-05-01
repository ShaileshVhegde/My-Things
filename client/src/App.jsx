import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Eager loaded (auth pages - small)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Lazy loaded (app pages)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const AddProductPage = lazy(() => import('./pages/AddProductPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bgBase">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <div className="bg-bgBase min-h-screen text-textPrimary">
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><DashboardPage /></ProtectedRoute>
                } />
                <Route path="/products" element={
                  <ProtectedRoute><ProductsPage /></ProtectedRoute>
                } />
                <Route path="/products/add" element={
                  <ProtectedRoute><AddProductPage /></ProtectedRoute>
                } />
                <Route path="/products/:id" element={
                  <ProtectedRoute><ProductDetailsPage /></ProtectedRoute>
                } />
                <Route path="/analyze" element={
                  <ProtectedRoute><AnalyzePage /></ProtectedRoute>
                } />
                <Route path="/about" element={
                  <ProtectedRoute><AboutPage /></ProtectedRoute>
                } />

                {/* Admin */}
                <Route path="/admin" element={
                  <AdminRoute><AdminOverviewPage /></AdminRoute>
                } />
                <Route path="/admin/users" element={
                  <AdminRoute><AdminUsersPage /></AdminRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
          </div>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
