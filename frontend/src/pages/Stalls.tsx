import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStalls, getStallDetails, getStallProductsByCategory } from "../services/stall.service";
import tupLogo from "../../images/Logo.png";
import "../styles/Stalls.css";

interface StallsPageProps {
  token?: string;
  onNavigate: (page: string, data?: any) => void;
  stallId?: string;
}

const SECTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];

export function Stalls({ token, onNavigate, stallId }: StallsPageProps) {
  const [stalls, setStalls] = useState<any[]>([]);
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [stallProducts, setStallProducts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadStalls();
  }, []);

  useEffect(() => {
    if (stallId && stalls.length > 0) {
      const stall = stalls.find(s => s._id === stallId);
      if (stall) {
        handleStallSelect(stall);
      }
    }
  }, [stallId, stalls]);

  async function loadStalls() {
    setIsLoading(true);
    try {
      const data = await getStalls();
      const activeStalls = data.filter(s => s.status === true);
      setStalls(activeStalls);
      
      const productMap: Record<string, any[]> = {};
      for (const stall of activeStalls) {
        try {
          const details = await getStallDetails(stall._id);
          productMap[stall._id] = details.products || [];
        } catch (err) {
          console.error(`Error loading products for ${stall.stallName}:`, err);
          productMap[stall._id] = [];
        }
      }
      setStallProducts(productMap);
    } catch (error) {
      console.error("Error loading stalls:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleStallSelect = async (stall: any) => {
    setSelectedStall(stall);
    setSelectedCategory("All");
    
    try {
      const details = await getStallDetails(stall._id);
      setSelectedProducts(details.products || []);
      setStallProducts(prev => ({
        ...prev,
        [stall._id]: details.products || []
      }));
    } catch (err) {
      console.error("Error loading stall details:", err);
      setSelectedProducts([]);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    if (!selectedStall) return;
    
    if (category === "All") {
      const details = await getStallDetails(selectedStall._id);
      setSelectedProducts(details.products || []);
    } else {
      const products = await getStallProductsByCategory(selectedStall._id, category);
      setSelectedProducts(products);
    }
  };

  const stallsBySection = stalls.reduce((acc, stall) => {
    const section = stall.section || 1;
    if (!acc[section]) acc[section] = [];
    acc[section].push(stall);
    return acc;
  }, {} as Record<number, any[]>);

  if (isLoading) {
    return (
      <div className="stalls-page">
        <Header onNavigate={onNavigate} token={token} />
        <div className="stalls-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="stalls-page">
      <Header onNavigate={onNavigate} token={token} currentPage="stalls" />

      <div className="stalls-container">
        <h1 className="stalls-title">Canteen Map</h1>
        <p className="stalls-subtitle">Click a section to view available stalls</p>

        {/* Map Grid */}
        <div className="stalls-map">
          {SECTIONS.map((sectionNum) => {
            const sectionStalls = stallsBySection[sectionNum] || [];
            const hasStalls = sectionStalls.length > 0;

            return (
              <div
                key={sectionNum}
                className={`stalls-map-section ${hasStalls ? "has-stalls" : "empty"}`}
                style={{ 
                  backgroundColor: hasStalls ? `#ff313122` : "#f5f5f5",
                  borderColor: "#ff3131" 
                }}
                onClick={() => {
                  if (hasStalls && sectionStalls.length === 1) {
                    handleStallSelect(sectionStalls[0]);
                  } else if (hasStalls) {
                    handleStallSelect(sectionStalls[0]);
                  }
                }}
              >
                <div className="section-label" style={{ color: "#ff3131" }}>
                  Section {sectionNum}
                </div>
                {hasStalls ? (
                  <div className="section-stalls">
                    {sectionStalls.slice(0, 3).map((stall) => (
                      <div 
                        key={stall._id} 
                        className="section-stall-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStallSelect(stall);
                        }}
                      >
                        {stall.stallName}
                      </div>
                    ))}
                    {sectionStalls.length > 3 && (
                      <div className="section-stall-more">+{sectionStalls.length - 3} more</div>
                    )}
                  </div>
                ) : (
                  <div className="section-empty">No stalls</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Stall Details */}
        {selectedStall && (
          <div className="stall-details">
            <div className="stall-details-header">
              <h2>{selectedStall.stallName}</h2>
              <button 
                className="stall-details-close" 
                onClick={() => setSelectedStall(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="stall-details-info">
              <p><strong>Section:</strong> {selectedStall.section}</p>
              <p><strong>Hours:</strong> {selectedStall.openHours?.openTime} - {selectedStall.openHours?.closingTime}</p>
              {selectedStall.stallDescription && (
                <p><strong>Description:</strong> {selectedStall.stallDescription}</p>
              )}
              {selectedStall.isInOperation !== undefined && (
                <p>
                  <strong>Status:</strong> 
                  <span className={selectedStall.isInOperation ? "status-open" : "status-closed"}>
                    {selectedStall.isInOperation ? " In Operation" : " Closed"}
                  </span>
                </p>
              )}
            </div>

            {/* Category Filters */}
            <div className="category-filters">
              <button
                className={`category-chip ${selectedCategory === "All" ? "active" : ""}`}
                onClick={() => handleCategoryFilter("All")}
              >
                All
              </button>
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => handleCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {selectedProducts.length > 0 && (
              <div className="stall-products">
                <h3>Menu Items ({selectedProducts.length})</h3>
                <div className="stall-products-grid">
                  {selectedProducts.map((product) => (
                    <div 
                      key={product._id} 
                      className="stall-product-item"
                      onClick={() => onNavigate(`product/${product._id}`)}
                    >
                      <div className="product-item-image">
                        <img 
                          src={product.productImages?.[0] || "https://via.placeholder.com/100x100?text=No+Image"} 
                          alt={product.productName}
                        />
                      </div>
                      <div className="product-item-info">
                        <h4>{product.productName}</h4>
                        <p className="product-item-price">₱{product.price.toFixed(2)}</p>
                        {product.available ? (
                          <span className="product-item-available">Available</span>
                        ) : (
                          <span className="product-item-unavailable">Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Stalls List */}
        <div className="all-stalls">
          <h2>All Stalls</h2>
          <div className="all-stalls-grid">
            {stalls.map((stall) => (
              <div 
                key={stall._id} 
                className="all-stall-item"
                onClick={() => handleStallSelect(stall)}
              >
                <div className="all-stall-image">
                  <img 
                    src={stall.stallPicture || tupLogo} 
                    alt={stall.stallName}
                  />
                </div>
                <div className="all-stall-info">
                  <h3>{stall.stallName}</h3>
                  <p>Section {stall.section}</p>
                  <span className={`all-stall-status ${stall.status ? "active" : "inactive"}`}>
                    {stall.status ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}