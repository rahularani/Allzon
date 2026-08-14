import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Register BUYER
        const regRes = await api.post('/auth/register', {
          phone,
          password,
          role: 'BUYER',
        });

        const token = regRes.data.data.accessToken;
        setAccessToken(token);

        // Create Buyer Profile
        await api.post('/buyers/profile', {
          fullName: fullName || 'Buyer User',
          businessName: businessName || undefined,
        });

        const meRes = await api.get('/auth/me');
        setUser(meRes.data.data);
      } else {
        // Login
        const loginRes = await api.post('/auth/login', {
          phone,
          password,
        });

        const token = loginRes.data.data.accessToken;
        setAccessToken(token);

        const meRes = await api.get('/auth/me');
        setUser(meRes.data.data);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo height={44} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          {isRegister ? 'Create Buyer Account' : 'Welcome Back to ALLZON'}
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {isRegister ? 'Sign up to source directly from manufacturers' : 'Log in to manage your wholesale enquiries'}
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {error && (
          <div style={{ padding: 10, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="Rajan Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Company / Shop Name</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="Mehta Retail Pvt Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Mobile Phone Number *</label>
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

          <button data-testid="login-submit" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 14, marginTop: 8 }}>
            {loading ? 'Please wait...' : isRegister ? 'Register Account' : 'Log In'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ color: '#F97316', fontWeight: 700, cursor: 'pointer' }}
          >
            {isRegister ? 'Log In' : 'Register Now'}
          </span>
        </div>
      </div>
    </div>
  );
}
