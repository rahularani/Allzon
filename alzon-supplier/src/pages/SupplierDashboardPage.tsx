import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function SupplierDashboardPage() {
  const navigate = useNavigate();
  const { user, isInitializing, logout } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeTab = searchParams.get('tab') || 'overview';
  
  const queryClient = useQueryClient();

  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };

  const { data: supplierProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['supplierProfile'],
    queryFn: async () => (await api.get('/suppliers/profile/me')).data.data,
    enabled: !!user && !isInitializing,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['supplierProducts'],
    queryFn: async () => (await api.get('/products/supplier/mine')).data.data || [],
    enabled: !!user && !isInitializing,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data || [],
    enabled: !!user && !isInitializing,
  });

  const { data: enquiries = [], isLoading: isEnquiriesLoading } = useQuery({
    queryKey: ['supplierEnquiries'],
    queryFn: async () => (await api.get('/enquiries/supplier/received')).data.data || [],
    enabled: !!user && !isInitializing,
    refetchInterval: 15000,
  });

  const loading = isProfileLoading || isProductsLoading || isEnquiriesLoading;

  // Product Form State
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodPriceMin, setProdPriceMin] = useState('');
  const [prodPriceMax, setProdPriceMax] = useState('');
  const [prodMoq, setProdMoq] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImages, setProdImages] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !prodCatId) {
      setProdCatId(categories[0].id);
    }
  }, [categories, prodCatId]);

  const resetForm = () => {
    setEditProductId(null);
    setProdName('');
    setProdCatId(categories.length > 0 ? categories[0].id : '');
    setProdPriceMin('');
    setProdPriceMax('');
    setProdMoq('');
    setProdDesc('');
    setProdImages(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Verification Doc Upload State
  const [docType, setDocType] = useState('GST_CERTIFICATE');
  const [docFile, setDocFile] = useState<File | null>(null);

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'SUPPLIER') {
        useAuthStore.setState({ accessToken: null, user: null });
        navigate('/login');
      }
    }
  }, [user, isInitializing, navigate]);

  const saveProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      let productId = editProductId;
      if (editProductId) {
        await api.put(`/products/${editProductId}`, payload.data);
      } else {
        const productRes = await api.post('/products', payload.data);
        productId = productRes.data.data.id;
      }

      if (payload.images && payload.images.length > 0) {
        const formData = new FormData();
        Array.from(payload.images as FileList).forEach(file => {
          formData.append('images', file);
        });
        await api.post(`/products/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierProducts'] });
      setMessage(editProductId ? 'Product updated successfully! 🎉' : 'Product submitted successfully! 🎉');
      resetForm();
      setTimeout(() => {
        setActiveTab('products');
        setMessage('');
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || (editProductId ? 'Failed to update product' : 'Failed to add product'));
    }
  });

  const savingProduct = saveProductMutation.isPending;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');

    const payload = {
      name: prodName,
      categoryId: prodCatId,
      priceMin: parseFloat(prodPriceMin) || 100,
      priceMax: parseFloat(prodPriceMax) || 150,
      moq: parseInt(prodMoq, 10) || 50,
      description: prodDesc,
    };
    saveProductMutation.mutate({ data: payload, images: prodImages });
  };

  const handleEditClick = (product: any) => {
    setEditProductId(product.id);
    setProdName(product.name || '');
    setProdCatId(product.categoryId || '');
    setProdPriceMin(product.priceMin?.toString() || '');
    setProdPriceMax(product.priceMax?.toString() || '');
    setProdMoq(product.moq?.toString() || '');
    setProdDesc(product.description || '');
    setProdImages(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('add_product');
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierProducts'] });
      setMessage('Product deleted successfully.');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to delete product');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  });

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    deleteProductMutation.mutate(productId);
  };

  const uploadDocMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await api.post('/verification/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierProfile'] });
      setMessage('Verification document uploaded! Status updated to Under Review.');
      setDocFile(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Upload failed');
    }
  });

  const uploadingDoc = uploadDocMutation.isPending;

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      setErrorMsg('Please select a document to upload');
      return;
    }
    setMessage('');
    setErrorMsg('');
    const formData = new FormData();
    formData.append('documentType', docType);
    formData.append('document', docFile);
    uploadDocMutation.mutate(formData);
  };

  const updateEnquiryStatusMutation = useMutation({
    mutationFn: async ({ enquiryId, status }: { enquiryId: string; status: string }) => {
      await api.put(`/enquiries/${enquiryId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierEnquiries'] });
    },
    onError: (err) => {
      console.error('Failed to update status', err);
    }
  });

  const handleUpdateEnquiryStatus = (enquiryId: string, status: string) => {
    updateEnquiryStatusMutation.mutate({ enquiryId, status });
  };

  if (isInitializing) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="flex-col md:flex-row" style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', background: '#F8FAFC' }}>
      {/* Mobile Header (Only visible on mobile) */}
      <div className="md:hidden flex justify-between items-center p-4 bg-[#0F1C2E] text-white">
        <div className="font-bold">Supplier Dashboard</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px' }}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`w-full md:w-[260px] shrink-0 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`} style={{ background: '#0F1C2E', color: '#FFFFFF', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 data-testid="supplier-business-name" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#FFFFFF', margin: '0 0 4px' }}>
            {supplierProfile?.businessName || 'Supplier Console'}
          </h3>
          <div style={{ fontSize: 11, color: '#F97316', fontWeight: 700 }}>
            {supplierProfile?.verificationStatus === 'VERIFIED' ? '✓ VERIFIED SUPPLIER' : '⏳ VERIFICATION PENDING'}
          </div>
        </div>

        <div style={{ padding: '16px 0' }}>
          {[
            { key: 'overview', label: 'Dashboard Overview', icon: '📊' },
            { key: 'products', label: 'My Products', icon: '📦', count: products.length },
            { key: 'add_product', label: 'Add New Product', icon: '➕' },
            { key: 'enquiries', label: 'Buyer Enquiries', icon: '📩', count: enquiries.length },
            { key: 'verification', label: 'Verification Docs', icon: '🛡️' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => { 
                setActiveTab(item.key as any); 
                setMessage(''); 
                setErrorMsg(''); 
                setIsMobileMenuOpen(false);
                if (item.key === 'add_product') resetForm();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                cursor: 'pointer',
                background: activeTab === item.key ? 'rgba(249,115,22,0.15)' : 'transparent',
                borderLeft: activeTab === item.key ? '4px solid #F97316' : '4px solid transparent',
                color: activeTab === item.key ? '#F97316' : '#94A3B8',
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
                <span style={{ background: activeTab === item.key ? '#F97316' : '#334155', color: '#FFFFFF', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  {item.count}
                </span>
              )}
            </div>
          ))}

          <div
            onClick={async () => { await logout(); navigate('/login'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', color: '#EF4444', fontSize: 14, fontFamily: 'var(--font-display)', marginTop: 40, fontWeight: 500 }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span>Logout Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full" style={{ flex: 1, padding: '20px md:40px', maxWidth: 1200, overflowX: 'hidden' }}>
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
          <div style={{ padding: 80, textAlign: 'center', color: '#64748B', fontSize: 16 }}>Loading supplier portal...</div>
        ) : activeTab === 'overview' ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Supplier Dashboard Overview
            </h1>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
              <div className="card" style={{ padding: 24, borderLeft: '4px solid #1B3A6B' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Products</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{products.length}</div>
              </div>
              <div className="card" style={{ padding: 24, borderLeft: '4px solid #F97316' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Received Enquiries</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#F97316', marginTop: 8 }}>{enquiries.length}</div>
              </div>
              <div className="card" style={{ padding: 24, borderLeft: supplierProfile?.verificationStatus === 'VERIFIED' ? '4px solid #16A34A' : '4px solid #D97706' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Status</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: supplierProfile?.verificationStatus === 'VERIFIED' ? '#16A34A' : '#D97706', marginTop: 12 }}>
                  {supplierProfile?.verificationStatus || 'PENDING'}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, margin: 0 }}>Business Information</h3>
                {supplierProfile?.logoUrl && (
                  <img src={supplierProfile.logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0' }} />
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, fontSize: 14 }}>
                <div data-testid="supplier-business-name-info">
                  <div style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Business Name</div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{supplierProfile?.businessName}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Business Type</div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{supplierProfile?.businessType}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Owner Name</div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{supplierProfile?.ownerName}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>GST Number</div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{supplierProfile?.gstNumber || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{supplierProfile?.city}, {supplierProfile?.state}</div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                My Product Listings ({products.length})
              </h1>
              <button onClick={() => { resetForm(); setActiveTab('add_product'); }} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                + Add New Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>No Products Yet</h3>
                <p style={{ color: '#64748B', marginBottom: 24 }}>Start adding your wholesale products to reach more buyers.</p>
                <button onClick={() => { resetForm(); setActiveTab('add_product'); }} className="btn-primary">Add Your First Product</button>
              </div>
            ) : (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-header hidden md:grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Product Name</span>
                  <span>Price Range</span>
                  <span>MOQ</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {products.map((p: any) => (
                  <div key={p.id} className="table-row grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] items-start md:items-center gap-4 md:gap-0" style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0].url} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📷</div>
                      )}
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-xs text-gray-500 block">Price Range</span>
                      <span style={{ fontWeight: 600, color: '#475569' }}>₹{p.priceMin} - ₹{p.priceMax}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-xs text-gray-500 block">MOQ</span>
                      <span style={{ color: '#475569' }}>{p.moq} {p.moqUnit || 'Pcs'}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-xs text-gray-500 block mb-1">Status</span>
                      <span className={`badge-${p.status.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: '8px' }}>
                      <button onClick={() => handleEditClick(p)} style={{ background: '#EEF2FF', padding: '6px 16px', borderRadius: '4px', border: '1px solid #C7D2FE', cursor: 'pointer', fontSize: 14, color: '#3B82F6', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} style={{ background: '#FEF2F2', padding: '6px 16px', borderRadius: '4px', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 14, color: '#EF4444', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'add_product' ? (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editProductId ? 'Edit Wholesale Product' : 'Add New Wholesale Product'}
              </h1>
              {editProductId && (
                <button 
                  onClick={resetForm} 
                  className="btn-secondary" style={{ padding: '8px 16px', fontSize: 14 }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="card" style={{ padding: 32 }}>
              <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Product Name *</label>
                  <input type="text" className="input-base" placeholder="e.g. Bio-washed Cotton Round Neck T-Shirt" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Category *</label>
                  <select className="input-base" value={prodCatId} onChange={(e) => setProdCatId(e.target.value)} required>
                    <option value="" disabled>Select a category</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Min Price (₹) *</label>
                    <input type="number" className="input-base" placeholder="120" value={prodPriceMin} onChange={(e) => setProdPriceMin(e.target.value)} required min="1" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Max Price (₹) *</label>
                    <input type="number" className="input-base" placeholder="150" value={prodPriceMax} onChange={(e) => setProdPriceMax(e.target.value)} required min="1" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Minimum Order Quantity (MOQ) *</label>
                  <input type="number" className="input-base" placeholder="100" value={prodMoq} onChange={(e) => setProdMoq(e.target.value)} required min="1" />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Product Images</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/jpeg, image/png, image/webp"
                    onChange={(e) => setProdImages(e.target.files)} 
                    ref={fileInputRef}
                    className="input-base"
                    style={{ paddingTop: 8 }}
                  />
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>You can select up to 8 images (JPG, PNG, WebP)</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Product Description</label>
                  <textarea className="input-base" rows={5} placeholder="Mention fabric GSM, specifications, available colors, dimensions..." value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
                </div>

                <button data-testid="add-product-submit" type="submit" disabled={savingProduct} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15, marginTop: 8 }}>
                  {savingProduct ? (editProductId ? 'Updating...' : 'Submitting...') : (editProductId ? 'Update Product' : 'Submit Product for Review')}
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'enquiries' ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Received Buyer Enquiries ({enquiries.length})
            </h1>

            {enquiries.length === 0 ? (
               <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                 <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
                 <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>No Enquiries Yet</h3>
                 <p style={{ color: '#64748B' }}>When buyers request quotes or information, they'll appear here.</p>
               </div>
            ) : (
              <div className="card w-full overflow-x-auto">
                <div style={{ minWidth: 800 }}>
                  <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Buyer Details</span>
                    <span>Requirement</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>
                  {enquiries.map((enq: any) => (
                    <div key={enq.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', fontSize: 14 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{enq.buyer?.fullName}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{enq.buyer?.businessName}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>📞 {enq.buyer?.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>{enq.product ? enq.product.name : 'General Enquiry'}</div>
                        <div style={{ fontSize: 13 }}>Qty: <strong>{enq.quantity}</strong></div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>📍 {enq.deliveryLocation}</div>
                      </div>
                      <span>
                        <span className={`badge-${enq.status.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          {enq.status}
                        </span>
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {enq.status === 'PENDING' && (
                          <button onClick={() => handleUpdateEnquiryStatus(enq.id, 'CONTACTED')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, background: '#FFFFFF' }}>
                            Mark Contacted
                          </button>
                        )}
                        <button onClick={() => handleUpdateEnquiryStatus(enq.id, 'RESPONDED')} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 800 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
              Business Verification Documents
            </h1>

            <div className="card" style={{ padding: 32, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Verification Status</h3>
                  <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>Upload documents to get the Verified Supplier badge.</p>
                </div>
                <div style={{ 
                  background: supplierProfile?.verificationStatus === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                  color: supplierProfile?.verificationStatus === 'VERIFIED' ? '#065F46' : '#92400E',
                  padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                  border: `1px solid ${supplierProfile?.verificationStatus === 'VERIFIED' ? '#6EE7B7' : '#FCD34D'}`
                }}>
                  {supplierProfile?.verificationStatus || 'PENDING'}
                </div>
              </div>

              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Upload New Document</h4>
              <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Document Type *</label>
                    <select className="input-base" value={docType} onChange={(e) => setDocType(e.target.value)}>
                      <option value="GST_CERTIFICATE">GST Certificate</option>
                      <option value="PAN">PAN Card</option>
                      <option value="BUSINESS_PROOF">Business Registration Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Upload PDF or Image *</label>
                    <input 
                      type="file" 
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)} 
                      accept=".pdf, image/jpeg, image/png, image/webp"
                      className="input-base"
                      style={{ paddingTop: 8 }}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" disabled={uploadingDoc} className="btn-primary" style={{ padding: '12px 0', fontSize: 14, width: '200px' }}>
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>

            {supplierProfile?.verificationDocs && supplierProfile.verificationDocs.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Uploaded Documents</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {supplierProfile.verificationDocs.map((doc: any) => (
                    <div key={doc.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>
                          {doc.documentType.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`badge-${doc.status.toLowerCase()}`} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
