import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStalls, getStallById } from "../lib/api";
import tupLogo from "../../images/Logo.png";
import "../styles/Stalls.css";

interface StallsPageProps {
  token?: string;
  onNavigate: (page: string) => void;
  stallId?: string;
}

const SECTIONS = [
  { id: "A", name: "Section A", color: "#ff3131" },
  { id: "B", name: "Section B", color: "#ff751f" },
  { id: "C", name: "Section C", color: "#ffde59" },
  { id: "D", name: "Section D", color: "#4ecdc4" },
  { id: "E", name: "Section E", color: "#45b7d1" },
  { id: "F", name: "Section F", color: "#764ba2" },
];

export function Stalls({ token, onNavigate, stallId }: StallsPageProps) {
  const [stalls, setStalls] = useState<any[]>([]);
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stallProducts, setStallProducts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadStalls();
  }, []);

  // If stallId is provided, load that stall
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
      setStalls(data.filter(s => s.isActive));
      
      // Load products for each stall
      const productMap: Record<string, any[]> = {};
      for (const stall of data) {
        if (stall.isActive) {
          try {
            const result = await getStallById(stall._id);
            productMap[stall._id] = result.products || [];
          } catch (err) {
            console.error(`Error loading products for ${stall.name}:`, err);
            productMap[stall._id] = [];
          }
        }
      }
      setStallProducts(productMap);
    } catch (error) {
      console.error("Error loading stalls:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleStallSelect = (stall: any) => {
    setSelectedStall(stall);
    setSelectedProducts(stallProducts[stall._id] || []);
  };

  // Group stalls by section
  const stallsBySection = stalls.reduce((acc, stall) => {
    const section = stall.section || "A";
    if (!acc[section]) acc[section] = [];
    acc[section].push(stall);
    return acc;
  }, {} as Record<string, any[]>);

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
          {SECTIONS.map((section) => {
            const sectionStalls = stallsBySection[section.id] || [];
            const hasStalls = sectionStalls.length > 0;

            return (
              <div
                key={section.id}
                className={`stalls-map-section ${hasStalls ? "has-stalls" : "empty"}`}
                style={{ 
                  backgroundColor: hasStalls ? `${section.color}22` : "#f5f5f5",
                  borderColor: section.color 
                }}
                onClick={() => {
                  if (hasStalls && sectionStalls.length === 1) {
                    handleStallSelect(sectionStalls[0]);
                  } else if (hasStalls) {
                    handleStallSelect(sectionStalls[0]);
                  }
                }}
              >
                <div className="section-label" style={{ color: section.color }}>
                  {section.name}
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
                        {stall.name}
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
              <h2>{selectedStall.name}</h2>
              <button 
                className="stall-details-close" 
                onClick={() => setSelectedStall(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="stall-details-info">
              <p><strong>Location:</strong> {selectedStall.location}</p>
              <p><strong>Category:</strong> {selectedStall.category || "General"}</p>
              <p><strong>Hours:</strong> {selectedStall.openingHours || "Not specified"}</p>
              {selectedStall.description && (
                <p><strong>Description:</strong> {selectedStall.description}</p>
              )}
              {selectedStall.paymentMethods && selectedStall.paymentMethods.length > 0 && (
                <p><strong>Payment Methods:</strong> {selectedStall.paymentMethods.join(", ")}</p>
              )}
            </div>

            {selectedProducts.length > 0 && (
              <div className="stall-products">
                <h3>Menu Items</h3>
                <div className="stall-products-grid">
                  {selectedProducts.map((product) => (
                    <div 
                      key={product._id} 
                      className="stall-product-item"
                      onClick={() => onNavigate(`product/${product._id}`)}
                    >
                      <div className="product-item-image">
                        <img 
                          src={product.photos?.[0] || "https://via.placeholder.com/100x100?text=No+Image"} 
                          alt={product.name}
                        />
                      </div>
                      <div className="product-item-info">
                        <h4>{product.name}</h4>
                        <p className="product-item-price">₱{product.price.toFixed(2)}</p>
                        {product.isAvailable ? (
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
                    src={stall.photos?.[0] || tupLogo} 
                    alt={stall.name}
                  />
                </div>
                <div className="all-stall-info">
                  <h3>{stall.name}</h3>
                  <p>{stall.location}</p>
                  <span className={`all-stall-status ${stall.isActive ? "active" : "inactive"}`}>
                    {stall.isActive ? "Open" : "Closed"}
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