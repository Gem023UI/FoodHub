import { useState } from "react";
import tupLogo from "../../images/Logo.png";
import "../styles/Header.css";

interface VendorHeaderProps {
  onNavigate: (page: string) => void;
  token?: string | null;
  stallName?: string;
  onLogout?: () => void;
  currentPage?: string;
}

export function VendorHeader({ onNavigate, stallName, onLogout, currentPage = "vendor-stall" }: VendorHeaderProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) onLogout();
  };
  const handleCancelLogout = () => setShowLogoutModal(false);

  const navLinks = [
    { id: "vendor-stall", label: "My Stall", icon: "fa-store" },
    { id: "vendor-products", label: "Products", icon: "fa-utensils" },
    { id: "vendor-orders", label: "Orders", icon: "fa-clipboard-list" },
    { id: "vendor-revenue", label: "Revenue", icon: "fa-chart-line" },
  ];

  return (
    <>
      <nav className="lp-nav vendor-nav">
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

        <ul className="lp-nav-links">
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => onNavigate(link.id)}
                className={`lp-nav-link ${currentPage === link.id ? "active" : ""}`}
              >
                <i className={`fas ${link.icon}`}></i> {link.label}
              </button>
            </li>
          ))}
        </ul>

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