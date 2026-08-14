import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from './Logo';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const supplierUrl = import.meta.env.VITE_SUPPLIER_APP_URL;
  const adminUrl = import.meta.env.VITE_ADMIN_APP_URL;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
      {/* Top Banner */}
      <div style={{ background: '#0F1C2E', color: '#94A3B8', fontSize: 12, padding: '6px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span>🇮🇳 India's B2B Wholesale Marketplace · Connecting Verified Manufacturers & Buyers</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {supplierUrl && (
              <a href={supplierUrl} target="_blank" rel="noreferrer" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'none' }}>
                Supplier Portal ↗
              </a>
            )}
            {supplierUrl && adminUrl && <span style={{ color: '#334155' }}>|</span>}
            {adminUrl && (
              <a href={adminUrl} target="_blank" rel="noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                Admin Console ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        {/* Official ALLZON Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo height={38} />
        </Link>

        {/* Hamburger Button (Mobile Only) */}
        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px' }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full md:w-auto md:flex-1 order-3 md:order-none mt-2 md:mt-0" style={{ maxWidth: 480, display: 'flex', position: 'relative' }}>
          <input
            type="text"
            className="input-base"
            placeholder="Search products, categories, or manufacturers on ALLZON..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingRight: 40, height: 42, fontSize: 13.5 }}
          />
          <button type="submit" style={{ position: 'absolute', right: 4, top: 4, bottom: 4, width: 34, background: '#F97316', border: 'none', borderRadius: 4, color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🔍
          </button>
        </form>

        {/* Navigation Links */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 20 }}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Home</Link>
          <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Products</Link>
          <Link to="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Categories</Link>
          <Link to="/suppliers" className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Suppliers</Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: 12 }}>
                👤 {user.buyerProfile?.fullName || 'My Account'}
              </Link>
              <button onClick={() => logout()} className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 12 }}>
              Login / Register
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${isActive('/') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Home</Link>
          <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${isActive('/products') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Products</Link>
          <Link to="/categories" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${isActive('/categories') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Categories</Link>
          <Link to="/suppliers" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Suppliers</Link>
          
          <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
          
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 14px', fontSize: 13, justifyContent: 'center' }}>
                👤 {user.buyerProfile?.fullName || 'My Account'}
              </Link>
              <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="btn-ghost" style={{ padding: '10px 12px', fontSize: 13, justifyContent: 'center' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary" style={{ textDecoration: 'none', padding: '10px 16px', fontSize: 13, justifyContent: 'center' }}>
              Login / Register
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
