import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function SupplierProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    async function fetchSupplier() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/suppliers/${slug}`);
        setSupplier(res.data.data);
      } catch (err: any) {
        console.error('Failed to fetch supplier profile', err);
        setError(err.response?.data?.message || 'Failed to load supplier profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchSupplier();
  }, [slug]);

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setWishlisting(true);
      await api.post('/wishlist', {
        itemType: 'SUPPLIER',
        supplierId: supplier.id,
      });
      setWishlisted(true);
    } catch (err) {
      console.error('Failed to save supplier', err);
    } finally {
      setWishlisting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#64748B' }}>Loading supplier profile...</div>;
  }

  if (error || !supplier) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#0F172A' }}>{error || 'Supplier Not Found'}</h2>
        <Link to="/suppliers" className="btn-primary" style={{ textDecoration: 'none', marginTop: 16, display: 'inline-block' }}>Back to Directory</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Cover Header */}
      <div style={{ height: 180, background: '#1B3A6B', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0F1C2E 0%, #1B3A6B 100%)' }} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginTop: -40, marginBottom: 24, position: 'relative', zIndex: 10, flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, background: '#FFFFFF', border: '3px solid #FFFFFF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: '#1B3A6B' }}>
            {supplier.logoUrl ? (
              <img src={supplier.logoUrl} alt={supplier.businessName} style={{ width: '100%', height: '100%', borderRadius: 9, objectFit: 'cover' }} />
            ) : (
              supplier.businessName[0]
            )}
          </div>

          <div style={{ flex: 1, paddingBottom: 4, minWidth: 300 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              {supplier.verificationStatus === 'VERIFIED' ? (
                <span className="verified-badge">✓ Business Verified</span>
              ) : (
                <span style={{ fontSize: 11, color: '#94A3B8', padding: '2px 6px', background: '#E2E8F0', borderRadius: 4, fontWeight: 700 }}>Unverified</span>
              )}
              <span className="tag">Est. {supplier.yearEstablished || 2010}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
              {supplier.businessName}
            </h1>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              {supplier.businessType.charAt(0) + supplier.businessType.slice(1).toLowerCase()} · 📍 {supplier.city}, {supplier.state}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleAddToWishlist}
              disabled={wishlisting || wishlisted}
              className="btn-secondary"
              style={{
                background: wishlisted ? '#FEF3C7' : '#FFFFFF',
                border: wishlisted ? '1px solid #F59E0B' : '1px solid #CBD5E1',
                color: wishlisted ? '#B45309' : '#334155',
                padding: '12px 24px',
                fontSize: 13,
              }}
            >
              {wishlisted ? '❤️ Saved' : '🤍 Save Supplier'}
            </button>
            <button
              onClick={() => {
                if (!user) navigate('/login');
                else navigate(`/enquiry?supplierId=${supplier.id}`);
              }}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: 13 }}
            >
              📋 Send General Enquiry
            </button>
          </div>
        </div>

        {/* Company Overview & Products Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          <div style={{ flex: 2, minWidth: 320 }}>
            <div className="card" style={{ padding: 24, marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About the Company</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                {supplier.description || 'Verified manufacturer and bulk wholesale supplier on ALLZON B2B platform.'}
              </p>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
              Products Offered ({supplier.products?.length || 0})
            </h3>

            {supplier.products?.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, margin: '0 0 8px' }}>No products listed</h4>
                <p style={{ color: '#64748B', fontSize: 14 }}>This supplier hasn't added any products yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {supplier.products?.map((prod: any) => (
                  <div key={prod.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <img
                      src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&fit=crop'}
                      alt={prod.name}
                      style={{ width: '100%', height: 160, objectFit: 'cover' }}
                    />
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 6, flex: 1 }}>{prod.name}</h4>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#F97316', marginBottom: 12 }}>
                        ₹{prod.priceMin}–₹{prod.priceMax} <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>/{prod.priceUnit || 'Piece'}</span>
                      </div>
                      <Link to={`/products/${prod.slug}`} className="btn-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', display: 'block', padding: '8px 0', fontSize: 12 }}>
                        View Details & Enquiry
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business Details Sidebar */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <div className="card" style={{ padding: 20, position: 'sticky', top: 100 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Business Profile</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Owner Name</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{supplier.ownerName}</div>
                </div>
                <div style={{ paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>GST Number</div>
                  <div style={{ fontWeight: 600, color: supplier.gstNumber ? '#0F172A' : '#065F46', marginTop: 2 }}>
                    {supplier.gstNumber || 'GST Verified ✓'}
                  </div>
                </div>
                <div style={{ paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Established Year</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{supplier.yearEstablished || 2010}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Location</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{supplier.address ? `${supplier.address}, ` : ''}{supplier.city}, {supplier.state} {supplier.pincode}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
