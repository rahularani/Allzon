import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isInitializing, logout } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'VERIFICATION_STAFF';

  // Active tab state
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stats';
  
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Category creation form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    if (!isInitializing && (!user || (user.role !== 'ADMIN' && user.role !== 'VERIFICATION_STAFF'))) {
      navigate('/login');
    }
  }, [user, isInitializing, navigate]);

  useEffect(() => {
    if (isInitializing || !user) return;

    // Default staff to verification queue tab
    if (isStaff && activeTab === 'stats') {
      setActiveTab('verification');
    }

    async function loadAdminData() {
      try {
        setLoading(true);
        if (isAdmin) {
          const [statsRes, usersRes, verifRes, prodRes, catRes, auditRes] = await Promise.all([
            api.get('/admin/dashboard/stats'),
            api.get('/admin/users'),
            api.get('/verification/queue'),
            api.get('/admin/products'),
            api.get('/categories'),
            api.get('/admin/audit-logs'),
          ]);
          setStats(statsRes.data.data);
          setUsers(usersRes.data.data || []);
          setVerifications(verifRes.data.data || []);
          setProducts(prodRes.data.data || []);
          setCategories(catRes.data.data || []);
          setAuditLogs(auditRes.data.data || []);
        } else {
          // Verification Staff only loads verification queue & pending products
          const [verifRes, prodRes] = await Promise.all([
            api.get('/verification/queue'),
            api.get('/admin/products'),
          ]);
          setVerifications(verifRes.data.data || []);
          setProducts(prodRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load admin data', err);
        setErrorMsg('Failed to load admin dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [user, navigate, isAdmin, isStaff, activeTab]);

  // Actions
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setErrorMsg('');
      const action = currentStatus ? 'suspend' : 'activate';
      await api.put(`/admin/users/${userId}/${action}`);
      setMessage(`User account ${action}d successfully`);

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const handleReviewVerification = async (supplierId: string, status: string) => {
    try {
      setErrorMsg('');
      await api.put(`/verification/${supplierId}/review`, { status, reviewNote: `Status updated to ${status} by admin` });
      setMessage(`Supplier verification set to ${status}`);

      const verifRes = await api.get('/verification/queue');
      setVerifications(verifRes.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to review verification');
    }
  };

  const handleReviewProduct = async (productId: string, status: string) => {
    try {
      setErrorMsg('');
      await api.put(`/admin/products/${productId}/review`, { status });
      setMessage(`Product status set to ${status}`);

      const prodRes = await api.get('/admin/products');
      setProducts(prodRes.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to review product');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      await api.post('/categories', { name: newCatName, description: newCatDesc });
      setMessage('Category created successfully');
      setNewCatName('');
      setNewCatDesc('');

      const catRes = await api.get('/categories');
      setCategories(catRes.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create category');
    }
  };

  if (!user) return null;

  // Role Menu Configuration
  const menuItems = isAdmin
    ? [
        { key: 'stats', label: 'Dashboard Stats', icon: '📊' },
        { key: 'users', label: 'User Management', icon: '👥', count: users.length },
        { key: 'verification', label: 'Supplier Verification Queue', icon: '🛡️', count: verifications.length },
        { key: 'products', label: 'Product Moderation', icon: '📦', count: products.filter((p) => p.status === 'PENDING').length },
        { key: 'categories', label: 'Category Management', icon: '🗂️', count: categories.length },
        { key: 'audit', label: 'Audit Logs', icon: '📜', count: auditLogs.length },
      ]
    : [
        { key: 'verification', label: 'Supplier Verification Queue', icon: '🛡️', count: verifications.length },
        { key: 'products', label: 'Product Moderation', icon: '📦', count: products.filter((p) => p.status === 'PENDING').length },
      ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{ width: 280, background: '#0F1C2E', color: '#FFFFFF', flexShrink: 0, padding: '24px 0', borderRight: '1px solid #E2E8F0' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#FFFFFF', margin: '0 0 4px' }}>
            {isAdmin ? 'System Admin Console' : 'Verification Staff'}
          </h3>
          <div style={{ fontSize: 11, color: '#F87171', fontWeight: 700 }}>
            {user.role} PERMISSIONS
          </div>
        </div>

        <div style={{ padding: '16px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => { setActiveTab(item.key as any); setMessage(''); setErrorMsg(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                cursor: 'pointer',
                background: activeTab === item.key ? 'rgba(220,38,38,0.15)' : 'transparent',
                borderLeft: activeTab === item.key ? '4px solid #DC2626' : '4px solid transparent',
                color: activeTab === item.key ? '#F87171' : '#94A3B8',
                fontWeight: activeTab === item.key ? 700 : 500,
                fontSize: 14,
                fontFamily: 'var(--font-display)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span style={{ background: activeTab === item.key ? '#DC2626' : '#334155', color: '#FFFFFF', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  {item.count}
                </span>
              )}
            </div>
          ))}

          <div
            onClick={async () => { await logout(); navigate('/login'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', color: '#EF4444', fontSize: 14, fontFamily: 'var(--font-display)', marginTop: 40, fontWeight: 500 }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span>Logout Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1400 }}>
        {message && (
          <div style={{ padding: '16px 20px', background: '#D1FAE5', color: '#065F46', border: '1px solid #34D399', borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>✅</span> {message}
          </div>
        )}
        
        {errorMsg && (
          <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171', borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span> {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: '#64748B', fontSize: 16 }}>Loading admin console...</div>
        ) : activeTab === 'stats' && isAdmin ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Platform Overview Stats
            </h1>
            {!stats ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Stats data unavailable</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
                <div className="card" style={{ padding: 24, borderLeft: '4px solid #0F172A' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL USERS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{stats.totalUsers || 0}</div>
                </div>
                <div className="card" style={{ padding: 24, borderLeft: '4px solid #1B3A6B' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL BUYERS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#1B3A6B', marginTop: 8 }}>{stats.totalBuyers || 0}</div>
                </div>
                <div className="card" style={{ padding: 24, borderLeft: '4px solid #F97316' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL SUPPLIERS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#F97316', marginTop: 8 }}>{stats.totalSuppliers || 0}</div>
                </div>
                <div className="card" style={{ padding: 24, borderLeft: '4px solid #16A34A' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>VERIFIED SUPPLIERS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#16A34A', marginTop: 8 }}>{stats.verifiedSuppliers || 0}</div>
                </div>
                <div className="card" style={{ padding: 24, borderLeft: '4px solid #D97706' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PENDING VERIFICATIONS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#D97706', marginTop: 8 }}>{stats.pendingVerifications || 0}</div>
                </div>
                <div className="card" style={{ padding: 24, borderLeft: '4px solid #DC2626' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PENDING PRODUCTS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#DC2626', marginTop: 8 }}>{stats.pendingProducts || 0}</div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'users' && isAdmin ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              User Management ({users.length})
            </h1>

            {users.length === 0 ? (
               <div className="card" style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>No users found.</div>
            ) : (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Phone / Email</span>
                  <span>Role</span>
                  <span>Profile Info</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {users.map((u) => (
                  <div key={u.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', fontSize: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.phone}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{u.email || 'No email provided'}</div>
                    </div>
                    <span>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#334155' }}>
                        {u.role}
                      </span>
                    </span>
                    <span style={{ color: '#475569' }}>
                      {u.buyerProfile?.fullName || u.supplierProfile?.businessName || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Profile not created</span>}
                    </span>
                    <span>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: u.isActive ? '#D1FAE5' : '#FEE2E2', color: u.isActive ? '#065F46' : '#991B1B' }}>
                        {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </span>
                    <div>
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12, color: u.isActive ? '#EF4444' : '#16A34A', border: `1px solid ${u.isActive ? '#FCA5A5' : '#86EFAC'}`, background: '#FFFFFF' }}
                      >
                        {u.isActive ? 'Suspend User' : 'Activate User'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'verification' ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Supplier Verification Queue ({verifications.length})
            </h1>

            {verifications.length === 0 ? (
               <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                 <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
                 <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Queue is Empty</h3>
                 <p style={{ color: '#64748B' }}>No suppliers are currently pending verification.</p>
               </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {verifications.map((v) => (
                  <div key={v.id} className="card" style={{ padding: 24, borderLeft: v.verificationStatus === 'UNDER_REVIEW' ? '4px solid #F59E0B' : '4px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, margin: 0 }}>{v.businessName}</h3>
                          <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>
                            {v.verificationStatus}
                          </span>
                        </div>
                        <div style={{ color: '#475569', fontSize: 14, marginBottom: 4 }}><strong>Owner:</strong> {v.ownerName} | <strong>Type:</strong> {v.businessType}</div>
                        <div style={{ color: '#64748B', fontSize: 13 }}>📍 {v.city}, {v.state} | 📞 {v.phone} | ✉️ {v.email || 'N/A'}</div>
                        <div style={{ color: '#0F172A', fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}>GST: {v.gstNumber || 'N/A'} | PAN: {v.panNumber || 'N/A'}</div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => handleReviewVerification(v.id, 'VERIFIED')} className="btn-primary" style={{ background: '#16A34A', padding: '10px 16px', fontSize: 13 }}>
                          Approve Verification
                        </button>
                        <button onClick={() => handleReviewVerification(v.id, 'REJECTED')} className="btn-primary" style={{ background: '#DC2626', padding: '10px 16px', fontSize: 13 }}>
                          Reject
                        </button>
                      </div>
                    </div>
                    
                    {v.verificationDocs && v.verificationDocs.length > 0 && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Submitted Documents:</h4>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {v.verificationDocs.map((doc: any) => (
                            <div key={doc.id} style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC', minWidth: 200 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{doc.documentType.replace('_', ' ')}</div>
                              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>{doc.fileName}</div>
                              {doc.url ? (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1B3A6B', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  📄 View Document
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: 12 }}>No file available</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'products' ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Product Moderation Queue ({products.length})
            </h1>

            {products.length === 0 ? (
               <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                 <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                 <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Queue is Empty</h3>
                 <p style={{ color: '#64748B' }}>No products are currently pending moderation.</p>
               </div>
            ) : (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Product Details</span>
                  <span>Supplier</span>
                  <span>Status</span>
                  <span>Moderation Action</span>
                </div>
                {products.map((p) => (
                  <div key={p.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', fontSize: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: '#475569' }}>₹{p.priceMin} - ₹{p.priceMax} | MOQ: {p.moq}</div>
                    </div>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{p.supplier?.businessName}</span>
                    <span>
                      <span className={`badge-${p.status.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {p.status}
                      </span>
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button data-testid="approve-product" onClick={() => handleReviewProduct(p.id, 'APPROVED')} className="btn-primary" style={{ background: '#16A34A', padding: '6px 12px', fontSize: 12 }}>
                        Approve Listing
                      </button>
                      <button data-testid="reject-product" onClick={() => handleReviewProduct(p.id, 'REJECTED')} className="btn-primary" style={{ background: '#DC2626', padding: '6px 12px', fontSize: 12 }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'categories' && isAdmin ? (
          <div style={{ maxWidth: 800 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Category Management ({categories.length})
            </h1>

            <div className="card" style={{ padding: 32, marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Add New Category</h3>
              <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Category Name *</label>
                  <input type="text" className="input-base" placeholder="e.g. Industrial Machinery" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Description</label>
                  <textarea className="input-base" rows={3} placeholder="Brief description..." value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '12px 0', fontSize: 14, width: 200, marginTop: 4 }}>Create Category</button>
              </form>
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Existing Categories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {categories.map((c) => (
                <div key={c.id} className="card" style={{ padding: 16, borderLeft: '4px solid #1B3A6B' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>{c.name}</div>
                  {c.description && <div style={{ fontSize: 13, color: '#64748B' }}>{c.description}</div>}
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 12 }}>Slug: {c.slug}</div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'audit' && isAdmin ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              System Audit Logs ({auditLogs.length})
            </h1>

            {auditLogs.length === 0 ? (
               <div className="card" style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>No audit logs found.</div>
            ) : (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Timestamp</span>
                  <span>Action</span>
                  <span>Entity</span>
                  <span>Performed By</span>
                  <span>Details</span>
                </div>
                {auditLogs.map((log) => (
                  <div key={log.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', alignItems: 'flex-start', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>{new Date(log.createdAt).toLocaleString()}</span>
                    <span style={{ fontWeight: 700, color: '#DC2626' }}>{log.action}</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>{log.entity}</span>
                    <span style={{ color: '#64748B' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{log.user?.phone}</div>
                      <div style={{ fontSize: 11 }}>{log.user?.role}</div>
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569', background: '#F8FAFC', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                      {log.metadata ? JSON.stringify(log.metadata, null, 2) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
