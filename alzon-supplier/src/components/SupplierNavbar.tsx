import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from './Logo';

export default function SupplierNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <header style={{ background: '#0F1C2E', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#FFFFFF', padding: '4px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}>
            <Logo height={30} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(249,115,22,0.15)', padding: '3px 8px', borderRadius: 4 }}>
            SUPPLIER PORTAL
          </span>
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>
              🏢 {user.supplierProfile?.businessName || user.phone}
            </span>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="btn-ghost"
              style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)', padding: '6px 12px', fontSize: 12 }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 12 }}>
            Supplier Login / Register
          </Link>
        )}
      </div>
    </header>
  );
}
