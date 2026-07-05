import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { ProductCard } from "../components/ProductCard";
import { getStalls, getStallDetails } from "../services/stall.service";
import canteenMap from "../../images/stallmap.png";
import "../styles/StallsMap.css";

interface StallsPageProps {
  token?: string;
  onNavigate: (page: string, data?: any) => void;
  stallId?: string;
}

const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];

interface StallHotspot {
  section: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const STALL_HOTSPOTS: StallHotspot[] = [
  { section: 12, x: 0, y: 260, width: 148, height: 390 },
  { section: 11, x: 148, y: 260, width: 148, height: 390 },
  { section: 10, x: 296, y: 260, width: 148, height: 390 },
  { section: 9, x: 444, y: 260, width: 148, height: 390 },
  { section: 8, x: 592, y: 260, width: 148, height: 390 },
  { section: 7, x: 740, y: 260, width: 148, height: 390 },
  { section: 6, x: 888, y: 260, width: 148, height: 390 },
  { section: 5, x: 1036, y: 260, width: 148, height: 390 },
  { section: 4, x: 1184, y: 260, width: 148, height: 390 },
  { section: 3, x: 1332, y: 260, width: 148, height: 390 },
  { section: 2, x: 1480, y: 260, width: 148, height: 390 },
  { section: 1, x: 1628, y: 260, width: 146, height: 390 },
];

export function Stalls({ token, onNavigate, stallId }: StallsPageProps) {
  const [stalls, setStalls] = useState<any[]>([]);
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStall, setIsLoadingStall] = useState(false);

  useEffect(() => {
    loadStalls();
  }, []);

  useEffect(() => {
    if (stallId && stalls.length > 0) {
      const stall = stalls.find((s) => s._id === stallId);
      if (stall) handleStallSelect(stall);
    }
  }, [stallId, stalls]);

  async function loadStalls() {
    setIsLoading(true);
    try {
      const data = await getStalls();
      setStalls(data);
    } catch (error) {
      console.error("Error loading stalls:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStallSelect(stall: any) {
    setIsLoadingStall(true);
    try {
      const details = await getStallDetails(stall._id);
      setSelectedStall(details);
      setSelectedProducts((details.products || []).filter((p: any) => p.available !== false));
    } catch (err) {
      console.error("Error loading stall details:", err);
      setSelectedStall(stall);
      setSelectedProducts([]);
    } finally {
      setIsLoadingStall(false);
    }
  }

  function handleHotspotClick(section: number) {
    const stall = stalls.find((s) => s.section === section);
    if (stall) {
      handleStallSelect(stall);
      document.getElementById("sm-selected-stall")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function productsByCategory(category: string) {
    return selectedProducts.filter((p) => p.category === category);
  }

  function stallForSection(section: number) {
    return stalls.find((s) => s.section === section);
  }

  if (isLoading) {
    return (
      <div className="sm-page">
        <div className="sm-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="sm-page">
      <div className="sm-header">
        <h1 className="sm-title">Canteen Map</h1>
        <p className="sm-subtitle">Click a stall to view its menu</p>
      </div>

      {/* ─── SVG MAP ─── */}
      <div className="sm-map-container">
        <svg
          className="sm-map-svg"
          viewBox="0 0 1774 887"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <image href={canteenMap} x="0" y="0" width="1774" height="887" />
          {STALL_HOTSPOTS.map((hotspot) => {
            const stall = stallForSection(hotspot.section);
            const isSelected = selectedStall?.section === hotspot.section;
            return (
              <rect
                key={hotspot.section}
                x={hotspot.x}
                y={hotspot.y}
                width={hotspot.width}
                height={hotspot.height}
                className={`sm-hotspot ${stall ? "sm-hotspot-active" : "sm-hotspot-empty"} ${isSelected ? "sm-hotspot-selected" : ""}`}
                onClick={() => stall && handleHotspotClick(hotspot.section)}
              >
                <title>{stall ? `${stall.stallName} — Section ${hotspot.section}` : `Section ${hotspot.section} — No stall`}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      {/* ─── SELECTED STALL INFO + PRODUCTS ─── */}
      <div id="sm-selected-stall" className="sm-selected-section">
        {isLoadingStall && (
          <div className="sm-selected-loading">
            <Loader />
          </div>
        )}

        {!isLoadingStall && selectedStall && (
          <>
            <div className="sm-stall-card">
              <div className="sm-stall-card-header">
                <h2>{selectedStall.stallName}</h2>
                <button className="sm-stall-view-btn" onClick={() => onNavigate("stall", selectedStall._id)}>
                  View Full Stall →
                </button>
              </div>
              <div className="sm-stall-card-info">
                <p><strong>Section:</strong> {selectedStall.section}</p>
                <p>
                  <strong>Hours:</strong>{" "}
                  {selectedStall.openHours?.openTime || "N/A"} - {selectedStall.openHours?.closingTime || "N/A"}
                </p>
                {selectedStall.stallDescription && (
                  <p><strong>Description:</strong> {selectedStall.stallDescription}</p>
                )}
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={selectedStall.status ? "sm-status-open" : "sm-status-closed"}>
                    {selectedStall.status ? "Open" : "Closed"}
                  </span>
                </p>
              </div>
            </div>

            <div className="sm-products-section">
              {PRODUCT_CATEGORIES.map((category) => {
                const items = productsByCategory(category);
                if (items.length === 0) return null;
                return (
                  <div className="sm-category-block" key={category}>
                    <h3 className="sm-category-title">{category}</h3>
                    <div className="sm-category-rail">
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
              {selectedProducts.length === 0 && (
                <div className="sm-no-products">
                  <div className="sm-no-products-icon">🍽️</div>
                  <h3>No products available</h3>
                  <p>This stall hasn't added any menu items yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {!isLoadingStall && !selectedStall && (
          <div className="sm-empty-prompt">
            <div className="sm-empty-icon">👆</div>
            <h3>Select a stall above</h3>
            <p>Click on any stall in the map to view its menu.</p>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}