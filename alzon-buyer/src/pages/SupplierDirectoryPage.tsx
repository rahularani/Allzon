import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function SupplierDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  const query = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || '';
  const verifiedParam = searchParams.get('verified') === 'true';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const businessTypes = [
    'MANUFACTURER',
    'WHOLESALER',
    'DISTRIBUTOR',
    'DEALER',
    'TRADER',
    'IMPORTER',
    'EXPORTER'
  ];

  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/suppliers', {
          params: {
            q: query || undefined,
            type: typeParam || undefined,
            verified: searchParams.get('verified') || undefined,
            page: pageParam,
          },
        });
        setSuppliers(res.data.data || []);
        setMeta(res.data.meta);
      } catch (err: any) {
        console.error('Failed to fetch suppliers', err);
        setError(err.response?.data?.message || 'Failed to load suppliers. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).elements.search.value;
    updateParam('q', input || null);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, flexDirection: 'row', flexWrap: 'wrap' }}>
      
      {/* Sidebar Filters */}
      <aside style={{ width: 260, flexShrink: 0 }}>
        <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: 100 }}>
          <div style={{ padding: '16px 20px', background: '#1B3A6B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>Filters</span>
            <button
              onClick={clearFilters}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              Clear All
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="filter-section" style={{ marginBottom: 24 }}>
              <div className="filter-label" style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Business Type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span
                  onClick={() => updateParam('type', null)}
                  style={{ fontSize: 13, color: !typeParam ? '#F97316' : '#374151', fontWeight: !typeParam ? 700 : 400, cursor: 'pointer' }}
                >
                  All Types
                </span>
                {businessTypes.map((type) => (
                  <span
                    key={type}
                    onClick={() => updateParam('type', type)}
                    style={{ fontSize: 13, color: typeParam === type ? '#F97316' : '#374151', fontWeight: typeParam === type ? 700 : 400, cursor: 'pointer' }}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="filter-section" style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={verifiedParam}
                  onChange={(e) => updateParam('verified', e.target.checked ? 'true' : null)}
                />
                Verified Only
              </label>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-label">Verified Directory</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
              Indian Manufacturers & Wholesalers
            </h1>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              Showing {suppliers.length} of {meta?.total || suppliers.length} suppliers
            </div>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              name="search"
              className="input-base"
              placeholder="Search business name or city..."
              defaultValue={query}
              style={{ width: 280, height: 40 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: 40 }}>
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Searching suppliers...</div>
        ) : error ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: '#EF4444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Error</h3>
            <p style={{ fontSize: 14 }}>{error}</p>
            <button onClick={() => updateParam('page', '1')} className="btn-secondary" style={{ marginTop: 16 }}>Retry</button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No suppliers found</h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {suppliers.map((supp) => (
                <div key={supp.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 56, height: 56, background: '#1B3A6B', color: '#FFFFFF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
                      {supp.logoUrl ? (
                        <img src={supp.logoUrl} alt={supp.businessName} style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
                      ) : (
                        supp.businessName[0]
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{supp.businessName}</h2>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        {supp.businessType.charAt(0) + supp.businessType.slice(1).toLowerCase()} · {supp.city}, {supp.state}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 6, fontSize: 12, marginBottom: 16 }}>
                    <span>⭐ {supp.rating || '4.8'} Rating</span>
                    {supp.verificationStatus === 'VERIFIED' ? (
                      <span className="verified-badge">✓ GST Verified</span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>Unverified</span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <Link to={`/suppliers/${supp.slug}`} className="btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', display: 'block', padding: '10px 0', fontSize: 12 }}>
                      View Supplier Profile
                    </Link>
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
