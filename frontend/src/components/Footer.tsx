import tupLogo from "../../images/Logo.png";
import "../styles/Footer.css";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-brand">
        <img src={tupLogo} alt="FoodHub" className="lp-footer-logo" />
        <span className="lp-footer-brand-name">FoodHub</span>
      </div>
      <p className="lp-footer-copy">© 2025 FoodHub · Technological University of the Philippines</p>
      <div className="lp-footer-links">
        <button onClick={() => onNavigate("about")} className="lp-footer-link">About</button>
        <button onClick={() => onNavigate("stalls")} className="lp-footer-link">Stalls</button>
        <button onClick={() => onNavigate("trends")} className="lp-footer-link">Trends</button>
      </div>
    </footer>
  );
}