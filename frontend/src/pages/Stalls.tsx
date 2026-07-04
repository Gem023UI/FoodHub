import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { ProductCard } from "../components/ProductCard";
import { getStallDetails } from "../services/stall.service";
import tupLogo from "../../images/Logo.png";
import "../styles/Stalls.css";

const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];

interface StallPageProps {
  stallId: string;
  token?: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

export function Stall({ stallId, token, onNavigate, onLogout }: StallPageProps) {
  const [stall, setStall] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (stallId) loadStall();
  }, [stallId]);

  async function loadStall() {
    setIsLoading(true);
    try {
      const data = await getStallDetails(stallId);
      setStall(data);
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error loading stall:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults(null);
      return;
    }
    const filtered = products.filter((p) =>
      p.productName?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    );
    setSearchResults(filtered);
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults(null);
  }

  function productsByCategory(category: string) {
    return products.filter((p) => p.category === category && p.available !== false);
  }

  if (isLoading) {
    return (
      <div className="stall-page">
        <div className="stall-page-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="stall-page">
        <div className="stall-page-error">
          <h2>Stall Not Found</h2>
          <p>The stall you're looking for doesn't exist or is unavailable.</p>
          <button className="stall-page-back-btn" onClick={() => onNavigate("stalls")}>
            Browse Stalls
          </button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="stall-page">
      {/* ─── HEADER ─── */}
      <section
        className="stall-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${stall.stallPicture || tupLogo})`,
        }}
      >
        <div className="stall-hero-content">
          <p className="stall-hero-welcome">Welcome to,</p>
          <h1 className="stall-hero-name">{stall.stallName}</h1>
          {stall.stallDescription && (
            <p className="stall-hero-desc">{stall.stallDescription}</p>
          )}
          <p className="stall-hero-section">Section {stall.section}</p>
          {stall.openHours && (
            <p className="stall-hero-hours">
              <i className="fas fa-clock"></i> {stall.openHours.openTime} - {stall.openHours.closingTime}
            </p>
          )}
          <div className="stall-hero-payments">
            <span className="stall-hero-payments-label">Payment Method Available:</span>
            <span className="stall-hero-payments-list">
              {[
                stall.paymentMethod?.cash?.available && "Cash",
                stall.paymentMethod?.gcash?.available && "GCash",
                stall.paymentMethod?.paymaya?.available && "Maya",
              ]
                .filter(Boolean)
                .join(", ") || "Not specified"}
            </span>
          </div>
        </div>
      </section>

      {/* ─── SEARCH SECTION (yellow, expands) ─── */}
      <section className={`stall-search-section ${searchResults !== null ? "expanded" : ""}`}>
        <div className="stall-search-container">
          <h2 className="stall-search-title">Search {stall.stallName}'s Menu</h2>
          <form className="stall-search-form" onSubmit={handleSearch}>
            <div className="stall-search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search for food or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="stall-search-input"
              />
              <button type="submit" className="stall-search-btn">
                Search
              </button>
            </div>
            {searchResults !== null && (
              <button type="button" className="stall-clear-search" onClick={clearSearch}>
                Clear Search
              </button>
            )}
          </form>

          {searchResults !== null && (
            <div className="stall-search-results">
              <p className="stall-results-count">
                {searchResults.length === 0
                  ? "No matching items found"
                  : `Showing ${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
              </p>
              {searchResults.length > 0 && (
                <div className="stall-search-results-grid">
                  {searchResults.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      token={token || undefined}
                      onClick={() => onNavigate("product", product._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── PRODUCTS BY CATEGORY (white) ─── */}
      <section className="stall-products-section">
        {PRODUCT_CATEGORIES.map((category) => {
          const items = productsByCategory(category);
          if (items.length === 0) return null;
          return (
            <div className="stall-category-block" key={category}>
              <h2 className="stall-category-title">{category}</h2>
              <div className="stall-category-rail">
                {items.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    token={token || undefined}
                    onClick={() => onNavigate("product", product._id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="stall-no-products">
            <div className="stall-no-products-icon">🍽️</div>
            <h3>No products available yet</h3>
            <p>Check back later for this stall's menu.</p>
          </div>
        )}
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}