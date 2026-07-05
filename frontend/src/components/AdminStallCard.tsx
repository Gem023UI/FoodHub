import { useState } from "react";
import tupLogo from "../../images/Logo.png";
import "../styles/AdminStallCard.css";

interface AdminStallCardProps {
  stall: {
    _id: string;
    stallName: string;
    stallDescription?: string;
    stallPicture?: string | null;
    section: number;
    status: boolean;
    openHours?: { openTime: string; closingTime: string };
    paymentMethod?: {
      cash?: { available: boolean };
      gcash?: { available: boolean };
      paymaya?: { available: boolean };
    };
    products?: any[];
  };
  stats: {
    todayRevenue: number;
    todayOrders: number;
    vendorCount: number;
    totalProducts: number;
    productsByCategory: Record<string, number>;
    bestSellingProduct: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminStallCard({ stall, stats, onEdit, onDelete }: AdminStallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const bgImage = stall.stallPicture || tupLogo;

  const paymentMethods: string[] = [];
  if (stall.paymentMethod?.cash?.available) paymentMethods.push("Cash");
  if (stall.paymentMethod?.gcash?.available) paymentMethods.push("GCash");
  if (stall.paymentMethod?.paymaya?.available) paymentMethods.push("Maya");

  return (
    <div className={`admin-stall-card ${expanded ? "expanded" : ""}`}>
      <div
        className="admin-stall-card-hero"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${bgImage})` }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="admin-stall-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="hero-btn edit" onClick={onEdit}>EDIT</button>
          <button className="hero-btn delete" onClick={onDelete}>DELETE</button>
        </div>

        <div className="admin-stall-card-left">
          <h3 className="admin-stall-card-name">{stall.stallName}</h3>
          {stall.stallDescription && <p className="admin-stall-card-desc">{stall.stallDescription}</p>}
          <p className="admin-stall-card-section">Section {stall.section}</p>
          {stall.openHours && (stall.openHours.openTime || stall.openHours.closingTime) && (
            <p className="admin-stall-card-hours">
              <i className="fas fa-clock"></i> {stall.openHours.openTime} – {stall.openHours.closingTime}
            </p>
          )}
          {paymentMethods.length > 0 && (
            <div className="admin-stall-card-payment">
              <p className="payment-label">Payment Method Available:</p>
              <p className="payment-values">{paymentMethods.join(", ")}</p>
            </div>
          )}
          <span className={`admin-stall-card-status ${stall.status ? "open" : "closed"}`}>
            {stall.status ? "Open" : "Closed"}
          </span>
        </div>

        <div className="admin-stall-card-right">
          <p className="revenue-label">Revenue as of Today:</p>
          <p className="revenue-value">₱{stats.todayRevenue.toFixed(2)}</p>
          <p className="revenue-sub">{stats.todayOrders} Total Orders Today</p>
          <p className="revenue-sub">{stats.vendorCount} On Shift Vendors</p>
        </div>

        <div className="admin-stall-card-expand-hint">
          <i className={`fas fa-chevron-${expanded ? "up" : "down"}`}></i>
        </div>
      </div>

      {expanded && (
        <div className="admin-stall-card-details">
          <div className="detail-block">
            <span className="detail-value">{stats.totalProducts}</span>
            <span className="detail-label">Total Products</span>
          </div>

          <div className="detail-block category-block">
            <span className="detail-label">Products per Category</span>
            <div className="category-list">
              {Object.entries(stats.productsByCategory).length === 0 ? (
                <span className="category-empty">No products yet</span>
              ) : (
                Object.entries(stats.productsByCategory).map(([cat, count]) => (
                  <span key={cat} className="category-chip">{cat}: {count}</span>
                ))
              )}
            </div>
          </div>

          <div className="detail-block">
            <span className="detail-label">Best Selling Product</span>
            <span className="detail-value small">{stats.bestSellingProduct || "No sales yet"}</span>
          </div>
        </div>
      )}
    </div>
  );
}