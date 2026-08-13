import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes, suppRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?featured=true&limit=6'),
          api.get('/suppliers?verified=true&limit=4'),
        ]);
        setCategories(catRes.data.data || []);
        setProducts(prodRes.data.data || []);
        setSuppliers(suppRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch home page data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ background: '#0F1C2E', color: '#FFFFFF', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <span style={{ display: 'inline-block', background: 'rgba(249, 115, 22, 0.15)', color: '#F97316', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 16 }}>
            ✨ India's Premier B2B Sourcing Platform
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, color: '#FFFFFF' }}>
            Source Directly from Verified <br />
            <span style={{ color: '#F97316' }}>Indian Manufacturers & Wholesalers</span>
          </h1>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Connect with 50,000+ GST-verified manufacturers and bulk distributors. Send direct enquiries with zero middleman commission.
          </p>

          {/* Hero Search Box */}
          <form onSubmit={handleSearch} style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 8, background: '#FFFFFF', padding: 8, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <input
              type="text"
              placeholder="What wholesale products are you looking for? (e.g. Cotton T-Shirts, LED Floodlights)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', padding: '12px 16px', fontSize: 15 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
              Search Wholesale
            </button>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section style={{ maxWidth: 1280, margin: '48px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div className="section-label">Top Categories</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Explore Wholesale Markets</h2>
          </div>
          <Link to="/categories" style={{ color: '#F97316', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>View All Categories →</Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading categories...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{cat.icon || '📦'}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>{cat.name}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{cat.subcategories?.length || 0} Subcategories</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div className="section-label">Featured Sourcing</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Trending Wholesale Products</h2>
          </div>
          <Link to="/products" style={{ color: '#F97316', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Browse All Products →</Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading products...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {products.map((prod) => (
              <div key={prod.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img
                  src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&fit=crop'}
                  alt={prod.name}
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="verified-badge">✓ Verified Supplier</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1B3A6B' }}>MOQ: {prod.moq || 100} {prod.moqUnit || 'Pcs'}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>{prod.name}</h3>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#F97316', marginBottom: 12 }}>
                    ₹{prod.priceMin}–₹{prod.priceMax} <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>/{prod.priceUnit || 'Piece'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>🏭 {prod.supplier?.businessName} · 📍 {prod.supplier?.city}, {prod.supplier?.state}</div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <Link to={`/products/${prod.slug}`} className="btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '8px 12px', fontSize: 12 }}>
                      Send Enquiry
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Suppliers */}
      <section style={{ maxWidth: 1280, margin: '56px auto 48px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div className="section-label">Verified Partners</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Top Verified Manufacturers</h2>
          </div>
          <Link to="/suppliers" style={{ color: '#F97316', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>View Directory →</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {suppliers.map((supp) => (
            <div key={supp.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: '#1B3A6B', color: '#FFFFFF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
                  {supp.businessName[0]}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>{supp.businessName}</h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{supp.businessType} · {supp.city}, {supp.state}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                <span>⭐ {supp.rating || '4.8'} / 5.0</span>
                <span className="verified-badge">✓ Verified</span>
              </div>
              <Link to={`/suppliers/${supp.slug}`} className="btn-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', display: 'block', padding: '8px 0', fontSize: 12 }}>
                View Supplier Profile
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
