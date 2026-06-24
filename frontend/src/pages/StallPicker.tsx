import { useEffect, useMemo, useState } from "react";
import { fetchStalls, type StallSummary } from "../lib/api";

interface StallPickerProps {
  token?: string | null;
  onSelectStall: (stallId: string, stallName: string) => void;
}

export function StallPicker({ token, onSelectStall }: StallPickerProps) {
  const [stalls, setStalls] = useState<StallSummary[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadStalls() {
      try {
        setIsLoading(true);
        const result = await fetchStalls(token ?? undefined);
        if (!active) {
          return;
        }
        setStalls(result);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load stalls");
      } finally {
        setIsLoading(false);
      }
    }

    void loadStalls();

    return () => {
      active = false;
    };
  }, [token]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(stalls.map((s) => s.category).filter(Boolean))
    );
    return ["All", ...unique.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase())];
  }, [stalls]);

  const filteredStalls = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stalls.filter((stall) => {
      // Category filter check
      if (selectedCategory !== "All") {
        const stallCat = (stall.category || "general").toLowerCase();
        if (stallCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Query filter check
      if (!normalizedQuery) {
        return true;
      }

      return [stall.name, stall.location, stall.category || "general"].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, stalls, selectedCategory]);

  return (
    <div className="stall-picker-container">
      <div className="stall-picker-header">
        <h1>Select a Stall</h1>
        <p>Choose where you'd like to order from</p>
      </div>

      <div className="stall-search-section">
        <input
          type="text"
          placeholder="Search stalls..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="stall-search-input"
        />
      </div>

      <div className="stall-category-filters">
        {categories.map((category) => (
          <button
            key={category}
            className={`stall-filter-chip ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === "All" ? "🌐 All Stalls" : category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="stall-picker-loading">Loading stalls...</div>
      ) : error ? (
        <div className="stall-picker-error">{error}</div>
      ) : filteredStalls.length === 0 ? (
        <div className="stall-picker-empty">No stalls available</div>
      ) : (
        <div className="stalls-grid">
          {filteredStalls.map((stall) => (
            <button
              key={stall._id}
              className="cute-stall-card"
              onClick={() => onSelectStall(stall._id, stall.name)}
            >
              {/* Awning */}
              <div className="cute-stall-awning"></div>
              
              {/* Counter/Window */}
              <div className="cute-stall-window">
                <div className="cute-stall-counter-ledge"></div>
                {stall.photoUrl ? (
                  <img src={stall.photoUrl} alt={stall.name} className="cute-stall-image" />
                ) : (
                  <div className="cute-stall-silhouette">🍳</div>
                )}
              </div>

              {/* Base Details */}
              <div className="cute-stall-base">
                <div className="cute-stall-badge">{stall.category || "General"}</div>
                <h3>{stall.name}</h3>
                <p className="cute-stall-location">📍 {stall.location}</p>
                <span className={`cute-stall-status ${stall.isActive ? "open" : "closed"}`}>
                  {stall.isActive ? "● Open Now" : "○ Closed"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
