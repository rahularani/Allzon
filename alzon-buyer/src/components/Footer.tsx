import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const supplierUrl = import.meta.env.VITE_SUPPLIER_APP_URL;

  return (
    <footer style={{ background: '#0F1C2E', color: '#94A3B8', marginTop: 40 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: '#FFFFFF', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                <Logo height={30} />
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#64748B', maxWidth: 260 }}>
              India's B2B wholesale marketplace connecting manufacturers, wholesalers, distributors and bulk buyers.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {['GST Verified', 'MCA Registered', 'SSL Secured'].map((t) => (
                <span key={t} style={{ padding: '3px 8px', background: '#1B3A6B', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.04em' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 16 }}>Marketplace</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Link to="/products" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Browse Products</Link>
              <Link to="/suppliers" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Find Suppliers</Link>
              <Link to="/categories" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Categories</Link>
            </div>
          </div>

          {/* For Suppliers */}
          {supplierUrl && (
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 16 }}>For Suppliers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <a href={supplierUrl} target="_blank" rel="noreferrer" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Sell on Allzon</a>
                <a href={supplierUrl} target="_blank" rel="noreferrer" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Supplier Registration</a>
                <a href={supplierUrl} target="_blank" rel="noreferrer" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Supplier Dashboard</a>
              </div>
            </div>
          )}

          {/* For Buyers */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 16 }}>For Buyers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Link to="/products" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Find Products</Link>
              <Link to="/suppliers" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Compare Suppliers</Link>
              <Link to="/dashboard" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Buyer Dashboard</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 16 }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span style={{ color: '#64748B', fontSize: 13 }}>About Allzon</span>
              <span style={{ color: '#64748B', fontSize: 13 }}>Terms & Privacy</span>
              <span style={{ color: '#64748B', fontSize: 13 }}>Contact Us</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>© 2026 ALLZON Technologies Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
