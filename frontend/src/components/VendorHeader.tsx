import { useState } from "react";
import tupLogo from "../../images/Logo.png";
import "../styles/Header.css";

interface VendorHeaderProps {
  onNavigate: (page: string) => void;
  token?: string | null;
  stallName?: string;
  onLogout?: () => void;
}

export function VendorHeader({ onNavigate, token, stallName, onLogout }: VendorHeaderProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) onLogout();
  };
  const handleCancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      <nav className="lp-nav vendor-nav">
        {/* Left: Logo + Brand */}
        <div
          className="lp-nav-brand"
          onClick={() => onNavigate("vendor-stall")}
          style={{ cursor: "pointer" }}
        >
          <img src={tupLogo} alt="FoodHub Logo" className="lp-nav-logo" />
          <span className="lp-nav-brand-text">FoodHub Vendor</span>
          {stallName && (
            <span className="vendor-stall-badge">📍 {stallName}</span>
          )}
        </div>

        {/* Center: Vendor Nav Links */}
        <ul className="lp-nav-links">
          <li>
            <button onClick={() => onNavigate("vendor-stall")} className="lp-nav-link">
              <i className="fas fa-store"></i> My Stall
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate("vendor-products")} className="lp-nav-link">
              <i className="fas fa-utensils"></i> Products
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate("vendor-orders")} className="lp-nav-link">
              <i className="fas fa-clipboard-list"></i> Orders
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate("vendor-revenue")} className="lp-nav-link">
              <i className="fas fa-chart-line"></i> Revenue
            </button>
          </li>
        </ul>

        {/* Right: Icons + Account */}
        <div className="lp-nav-right">
          <button
            className="lp-icon-btn"
            title="Profile"
            aria-label="Profile"
            onClick={() => onNavigate("vendor-profile")}
          >
            <i className="fas fa-user-circle"></i>
          </button>
          <button className="lp-login-btn" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={handleCancelLogout}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={handleConfirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}