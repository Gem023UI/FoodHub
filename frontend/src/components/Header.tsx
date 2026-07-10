import { useState, useEffect } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    setMenuOpen(false);
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
    ...(token ? [{ id: "orders", label: "Orders", icon: null }] : []),
    { id: "trends", label: "Trends", icon: null },
    { id: "about", label: "About", icon: null },
  ];

  // Lock background scroll while the mobile drawer is open, and close the
  // drawer automatically if the viewport is resized back up to desktop.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setMenuOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleNavigate(page: string) {
    setMenuOpen(false);
    onNavigate(page);
  }

  return (
    <>
      <nav className="lp-nav">
        {/* Left: Logo + Brand */}
        <div
          className="lp-nav-brand"
          onClick={() => handleNavigate("home")}
          style={{ cursor: "pointer" }}
        >
          <img src={tupLogo} alt="FoodHub Logo" className="lp-nav-logo" />
          <span className="lp-nav-brand-text">FoodHub</span>
        </div>

        {/* Center: Nav Links (desktop) / Mobile Drawer */}
        <ul className={`lp-nav-links ${menuOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => handleNavigate(link.id)}
                className={`lp-nav-link ${currentPage === link.id ? "active" : ""}`}
              >
                {link.label}
              </button>
            </li>
          ))}

          {/* Mobile-only: profile + login/logout live inside the drawer */}
          <li className="lp-nav-mobile-only">
            <button
              className="lp-nav-link"
              onClick={() => handleNavigate(token ? "profile" : "login")}
            >
              <i className="fas fa-user-circle"></i> Profile
            </button>
          </li>
          <li className="lp-nav-mobile-only">
            {token ? (
              <button className="lp-login-btn lp-login-btn-mobile" onClick={handleLogoutClick}>
                Logout
              </button>
            ) : (
              <button className="lp-login-btn lp-login-btn-mobile" onClick={() => handleNavigate("login")}>
                Login
              </button>
            )}
          </li>
        </ul>

        {/* Backdrop for mobile drawer */}
        {menuOpen && (
          <div className="lp-nav-backdrop" onClick={() => setMenuOpen(false)} />
        )}

        {/* Right: Icons + Login/Logout (desktop) */}
        <div className="lp-nav-right">
          <button className="lp-icon-btn lp-desktop-only" title="Search" aria-label="Search">
            <i className="fas fa-search"></i>
          </button>

          {/* Cart Icon with Badge - Only show for students, always visible */}
          {token && (
            <button
              className="lp-icon-btn cart-btn"
              title="Cart"
              aria-label="Cart"
              onClick={() => handleNavigate("cart")}
              style={{ position: "relative" }}
            >
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          )}

          {/* Profile Icon (desktop only, mobile has it in drawer) */}
          <button
            className="lp-icon-btn lp-desktop-only"
            title="Profile"
            aria-label="Profile"
            onClick={() => handleNavigate(token ? "profile" : "login")}
          >
            <i className="fas fa-user-circle"></i>
          </button>

          {/* Login/Logout Button (desktop only) */}
          {token ? (
            <button className="lp-login-btn lp-desktop-only" onClick={handleLogoutClick}>
              Logout
            </button>
          ) : (
            <button className="lp-login-btn lp-desktop-only" onClick={() => handleNavigate("login")}>
              Login
            </button>
          )}

          {/* Hamburger (mobile only) */}
          <button
            className={`lp-hamburger ${menuOpen ? "open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
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