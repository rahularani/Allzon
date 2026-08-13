import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SupplierNavbar from './components/SupplierNavbar';
import SupplierLoginPage from './pages/SupplierLoginPage';
import SupplierDashboardPage from './pages/SupplierDashboardPage';
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
        <SupplierNavbar />
        <div style={{ flex: 1 }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<SupplierLoginPage />} />
              <Route path="/dashboard" element={<SupplierDashboardPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </div>
    </Router>
  );
}
