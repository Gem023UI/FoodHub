import { useState, useEffect } from "react";
import { VendorHeader } from "../components/VendorHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import "../styles/VendorStall.css";

interface VendorStallPageProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function VendorStallPage({ token, onNavigate, onLogout }: VendorStallPageProps) {
  const [stall, setStall] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendorData();
  }, [token]);

  async function fetchVendorData() {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 Fetching vendor data from /api/users/me");
      
      // First get vendor info
      const vendorRes = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      console.log(`📡 /api/users/me response status: ${vendorRes.status}`);

      if (!vendorRes.ok) {
        const errorText = await vendorRes.text();
        console.error(`❌ Vendor fetch failed: ${vendorRes.status} - ${errorText}`);
        throw new Error(`Failed to fetch vendor data: ${vendorRes.status}`);
      }

      const vendorData = await vendorRes.json();
      console.log("✅ Vendor data received:", vendorData);
      console.log("✅ Vendor stallId:", vendorData.stallId);
      setVendor(vendorData);

      // Check if vendor has a stall
      const stallId = vendorData.stallId;
      
      if (stallId) {
        console.log(`🔄 Fetching stall data for stallId: ${stallId}`);
        
        const stallRes = await fetch(`/api/stalls/${stallId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        console.log(`📡 /api/stalls/${stallId} response status: ${stallRes.status}`);

        if (!stallRes.ok) {
          const errorText = await stallRes.text();
          console.error(`❌ Stall fetch failed: ${stallRes.status} - ${errorText}`);
          throw new Error(`Failed to fetch stall data: ${stallRes.status}`);
        }

        const stallData = await stallRes.json();
        console.log("✅ Stall data received:", stallData);
        setStall(stallData.stall || stallData);

        // ─── FETCH PRODUCTS ──────────────────────────────────────────────
        console.log(`🔄 Fetching products for stallId: ${stallId}`);
        
        const productsRes = await fetch(`/api/stalls/${stallId}/products`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        console.log(`📡 /api/stalls/${stallId}/products response status: ${productsRes.status}`);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          console.log(`✅ Products data received:`, productsData);
          setProducts(productsData.products || []);
          console.log(`✅ Total products: ${productsData.products?.length || 0}`);
        } else {
          console.error(`❌ Failed to fetch products: ${productsRes.status}`);
          setProducts([]);
        }
      } else {
        console.warn("⚠️ Vendor has no stallId:", vendorData);
        setError("You are not assigned to any stall yet. Please contact admin.");
      }
    } catch (err) {
      console.error("❌ Error in fetchVendorData:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="vendor-stall-page">
        <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
        <div className="vendor-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (error || !stall) {
    return (
      <div className="vendor-stall-page">
        <VendorHeader 
          onNavigate={onNavigate} 
          token={token} 
          stallName={vendor?.stallData?.name || undefined}
          onLogout={onLogout}
        />
        <div className="vendor-error-container">
          <div className="error-icon">⚠️</div>
          <h2>No Stall Assigned</h2>
          <p>{error || "You don't have a stall assigned yet. Please contact the administrator."}</p>
          <button onClick={() => onNavigate("vendor-profile")} className="contact-btn">
            Contact Admin
          </button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const heroPhoto = stall.photos && stall.photos.length > 0 ? stall.photos[0] : null;
  const openingTime = stall.openingTime || stall.openingHours || "Not set";

  return (
    <div className="vendor-stall-page">
      <VendorHeader 
        onNavigate={onNavigate} 
        token={token} 
        stallName={stall.name}
        onLogout={onLogout}
      />
      
      {/* Hero Section */}
      <div 
        className="vendor-hero" 
        style={{
          backgroundImage: heroPhoto ? `url(${heroPhoto})` : 'linear-gradient(135deg, #ff3131, #ff6b6b)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="vendor-hero-overlay">
          <h1>{stall.name}</h1>
          <p className="vendor-hero-location">
            <i className="fas fa-map-marker-alt"></i> {stall.location}
          </p>
          <p className="vendor-hero-hours">
            <i className="fas fa-clock"></i> {openingTime}
          </p>
          <p className="vendor-hero-status">
            <span className={`status-badge ${stall.isActive ? 'active' : 'inactive'}`}>
              {stall.isActive ? 'Open' : 'Closed'}
            </span>
          </p>
        </div>
      </div>

      {/* Stall Details */}
      <div className="vendor-details">
        <div className="detail-section">
          <h3>About</h3>
          <p>{stall.description || "No description provided."}</p>
        </div>
        
        <div className="detail-section">
          <h3>Location Details</h3>
          <p><strong>Section:</strong> {stall.section || "N/A"}</p>
          <p><strong>Category:</strong> {stall.category || "General"}</p>
        </div>

        <div className="detail-section">
          <h3>Operating Hours</h3>
          <p><strong>Hours:</strong> {openingTime}</p>
        </div>

        {stall.paymentMethods && stall.paymentMethods.length > 0 && (
          <div className="detail-section">
            <h3>Accepted Payment Methods</h3>
            <div className="payment-methods-list">
              {stall.paymentMethods.map((method: string) => (
                <span key={method} className="payment-method-badge">
                  {method}
                  {method === "GCash" && stall.paymentDetails?.gcashNumber && (
                    <span className="payment-number">({stall.paymentDetails.gcashNumber})</span>
                  )}
                  {method === "Maya" && stall.paymentDetails?.mayaNumber && (
                    <span className="payment-number">({stall.paymentDetails.mayaNumber})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {stall.photos && stall.photos.length > 1 && (
          <div className="detail-section">
            <h3>Gallery</h3>
            <div className="stall-gallery">
              {stall.photos.slice(1).map((photo: string, index: number) => (
                <img key={index} src={photo} alt={`${stall.name} ${index + 2}`} />
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="detail-section">
          <h3>Menu Items ({products.length})</h3>
          {products.length === 0 ? (
            <div className="no-products-container">
              <p className="no-products">No products available yet.</p>
              <p className="no-products-hint">Products will appear here once you add them.</p>
            </div>
          ) : (
            <div className="vendor-products-grid">
              {products.map((product) => (
                <div key={product._id} className="vendor-product-item">
                  <div className="vendor-product-image">
                    <img 
                      src={product.photos?.[0] || "https://via.placeholder.com/80x80?text=No+Image"} 
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="vendor-product-info">
                    <h4>{product.name}</h4>
                    <p className="product-price">₱{product.price?.toFixed(2) || "0.00"}</p>
                    <span className={`product-status ${product.isAvailable !== false ? 'available' : 'unavailable'}`}>
                      {product.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                    {product.category && (
                      <span className="product-category-tag">{product.category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Summary */}
        <div className="detail-section revenue-summary">
          <h3>Revenue Summary</h3>
          <div className="revenue-stats">
            <div className="revenue-stat">
              <span className="stat-label">Today</span>
              <span className="stat-value">₱{stall.dailyRevenue?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="revenue-stat">
              <span className="stat-label">This Week</span>
              <span className="stat-value">₱{stall.weeklyRevenue?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="revenue-stat">
              <span className="stat-label">This Month</span>
              <span className="stat-value">₱{stall.monthlyRevenue?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}