import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import SupplierDirectoryPage from './pages/SupplierDirectoryPage';
import SupplierProfilePage from './pages/SupplierProfilePage';
import EnquiryPage from './pages/EnquiryPage';
import BuyerDashboard from './pages/BuyerDashboard';
import LoginPage from './pages/LoginPage';
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
        <Navbar />
        <div style={{ flex: 1 }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductListingPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/suppliers" element={<SupplierDirectoryPage />} />
              <Route path="/suppliers/:slug" element={<SupplierProfilePage />} />
              <Route path="/enquiry" element={<EnquiryPage />} />
              <Route path="/dashboard" element={<BuyerDashboard />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
        <Footer />
      </div>
    </Router>
  );
}
