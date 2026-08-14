import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minMOQ = searchParams.get('minMOQ') || '';
  const verifiedParam = searchParams.get('verified') === 'true';

  // Local state for filter inputs
  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });
  const [moqValue, setMoqValue] = useState(minMOQ);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products', {
            params: {
              q: query || undefined,
              category: categoryParam || undefined,
              sort: sortParam,
              page: pageParam,
              minPrice: searchParams.get('minPrice') || undefined,
              maxPrice: searchParams.get('maxPrice') || undefined,
              minMOQ: searchParams.get('minMOQ') || undefined,
              verified: searchParams.get('verified') || undefined,
            },
          }),
          api.get('/categories'),
        ]);

        setProducts(prodRes.data.data || []);
        setMeta(prodRes.data.meta);
        setCategories(catRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch products', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page'); // Reset page when filters change
    setSearchParams(params);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (priceRange.min) params.set('minPrice', priceRange.min); else params.delete('minPrice');
    if (priceRange.max) params.set('maxPrice', priceRange.max); else params.delete('maxPrice');
    if (moqValue) params.set('minMOQ', moqValue); else params.delete('minMOQ');
    params.delete('page');
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' });
    setMoqValue('');
    setSearchParams(new URLSearchParams(query ? { q: query } : {}));
  };

  return (
    <div className="flex-col md:flex-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* Filter Sidebar */}
      <aside className="w-full md:w-[260px] shrink-0">
        <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: 100 }}>
          <div style={{ padding: '16px 20px', background: '#1B3A6B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>Filters</span>
            <button
              onClick={clearAllFilters}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              Clear All
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Category Filter */}
            <div className="filter-section" style={{ marginBottom: 24 }}>
              <div className="filter-label" style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Categories</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span
                  onClick={() => updateParam('category', null)}
                  style={{ fontSize: 13, color: !categoryParam ? '#F97316' : '#374151', fontWeight: !categoryParam ? 700 : 400, cursor: 'pointer' }}
                >
                  All Categories
                </span>
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    onClick={() => updateParam('category', cat.slug)}
                    style={{ fontSize: 13, color: categoryParam === cat.slug ? '#F97316' : '#374151', fontWeight: categoryParam === cat.slug ? 700 : 400, cursor: 'pointer' }}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-section" style={{ marginBottom: 24 }}>
              <div className="filter-label" style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Price Range (₹)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 13 }}
                />
                <span style={{ color: '#64748B' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 13 }}
                />
              </div>
            </div>

            {/* MOQ Filter */}
            <div className="filter-section" style={{ marginBottom: 24 }}>
              <div className="filter-label" style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Minimum Order Qty</div>
              <input
                type="number"
                placeholder="Max MOQ (e.g. 50)"
                value={moqValue}
                onChange={(e) => setMoqValue(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            {/* Verified Supplier Toggle */}
            <div className="filter-section" style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={verifiedParam}
                  onChange={(e) => updateParam('verified', e.target.checked ? 'true' : null)}
                />
                Verified Suppliers Only
              </label>
            </div>

            <button onClick={handleApplyFilters} className="btn-primary" style={{ width: '100%', padding: '10px' }}>
              Apply Filters
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {query ? `Search results for "${query}"` : 'Wholesale Products'}
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              Showing {products.length} of {meta?.total || products.length} products
            </div>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortParam}
              onChange={(e) => updateParam('sort', e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-body)' }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="moq_asc">MOQ: Low to High</option>
              <option value="rating">Supplier Rating</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Searching products...</div>
        ) : error ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: '#EF4444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Error</h3>
            <p style={{ fontSize: 14 }}>{error}</p>
            <button onClick={() => updateParam('page', '1')} className="btn-secondary" style={{ marginTop: 16 }}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No products found</h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {products.map((prod) => (
                <div key={prod.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <img
                    src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&fit=crop'}
                    alt={prod.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover' }}
                  />
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      {prod.supplier?.verificationStatus === 'VERIFIED' ? (
                        <span className="verified-badge">✓ Verified</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94A3B8', padding: '2px 6px', background: '#F1F5F9', borderRadius: 4 }}>Unverified</span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1B3A6B' }}>MOQ: {prod.moq || 100} {prod.moqUnit || 'Pcs'}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>{prod.name}</h3>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#F97316', marginBottom: 12 }}>
                      ₹{prod.priceMin}–₹{prod.priceMax} <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>/{prod.priceUnit || 'Piece'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>🏭 {prod.supplier?.businessName} · 📍 {prod.supplier?.city}, {prod.supplier?.state}</div>
                    <div style={{ marginTop: 'auto' }}>
                      <Link to={`/products/${prod.slug}`} className="btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', display: 'block', padding: '8px 0', fontSize: 12 }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40 }}>
                <button
                  className="btn-secondary"
                  disabled={pageParam <= 1}
                  onClick={() => updateParam('page', (pageParam - 1).toString())}
                  style={{ padding: '8px 16px' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                  Page {pageParam} of {meta.totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={pageParam >= meta.totalPages}
                  onClick={() => updateParam('page', (pageParam + 1).toString())}
                  style={{ padding: '8px 16px' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
