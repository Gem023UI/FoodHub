import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStalls, getProductsByStall } from "../lib/api";
import "../styles/Trends.css";

interface TrendItem {
  _id: string;
  name: string;
  rating?: number;
  price?: number;
  favoriteCount?: number;
  reviewCount?: number;
  category?: string;
  nutrition?: {
    calories: number | null;
    proteinGrams: number | null;
  };
}

interface TrendCategory {
  title: string;
  icon: string;
  items: TrendItem[];
  isLoading: boolean;
  error: string | null;
}

interface TrendsProps {
  token?: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onBack: () => void;
}

export default function Trends({ token, onNavigate, onLogout, onBack }: TrendsProps) {
  const [trends, setTrends] = useState<Record<string, TrendCategory>>({
    overall: {
      title: "Overall Favorites",
      icon: "🏆",
      items: [],
      isLoading: true,
      error: null
    },
    byCategory: {
      title: "Favorites by Category",
      icon: "📊",
      items: [],
      isLoading: true,
      error: null
    },
    byCourse: {
      title: "Favorites by Course",
      icon: "🎓",
      items: [],
      isLoading: true,
      error: null
    }
  });

  useEffect(() => {
    loadTrends();
  }, []);

  async function loadTrends() {
    try {
      const stalls = await getStalls();
      let allProducts: any[] = [];

      for (const stall of stalls) {
        if (stall.isActive) {
          const products = await getProductsByStall(stall._id);
          allProducts = [...allProducts, ...products.filter(p => p.isAvailable)];
        }
      }

      // Sort by favorite count
      const sortedByFavorites = [...allProducts].sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
      
      // Group by category
      const categoryMap: Record<string, any[]> = {};
      allProducts.forEach(p => {
        const category = p.category || "Uncategorized";
        if (!categoryMap[category]) categoryMap[category] = [];
        categoryMap[category].push(p);
      });

      // Get top 3 per category
      const topByCategory = Object.entries(categoryMap).map(([category, products]) => ({
        category,
        items: products.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0)).slice(0, 3)
      }));

      // Mock course data (would come from analytics API)
      const courseData = [
        { course: "BSIT", products: sortedByFavorites.slice(0, 3) },
        { course: "BSCS", products: sortedByFavorites.slice(3, 6) },
        { course: "BSECE", products: sortedByFavorites.slice(6, 9) }
      ];

      setTrends({
        overall: {
          ...trends.overall,
          items: sortedByFavorites.slice(0, 10),
          isLoading: false
        },
        byCategory: {
          ...trends.byCategory,
          items: topByCategory.flatMap(c => c.items).slice(0, 10),
          isLoading: false
        },
        byCourse: {
          ...trends.byCourse,
          items: courseData.flatMap(c => c.products),
          isLoading: false
        }
      });
    } catch (error) {
      console.error("Failed to load trends:", error);
      setTrends((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = {
            ...next[key],
            isLoading: false,
            error: "Failed to load"
          };
        }
        return next;
      });
    }
  }

  return (
    <div className="trends-page">
      <Header 
        onNavigate={onNavigate} 
        token={token} 
        onLogout={onLogout}
        currentPage="trends"
      />

      <div className="trends-container">
        <div className="trends-header">
          <button className="btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1>Food Trends & Analytics</h1>
          <p>Discover what&apos;s trending on campus</p>
        </div>

        <div className="trends-grid">
          {Object.entries(trends).map(([key, category]) => (
            <div key={key} className="trend-section">
              <h2>
                <span className="trend-icon">{category.icon}</span>
                {category.title}
              </h2>

              {category.isLoading ? (
                <div className="trend-loading">
                  <Loader />
                </div>
              ) : category.error ? (
                <div className="trend-error">{category.error}</div>
              ) : category.items.length === 0 ? (
                <div className="trend-empty">No data available yet</div>
              ) : (
                <ul className="trend-list">
                  {category.items.map((item, index) => (
                    <li key={item._id} className="trend-item">
                      <div className="item-rank">
                        <span className="rank-number">#{index + 1}</span>
                      </div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-stats">
                          {item.category && (
                            <span className="stat category">{item.category}</span>
                          )}
                          {item.favoriteCount !== undefined && (
                            <span className="stat">❤️ {item.favoriteCount}</span>
                          )}
                          {item.price !== undefined && (
                            <span className="stat">₱{item.price.toFixed(2)}</span>
                          )}
                          {item.nutrition?.calories && (
                            <span className="stat">🔥 {item.nutrition.calories} cal</span>
                          )}
                          {item.nutrition?.proteinGrams && (
                            <span className="stat">💪 {item.nutrition.proteinGrams}g</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}