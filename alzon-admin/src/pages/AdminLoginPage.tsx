import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { phone, password });
      const token = res.data.data.accessToken;
      setAccessToken(token);

      const meRes = await api.get('/auth/me');
      const currentUser = meRes.data.data;

      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'VERIFICATION_STAFF') {
        setError('Access denied. Only Admin and Verification Staff can access this console.');
        return;
      }

      setUser(currentUser);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo height={44} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Admin & Moderation Console
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          Log in with Admin or Verification Staff credentials
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {error && (
          <div style={{ padding: 10, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Admin / Staff Phone *</label>
            <input
              type="text"
              className="input-base"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Password *</label>
            <input
              type="password"
              className="input-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button data-testid="login-submit" type="submit" disabled={loading} className="btn-primary" style={{ background: '#DC2626', width: '100%', padding: '12px 0', fontSize: 14, marginTop: 8 }}>
            {loading ? 'Authenticating...' : 'Enter Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
