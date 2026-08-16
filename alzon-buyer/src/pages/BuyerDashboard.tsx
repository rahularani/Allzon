import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { user, isInitializing, logout } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeSection = searchParams.get('section') || 'enquiries';
  
  const queryClient = useQueryClient();

  const setActiveSection = (section: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('section', section);
      return newParams;
    });
  };

  const { data: enquiries = [], isLoading: isEnquiriesLoading, isError: isEnqError } = useQuery({
    queryKey: ['buyerEnquiries'],
    queryFn: async () => (await api.get('/enquiries/buyer/mine')).data.data || [],
    enabled: !!user && !isInitializing,
    refetchInterval: 15000,
  });

  const { data: wishlist = [], isLoading: isWishlistLoading, isError: isWishError } = useQuery({
    queryKey: ['buyerWishlist'],
    queryFn: async () => (await api.get('/wishlist')).data.data || [],
    enabled: !!user && !isInitializing,
  });

  const { data: notifications = [], isLoading: isNotifLoading, isError: isNotifError } = useQuery({
    queryKey: ['buyerNotifications'],
    queryFn: async () => (await api.get('/notifications')).data.data?.notifications || [],
    enabled: !!user && !isInitializing,
  });

  const loading = isEnquiriesLoading || isWishlistLoading || isNotifLoading;
  const error = (isEnqError || isWishError || isNotifError) ? 'Failed to load dashboard data. Please try again.' : null;

  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'BUYER') {
        useAuthStore.setState({ accessToken: null, user: null });
        navigate('/login');
      }
    }
  }, [user, isInitializing, navigate]);

  const removeWishlistMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerWishlist'] });
    },
    onError: (err) => {
      console.error('Failed to remove item', err);
    }
  });

  const handleRemoveWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeWishlistMutation.mutate(id);
  };

  if (isInitializing) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="flex-col md:flex-row" style={{ display: 'flex', minHeight: 'calc(100vh - 100px)', background: '#F8FAFC' }}>
      {/* Mobile Header (Only visible on mobile) */}
      <div className="md:hidden flex justify-between items-center p-4 bg-[#0F1C2E] text-white">
        <div className="font-bold">Buyer Dashboard</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px' }}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`w-full md:w-[260px] shrink-0 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`} style={{ background: '#0F1C2E', padding: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, background: '#1B3A6B', border: '2px solid #274d8a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#FFFFFF' }}>
              {user.buyerProfile?.fullName?.[0] || 'B'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#FFFFFF' }}>
                {user.buyerProfile?.fullName || 'Buyer'}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{user.buyerProfile?.businessName || 'Verified Buyer'}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 0' }}>
          {[
            { key: 'enquiries', label: 'My Enquiries', icon: '📋', count: enquiries.length },
            { key: 'wishlist', label: 'Saved Items', icon: '❤️', count: wishlist.length },
            { key: 'notifications', label: 'Notifications', icon: '🔔', count: notifications.filter((n: any) => !n.isRead).length },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => { setActiveSection(item.key as any); setIsMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                cursor: 'pointer',
                background: activeSection === item.key ? 'rgba(249,115,22,0.15)' : 'transparent',
                borderLeft: activeSection === item.key ? '4px solid #F97316' : '4px solid transparent',
                color: activeSection === item.key ? '#F97316' : '#94A3B8',
                fontWeight: activeSection === item.key ? 700 : 500,
                fontSize: 14,
                fontFamily: 'var(--font-display)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span style={{ background: activeSection === item.key ? '#F97316' : '#334155', color: '#FFFFFF', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  {item.count}
                </span>
              )}
            </div>
          ))}

          <div
            onClick={() => logout()}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', cursor: 'pointer', color: '#EF4444', fontSize: 14, fontFamily: 'var(--font-display)', marginTop: 24, fontWeight: 500 }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span>Logout Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full" style={{ flex: 1, padding: '20px md:40px', maxWidth: 1000, overflowX: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Loading dashboard data...</div>
        ) : error ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: '#EF4444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Dashboard Error</h3>
            <p style={{ fontSize: 14 }}>{error}</p>
          </div>
        ) : activeSection === 'enquiries' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Submitted Enquiries ({enquiries.length})
              </h2>
            </div>

            {enquiries.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>No Enquiries Yet</h3>
                <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>You haven't submitted any wholesale enquiries yet.</p>
                <Link to="/products" className="btn-primary" style={{ textDecoration: 'none' }}>Browse Products</Link>
              </div>
            ) : (
              <div className="card w-full overflow-x-auto">
                <div style={{ minWidth: 800 }}>
                  <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr', padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Supplier</span>
                    <span>Product / Subject</span>
                    <span>Quantity</span>
                    <span>Date Submitted</span>
                    <span>Status</span>
                  </div>
                  {enquiries.map((enq: any) => (
                    <div key={enq.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{enq.supplier?.businessName}</span>
                      <span style={{ color: '#334155' }}>{enq.product?.name || 'General Requirement'}</span>
                      <span style={{ color: '#475569' }}>{enq.quantity}</span>
                      <span style={{ color: '#64748B', fontSize: 13 }}>{new Date(enq.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>
                        <span className={`badge-${enq.status.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          {enq.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'wishlist' ? (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Saved Wishlist Items ({wishlist.length})
            </h2>
            {wishlist.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>❤️</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>Wishlist is Empty</h3>
                <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>You haven't saved any products or suppliers to your wishlist.</p>
                <Link to="/products" className="btn-primary" style={{ textDecoration: 'none' }}>Browse Marketplace</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {wishlist.map((item: any) => (
                  <Link 
                    to={item.itemType === 'PRODUCT' ? `/products/${item.product?.slug}` : `/suppliers/${item.supplier?.slug}`} 
                    key={item.id} 
                    className="card" 
                    style={{ padding: 20, display: 'block', textDecoration: 'none', color: 'inherit', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  >
                    <button 
                      onClick={(e) => handleRemoveWishlist(item.id, e)}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}
                      title="Remove from wishlist"
                    >
                      ×
                    </button>
                    {item.itemType === 'PRODUCT' ? (
                      <div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Saved Product</div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, margin: '0 0 10px', color: '#0F172A', paddingRight: 20 }}>{item.product?.name}</h4>
                        <div style={{ color: '#F97316', fontWeight: 800, fontSize: 18 }}>₹{item.product?.priceMin}–₹{item.product?.priceMax}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Saved Supplier</div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, margin: '0 0 10px', color: '#0F172A', paddingRight: 20 }}>{item.supplier?.businessName}</h4>
                        <div style={{ color: '#64748B', fontSize: 13 }}>📍 {item.supplier?.city}, {item.supplier?.state}</div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Notifications
            </h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>You're all caught up!</h3>
                  <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>No new notifications.</p>
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div key={n.id} style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', background: n.isRead ? '#FFFFFF' : '#FEF3C7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(n.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
