import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.data);
      } catch (err: any) {
        console.error('Failed to fetch product details', err);
        setError(err.response?.data?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleSendEnquiry = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/enquiry?productId=${product.id}&supplierId=${product.supplier.id}`);
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setWishlisting(true);
      await api.post('/wishlist', {
        itemType: 'PRODUCT',
        productId: product.id,
      });
      setWishlisted(true);
    } catch (err) {
      console.error('Failed to add to wishlist', err);
    } finally {
      setWishlisting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#64748B' }}>Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#0F172A' }}>{error || 'Product Not Found'}</h2>
        <Link to="/products" className="btn-primary" style={{ textDecoration: 'none', marginTop: 16, display: 'inline-block' }}>Browse Products</Link>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&fit=crop' }];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
        <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link> /{' '}
        <Link to="/products" style={{ color: '#64748B', textDecoration: 'none' }}>Products</Link> /{' '}
        <Link to={`/products?category=${product.category?.slug}`} style={{ color: '#64748B', textDecoration: 'none' }}>{product.category?.name}</Link> /{' '}
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
        {/* Images Column */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            <img
              src={images[selectedImgIndex]?.url}
              alt={product.name}
              style={{ width: '100%', height: 400, objectFit: 'cover' }}
            />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {images.map((img: any, idx: number) => (
                <div
                  key={img.id || idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 6,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImgIndex === idx ? '2px solid #F97316' : '1px solid #E2E8F0',
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Column */}
        <div style={{ flex: 1.5, minWidth: 280 }}>
          <div className="flex-col md:flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              {product.supplier?.verificationStatus === 'VERIFIED' && (
                <span className="verified-badge" style={{ marginBottom: 10, display: 'inline-block' }}>✓ Verified Sourcing</span>
              )}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 12, lineHeight: 1.3 }}>
                {product.name}
              </h1>
            </div>
            <button
              onClick={handleAddToWishlist}
              disabled={wishlisting || wishlisted}
              style={{
                background: wishlisted ? '#FEF3C7' : '#F8FAFC',
                border: wishlisted ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                color: wishlisted ? '#B45309' : '#475569',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: (wishlisting || wishlisted) ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {wishlisted ? '❤️ Saved' : '🤍 Save to Wishlist'}
            </button>
          </div>

          <div style={{ padding: '16px 20px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, marginBottom: 24, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#C2410C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wholesale Price</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#EA580C', marginTop: 4 }}>
              ₹{product.priceMin}–₹{product.priceMax} <span style={{ fontSize: 14, fontWeight: 500, color: '#9A3412' }}>/{product.priceUnit || 'Piece'}</span>
            </div>
            <div style={{ fontSize: 13, color: '#7C2D12', marginTop: 6 }}>
              Minimum Order Quantity: <strong>{product.moq || 100} {product.moqUnit || 'Pieces'}</strong>
            </div>
            {product.availableQty !== undefined && product.availableQty !== null && (
              <div style={{ fontSize: 13, color: '#7C2D12', marginTop: 6 }}>
                Availability: <strong>{product.availableQty} {product.moqUnit || 'Pieces'} In Stock</strong>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Product Specifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
              {product.brand && (
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Brand</span>
                  <strong style={{ color: '#0F172A' }}>{product.brand}</strong>
                </div>
              )}
              {product.material && (
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Material</span>
                  <strong style={{ color: '#0F172A' }}>{product.material}</strong>
                </div>
              )}
              {product.color && (
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Color</span>
                  <strong style={{ color: '#0F172A' }}>{product.color}</strong>
                </div>
              )}
              {product.size && (
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Size</span>
                  <strong style={{ color: '#0F172A' }}>{product.size}</strong>
                </div>
              )}
              <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Supply Ability</span>
                <strong style={{ color: '#0F172A' }}>{product.supplyAbility || 'Contact Supplier'}</strong>
              </div>
              <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Delivery Time</span>
                <strong style={{ color: '#0F172A' }}>{product.deliveryTime || 'Contact Supplier'}</strong>
              </div>
            </div>
            
            {/* Custom Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                {product.specifications.map((spec: any) => (
                  <div key={spec.id} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>{spec.key}</span>
                    <strong style={{ color: '#0F172A' }}>{spec.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Description</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
              {product.description || 'High quality wholesale product available for bulk order.'}
            </p>
          </div>
          
          {product.packagingDetails && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Packaging Details</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0 }}>{product.packagingDetails}</p>
            </div>
          )}
        </div>

        {/* Supplier Info Sidebar Card */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 100 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Sold By</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, background: '#1B3A6B', color: '#FFFFFF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
                {product.supplier?.businessName[0]}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {product.supplier?.businessName}
                </h3>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  {product.supplier?.businessType}
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              📍 {product.supplier?.city}, {product.supplier?.state}
            </div>
            
            {product.supplier?.verificationStatus === 'VERIFIED' && (
              <div className="verified-badge" style={{ marginBottom: 20, display: 'inline-block' }}>
                ✓ GST Verified Supplier
              </div>
            )}

            <button
              onClick={handleSendEnquiry}
              className="btn-primary"
              style={{ width: '100%', padding: '14px 0', fontSize: 14, marginBottom: 12 }}
            >
              📋 Send Wholesale Enquiry
            </button>

            <Link
              to={`/suppliers/${product.supplier?.slug}`}
              className="btn-secondary"
              style={{ width: '100%', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', display: 'block', padding: '12px 0', fontSize: 13 }}
            >
              View Supplier Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
