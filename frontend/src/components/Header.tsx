import { useNavigate } from "react-router-dom";
import tupLogo from "../../images/Logo.png";
import "../styles/header.css";

interface HeaderProps {
  onNavigate: (page: string) => void;
  token?: string | null;
}

export function Header({ onNavigate, token }: HeaderProps) {
  return (
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
        <li>
          <button onClick={() => onNavigate("home")} className="lp-nav-link active">
            Home
          </button>
        </li>
        <li>
          <button onClick={() => onNavigate("trends")} className="lp-nav-link">
            Trends
          </button>
        </li>
        <li>
          <button onClick={() => onNavigate("stalls")} className="lp-nav-link">
            Stalls
          </button>
        </li>
        <li>
          <button onClick={() => onNavigate("about")} className="lp-nav-link">
            About
          </button>
        </li>
      </ul>

      {/* Right: Icons + Login/Account */}
      <div className="lp-nav-right">
        <button className="lp-icon-btn" title="Search" aria-label="Search">
          <i className="fas fa-search"></i>
        </button>
        <button
          className="lp-icon-btn"
          title="Profile"
          aria-label="Profile"
          onClick={() => onNavigate("profile")}
        >
          <i className="fas fa-user-circle"></i>
        </button>
        <button
          className="lp-login-btn"
          onClick={() => onNavigate(token ? "profile" : "login")}
        >
          {token ? "My Account" : "Login"}
        </button>
      </div>
    </nav>
  );
}