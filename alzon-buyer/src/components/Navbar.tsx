import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from './Logo';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
      {/* Top Banner */}
      <div style={{ background: '#0F1C2E', color: '#94A3B8', fontSize: 12, padding: '6px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span>🇮🇳 India's B2B Wholesale Marketplace · Connecting Verified Manufacturers & Buyers</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="http://localhost:5174" target="_blank" rel="noreferrer" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'none' }}>
              Supplier Portal ↗
            </a>
            <span style={{ color: '#334155' }}>|</span>
            <a href="http://localhost:5175" target="_blank" rel="noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Admin Console ↗
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        {/* Official ALLZON Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo height={38} />
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: '1 1 200px', maxWidth: 480, display: 'flex', position: 'relative' }}>
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
        <nav style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
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
    </header>
  );
}
