import { useState, useEffect } from "react";
import tupLogo from "../../images/Logo.png";
import ricemeal from "../../images/foods/ricemeal.png";
import snacks from "../../images/foods/snacks.png";
import beverage from "../../images/foods/beverage.png";
import burger from "../../images/foods/burger.png";
import crispybite from "../../images/foods/crispybite.png";
import donut from "../../images/foods/donut.png";
import egg from "../../images/foods/egg.png";
import fries from "../../images/foods/fries.png";
import juice from "../../images/foods/juice.png";
import lemonade from "../../images/foods/lemonade.png";
import lemonade1 from "../../images/foods/lemonade1.png";
import matcha from "../../images/foods/matcha.png";
import pizza from "../../images/foods/pizza.png";
import sandwich from "../../images/foods/sandwich.png";
import soda from "../../images/foods/soda.png";
import soda1 from "../../images/foods/soda1.png";

const heroImages = [ricemeal, snacks, beverage, burger, crispybite, donut, egg, fries, juice, lemonade, lemonade1, matcha, pizza, sandwich, soda, soda1];

interface HomePageProps {
  onNavigate: (page: string) => void;
  token?: string | null;
}

export function HomePage({ onNavigate, token }: HomePageProps) {

  const heroImages = [ricemeal, snacks, beverage, burger, crispybite, donut, egg, fries, juice, lemonade, lemonade1, matcha, pizza, sandwich, soda, soda1];


  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        setAnimating(false);
      }, 600);
    }, 2000);
    return () => clearInterval(interval);
  }, [heroImages.length]);
  return (
    <div className="landing-page">
      {/* ─── NAVBAR ─── */}
      <nav className="lp-nav">
        {/* Left: Logo + Brand */}
        <div className="lp-nav-brand" onClick={() => onNavigate("home")} style={{ cursor: "pointer" }}>
          <img src={tupLogo} alt="FoodHub Logo" className="lp-nav-logo" />
          <span className="lp-nav-brand-text">FoodHub</span>
        </div>

        {/* Center: Nav Links */}
        <ul className="lp-nav-links">
          <li><button onClick={() => onNavigate("home")} className="lp-nav-link active">Home</button></li>
          <li><button onClick={() => onNavigate("trends")} className="lp-nav-link">Trends</button></li>
          <li><button onClick={() => onNavigate("stalls")} className="lp-nav-link">Stalls</button></li>
          <li><button onClick={() => onNavigate("about")} className="lp-nav-link">About</button></li>
        </ul>

        {/* Right: Icons + Login */}
        <div className="lp-nav-right">
          <button className="lp-icon-btn" title="Search" aria-label="Search">
            <i className="fas fa-search"></i>
          </button>
          <button className="lp-icon-btn" title="Profile" aria-label="Profile" onClick={() => onNavigate("profile")}>
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

      {/* ─── HERO ─── */}
      <section className="lp-hero">
        <div className="lp-hero-image">
          <div className="lp-hero-slideshow">
            <img
              src={heroImages[currentSlide]}
              alt="FoodHub"
              className={`lp-hero-food-img lp-slide ${animating ? "lp-slide-exit" : "lp-slide-enter"}`}
            />
          </div>
        </div>
        <div className="lp-hero-content">
          <h1 className="lp-hero-title">
            Order Your<br />
            Favorites in<br />
            Minutes.
          </h1>
          <p className="lp-hero-sub">
            Discover the best canteen stalls at TUP. Pre-order your meals
            and skip the queue — fresh food, faster.
          </p>
          <button className="lp-hero-btn" onClick={() => onNavigate("stalls")}>
            Explore Now
          </button>
        </div>
      </section>

      {/* ─── CATEGORY CHIPS ─── */}
      <section className="lp-categories">
        <div className="lp-categories-inner">
          <div className="lp-cat-card lp-cat-red" onClick={() => onNavigate("stalls")}>
            <img src={ricemeal} alt="Rice Meals" className="lp-cat-img" />
            <span className="lp-cat-label">Rice Meals</span>
          </div>
          <div className="lp-cat-card lp-cat-orange" onClick={() => onNavigate("stalls")}>
            <img src={beverage} alt="Beverages" className="lp-cat-img" />
            <span className="lp-cat-label">Beverages</span>
          </div>
          <div className="lp-cat-card lp-cat-yellow" onClick={() => onNavigate("stalls")}>
            <img src={snacks} alt="Snacks" className="lp-cat-img" />
            <span className="lp-cat-label">Snacks</span>
          </div>
        </div>
      </section>

      {/* ─── FEATURED STALLS ─── */}
      <section className="lp-featured">
        <div className="lp-featured-header">
          <h2 className="lp-section-title">Featured Stalls</h2>
          <button className="lp-see-all" onClick={() => onNavigate("stalls")}>See All →</button>
        </div>
        <div className="lp-stalls-grid">
          {[
            { name: "Canteen A", tag: "Rice & Viands", price: "₱45.00", badge: "Popular" },
            { name: "Snack Corner", tag: "Merienda & Drinks", price: "₱30.00", badge: "New" },
            { name: "Lutong Bahay", tag: "Home-cooked Meals", price: "₱55.00", badge: "Hot" },
          ].map((stall) => (
            <div className="lp-stall-card" key={stall.name} onClick={() => onNavigate("stalls")}>
              <div className="lp-stall-img-wrap">
                <span className="lp-stall-badge">{stall.badge}</span>
                <img src={tupLogo} alt={stall.name} className="lp-stall-img" />
              </div>
              <div className="lp-stall-info">
                <h3 className="lp-stall-name">{stall.name}</h3>
                <p className="lp-stall-tag">{stall.tag}</p>
                <div className="lp-stall-footer">
                  <span className="lp-stall-price">{stall.price} avg.</span>
                  <button className="lp-stall-order-btn" onClick={(e) => { e.stopPropagation(); onNavigate("stalls"); }}>
                    Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS + PROMO ─── */}
      <section className="lp-bottom-row">
        {/* How It Works */}
        <div className="lp-how-card">
          <h2 className="lp-how-title">Order Food The Smart Way.</h2>
          <img src={tupLogo} alt="Delivery" className="lp-how-img" />
          <ul className="lp-how-steps">
            <li>
              <span className="lp-step-icon">🍽️</span>
              <div>
                <strong>Pick a Stall</strong>
                <p>Browse canteen stalls and explore their menus in seconds.</p>
              </div>
            </li>
            <li>
              <span className="lp-step-icon">🛒</span>
              <div>
                <strong>Pre-Order</strong>
                <p>Add items to your cart and schedule a pickup time.</p>
              </div>
            </li>
          </ul>
          <button className="lp-how-btn" onClick={() => onNavigate("stalls")}>Get Started</button>
        </div>

        {/* Promo Card */}
        <div className="lp-promo-card">
          <img src={tupLogo} alt="Promo" className="lp-promo-img" />
          <h3 className="lp-promo-title">Today's Special</h3>
          <p className="lp-promo-sub">
            Fresh meals every day at TUP Canteen. Check the latest promos from your
            favorite stalls and save more on every order.
          </p>
          <button className="lp-promo-btn" onClick={() => onNavigate("trends")}>
            Check Trends
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
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
    </div>
  );
}