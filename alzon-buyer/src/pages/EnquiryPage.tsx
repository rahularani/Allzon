import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function EnquiryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isInitializing } = useAuthStore();

  const productId = searchParams.get('productId') || '';
  const supplierId = searchParams.get('supplierId') || '';

  const [quantity, setQuantity] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [additionalRequirement, setAdditionalRequirement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login');
    }
  }, [user, isInitializing, navigate]);

  if (isInitializing) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !deliveryLocation) {
      setError('Please fill in quantity and delivery location');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/enquiries', {
        supplierId,
        productId: productId || undefined,
        quantity,
        deliveryLocation,
        additionalRequirement,
      });

      setSubmitted(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: '#D1FAE5', color: '#065F46', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40, fontWeight: 800 }}>
          ✓
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
          Enquiry Sent Successfully!
        </h1>
        <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          Your enquiry has been sent to <strong>{submitted.supplier?.businessName}</strong>. The supplier typically responds within 24 hours.
        </p>

        <div className="card" style={{ padding: 24, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Enquiry ID</div>
              <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 700, marginTop: 3 }}>{submitted.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</div>
              <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 700, marginTop: 3 }}>{submitted.quantity}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Location</div>
              <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 700, marginTop: 3 }}>{submitted.deliveryLocation}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: 14, color: '#16A34A', fontWeight: 700, marginTop: 3 }}>Sent ✓</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px' }}>
            View In Dashboard
          </Link>
          <Link to="/products" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 20px' }}>
            Browse More Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Send Wholesale Requirement
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          Send your quantity & pricing request directly to the supplier.
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {error && (
          <div style={{ padding: 12, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Required Quantity *
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. 500 Pieces, 1000 Kg"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Delivery City / State *
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. Mumbai, Maharashtra"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Additional Specifications / Branding Requirements
            </label>
            <textarea
              className="input-base"
              rows={4}
              placeholder="Mention color preferences, custom logo printing, packaging, target price..."
              value={additionalRequirement}
              onChange={(e) => setAdditionalRequirement(e.target.value)}
            />
          </div>

          <button
            data-testid="enquiry-submit"
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px 0', fontSize: 14 }}
          >
            {submitting ? 'Sending Enquiry...' : 'Submit Wholesale Enquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}
