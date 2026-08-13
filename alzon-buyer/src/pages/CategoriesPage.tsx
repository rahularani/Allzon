import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="section-label">All Categories</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Explore Wholesale Industry Sectors
        </h1>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Loading categories...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {cat.icon || '📦'}
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    <Link to={`/products?category=${cat.slug}`} style={{ color: '#0F172A', textDecoration: 'none' }}>{cat.name}</Link>
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>{cat.description || 'Wholesale market category'}</p>
                </div>
              </div>

              {cat.subcategories?.length > 0 && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Subcategories</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cat.subcategories.map((sub: any) => (
                      <Link
                        key={sub.id}
                        to={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                        style={{ padding: '4px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 12, color: '#1B3A6B', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
