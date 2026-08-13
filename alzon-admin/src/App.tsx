import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminNavbar from './components/AdminNavbar';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNavbar />
        <div style={{ flex: 1 }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<AdminLoginPage />} />
              <Route path="/dashboard" element={<AdminDashboardPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </div>
    </Router>
  );
}
