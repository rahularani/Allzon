import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

export default function SupplierLoginPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Registration profile states
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('MANUFACTURER');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

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
      setUser(meRes.data.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid supplier credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone) return setError('Enter mobile phone number');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { phone, purpose: 'register' });
      setOtpSent(true);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Register supplier user
      const regRes = await api.post('/auth/register', {
        phone,
        password,
        role: 'SUPPLIER',
        email: email || undefined,
      });

      const token = regRes.data.data.accessToken;
      setAccessToken(token);

      // 2. Create Supplier Profile
      await api.post('/suppliers/profile', {
        businessName: businessName || 'My Wholesale Business',
        businessType,
        ownerName: ownerName || 'Owner',
        phone,
        email: email || undefined,
        gstNumber: gstNumber || undefined,
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
      });

      const meRes = await api.get('/auth/me');
      setUser(meRes.data.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo height={44} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          {mode === 'login' ? 'Supplier Portal Login' : 'Register Your Business on ALLZON'}
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {mode === 'login' ? 'Manage your product listings and buyer enquiries' : 'Connect with 100,000+ wholesale buyers across India'}
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {error && (
          <div style={{ padding: 10, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Registered Mobile Phone *</label>
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
              {loading ? 'Authenticating...' : 'Log In to Supplier Portal'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTPAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {step === 1 ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Company / Business Name *</label>
                  <input type="text" className="input-base" placeholder="ABC Garments Pvt Ltd" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Business Type *</label>
                  <select className="input-base" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                    <option value="MANUFACTURER">Manufacturer</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="EXPORTER">Exporter</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Owner / Contact Person *</label>
                  <input type="text" className="input-base" placeholder="Arun Kumar" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Mobile Phone Number *</label>
                  <input type="text" className="input-base" placeholder="Enter mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <button type="button" onClick={handleSendOTP} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 14 }}>
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Enter 6-Digit OTP sent to {phone} *</label>
                  <input type="text" className="input-base" placeholder="Look at dev server console for OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Create Password *</label>
                  <input type="password" className="input-base" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>GST Number (Optional)</label>
                  <input type="text" className="input-base" placeholder="33AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>City & State</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input type="text" className="input-base" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                    <input type="text" className="input-base" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 14 }}>
                  {loading ? 'Completing Registration...' : 'Complete Supplier Onboarding'}
                </button>
              </>
            )}
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          {mode === 'login' ? 'New supplier?' : 'Already registered?'}{' '}
          <span
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setStep(1); }}
            style={{ color: '#F97316', fontWeight: 700, cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Register Your Business' : 'Log In'}
          </span>
        </div>
      </div>
    </div>
  );
}
