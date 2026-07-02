import { useState, useEffect } from "react";
import { VendorHeader } from "../components/VendorHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorStall, getStallVendors } from "../services/stall.service";
import { getStallOrders } from "../services/order.service";
import "../styles/VendorStall.css";

interface VendorStallPageProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function VendorStallPage({ token, onNavigate, onLogout }: VendorStallPageProps) {
  const [stall, setStall] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendorData();
  }, [token]);

  async function fetchVendorData() {
    setIsLoading(true);
    setError(null);

    try {
      // Get vendor's stall
      const stallData = await getVendorStall(token);
      setStall(stallData);
      setProducts(stallData.products || []);
      
      // Get vendors in the stall
      try {
        const vendorList = await getStallVendors(stallData._id);
        setVendors(vendorList);
      } catch (err) {
        console.error("Error fetching vendors:", err);
      }

      // Get orders for the stall
      try {
        const orderList = await getStallOrders(token, stallData._id);
        setOrders(orderList);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
      
    } catch (err) {
      console.error("Error fetching vendor data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate revenue stats
  const completedOrders = orders.filter(o => o.orderStatus === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = completedOrders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = completedOrders.filter(o => new Date(o.createdAt) >= weekAgo);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthOrders = completedOrders.filter(o => new Date(o.createdAt) >= monthAgo);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

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
          stallName={undefined}
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

  const isInOperation = !!stall.proofOfContract;

  return (
    <div className="vendor-stall-page">
      <VendorHeader 
        onNavigate={onNavigate} 
        token={token} 
        stallName={stall.stallName}
        onLogout={onLogout}
        currentPage="vendor-stall"
      />
      
      {/* Hero Section */}
      <div 
        className="vendor-hero" 
        style={{
          backgroundImage: stall.stallPicture ? `url(${stall.stallPicture})` : 'linear-gradient(135deg, #ff3131, #ff6b6b)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="vendor-hero-overlay">
          <h1>{stall.stallName}</h1>
          <p className="vendor-hero-location">
            <i className="fas fa-map-marker-alt"></i> Section {stall.section}
          </p>
          <p className="vendor-hero-hours">
            <i className="fas fa-clock"></i> {stall.openHours?.openTime || "N/A"} - {stall.openHours?.closingTime || "N/A"}
          </p>
          <div className="vendor-hero-status">
            <span className={`status-badge ${stall.status ? 'active' : 'inactive'}`}>
              {stall.status ? '🟢 Open' : '🔴 Closed'}
            </span>
            <span className={`status-badge ${isInOperation ? 'active' : 'inactive'}`} style={{ marginLeft: '8px' }}>
              {isInOperation ? '✅ In Operation' : '❌ Contract Ended'}
            </span>
          </div>
          {!isInOperation && (
            <p className="vendor-hero-message" style={{ color: '#ffde59', marginTop: '8px' }}>
              ⚠️ {stall.message || 'Stall is currently closed (contract ended)'}
            </p>
          )}
        </div>
      </div>

      {/* Stall Details */}
      <div className="vendor-details">
        <div className="detail-section">
          <h3>About</h3>
          <p>{stall.stallDescription || "No description provided."}</p>
        </div>
        
        <div className="detail-section">
          <h3>Location Details</h3>
          <p><strong>Section:</strong> {stall.section}</p>
          <p><strong>Status:</strong> {stall.status ? 'Open' : 'Closed'}</p>
          <p><strong>Contract Status:</strong> {isInOperation ? 'Active' : 'Expired'}</p>
        </div>

        <div className="detail-section">
          <h3>Operating Hours</h3>
          <p><strong>Open:</strong> {stall.openHours?.openTime || "Not set"}</p>
          <p><strong>Close:</strong> {stall.openHours?.closingTime || "Not set"}</p>
        </div>

        {/* Payment Methods */}
        <div className="detail-section">
          <h3>Accepted Payment Methods</h3>
          <div className="payment-methods-list">
            {stall.paymentMethod?.cash?.available && (
              <span className="payment-method-badge">💵 Cash</span>
            )}
            {stall.paymentMethod?.gcash?.available && (
              <span className="payment-method-badge">
                📱 GCash
                {stall.paymentMethod.gcash.phoneNumber && (
                  <span className="payment-number">({stall.paymentMethod.gcash.phoneNumber})</span>
                )}
              </span>
            )}
            {stall.paymentMethod?.paymaya?.available && (
              <span className="payment-method-badge">
                📱 Maya
                {stall.paymentMethod.paymaya.phoneNumber && (
                  <span className="payment-number">({stall.paymentMethod.paymaya.phoneNumber})</span>
                )}
              </span>
            )}
          </div>
        </div>

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
                      src={product.productImages?.[0] || "https://via.placeholder.com/80x80?text=No+Image"} 
                      alt={product.productName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="vendor-product-info">
                    <h4>{product.productName}</h4>
                    <p className="product-price">₱{product.price?.toFixed(2) || "0.00"}</p>
                    <span className={`product-status ${product.available !== false ? 'available' : 'unavailable'}`}>
                      {product.available !== false ? 'Available' : 'Unavailable'}
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

        {/* Vendors Section */}
        <div className="detail-section">
          <h3>Vendors ({vendors.length})</h3>
          {vendors.length === 0 ? (
            <p className="no-products">No vendors assigned.</p>
          ) : (
            <div className="vendor-list">
              {vendors.map((vendor) => (
                <div key={vendor.email} className="vendor-item">
                  <div className="vendor-item-info">
                    <span className="vendor-name">{vendor.firstName} {vendor.lastName}</span>
                    <span className="vendor-email">{vendor.email}</span>
                    <span className={`vendor-status ${vendor.status === 'verified' ? 'active' : 'inactive'}`}>
                      {vendor.status}
                    </span>
                    <span className="vendor-position">{vendor.position}</span>
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
              <span className="stat-value">₱{todayRevenue.toFixed(2)}</span>
            </div>
            <div className="revenue-stat">
              <span className="stat-label">This Week</span>
              <span className="stat-value">₱{weekRevenue.toFixed(2)}</span>
            </div>
            <div className="revenue-stat">
              <span className="stat-label">This Month</span>
              <span className="stat-value">₱{monthRevenue.toFixed(2)}</span>
            </div>
            <div className="revenue-stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">₱{totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}