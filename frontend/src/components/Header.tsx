import { useState } from "react";
import tupLogo from "../../images/Logo.png";
import "../styles/Header.css";

interface HeaderProps {
  onNavigate: (page: string) => void;
  token?: string | null;
  onLogout?: () => void;
  cartCount?: number;
  currentPage?: string;
}

export function Header({ onNavigate, token, onLogout, cartCount = 0, currentPage = "home" }: HeaderProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const navLinks = [
    { id: "home", label: "Home", icon: null },
    { id: "stalls", label: "Stalls", icon: null },
    { id: "trends", label: "Trends", icon: null },
    { id: "about", label: "About", icon: null },
  ];

  return (
    <>
      <nav className="lp-nav">
        {/* Left: Logo + Brand */}
        <div
          className="lp-nav-brand"
          onClick={() => onNavigate("home")}
          style={{ cursor: "pointer" }}
        >
          <img src={tupLogo} alt="FoodHub Logo" className="lp-nav-logo" />
          <span className="lp-nav-brand-text">FoodHub</span>
        </div>

        {/* Center: Nav Links */}
        <ul className="lp-nav-links">
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => onNavigate(link.id)}
                className={`lp-nav-link ${currentPage === link.id ? "active" : ""}`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right: Icons + Login/Logout */}
        <div className="lp-nav-right">
          <button className="lp-icon-btn" title="Search" aria-label="Search">
            <i className="fas fa-search"></i>
          </button>
          
          {/* Cart Icon with Badge - Only show for students */}
          {token && (
            <button
              className="lp-icon-btn cart-btn"
              title="Cart"
              aria-label="Cart"
              onClick={() => onNavigate("cart")}
              style={{ position: "relative" }}
            >
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          )}

          {/* Profile Icon */}
          <button
            className="lp-icon-btn"
            title="Profile"
            aria-label="Profile"
            onClick={() => onNavigate(token ? "profile" : "login")}
          >
            <i className="fas fa-user-circle"></i>
          </button>

          {/* Login/Logout Button */}
          {token ? (
            <button className="lp-login-btn" onClick={handleLogoutClick}>
              Logout
            </button>
          ) : (
            <button className="lp-login-btn" onClick={() => onNavigate("login")}>
              Login
            </button>
          )}
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