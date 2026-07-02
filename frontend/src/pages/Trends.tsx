import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { ProductCard } from "../components/ProductCard";
import { 
  getTopFavoritesByCourse,
  getTopFavoritesByPeriod,
  getAllStallsWithFavorites,
  type TopFavoriteItem
} from "../services/favorite.service";
import type { Product } from "../services/product.service";
import "../styles/Trends.css";

const CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];
const COURSES = ["BSIT", "BSCS", "BSIS", "BSBA", "BSHM", "BSEd", "BEED", "BSN", "BSPSYCH", "BSCRIM"];

interface TrendsProps {
  token?: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onBack: () => void;
}

export default function Trends({ token, onNavigate, onLogout, onBack }: TrendsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [courseWinners, setCourseWinners] = useState<Record<string, TopFavoriteItem[]>>({});
  const [periodWinners, setPeriodWinners] = useState<Record<string, Record<string, TopFavoriteItem[]>>>({
    today: {}, week: {}, month: {}, all: {}
  });
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [stallsWithFavorites, setStallsWithFavorites] = useState<any[]>([]);

  useEffect(() => {
    loadTrends();
  }, []);

  useEffect(() => {
    loadCourseWinners(selectedCourse);
  }, [selectedCourse]);

  async function loadTrends() {
    setIsLoading(true);
    setError(null);
    try {
      const [periods, stalls] = await Promise.all([
        Promise.all([
          getTopFavoritesByPeriod("today"),
          getTopFavoritesByPeriod("week"),
          getTopFavoritesByPeriod("month"),
          getTopFavoritesByPeriod("all"),
        ]),
        getAllStallsWithFavorites()
      ]);

      setPeriodWinners({
        today: periods[0],
        week: periods[1],
        month: periods[2],
        all: periods[3]
      });
      setStallsWithFavorites(stalls);
      
      await loadCourseWinners(selectedCourse);
    } catch (err) {
      console.error("Failed to load trends:", err);
      setError("Failed to load trends.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCourseWinners(course: string) {
    setIsCourseLoading(true);
    try {
      const data = await getTopFavoritesByCourse(course);
      setCourseWinners(data);
    } catch (err) {
      console.error("Failed to load course trends:", err);
    } finally {
      setIsCourseLoading(false);
    }
  }

  function renderProductCard(item: TopFavoriteItem, key: string) {
    const product: Product = {
      _id: item.productId,
      productName: item.productName,
      productDescription: item.productDescription || "",
      productImages: item.productImages || [],
      category: item.category as any,
      price: item.price,
      nutrition: item.nutrition || { calories: null, protein: null, carbs: null, allergen: "" },
      favorite: item.favorite || item.favoriteCount || 0,
      stocks: 0,
      available: true,
      reviews: [],
      averageRating: 0,
      reviewCount: 0,
      stallId: {
        _id: item.stallId,
        stallName: item.stallName,
        stallPicture: null
      }
    };

    return (
      <ProductCard
        key={key}
        product={product}
        token={token}
        onClick={() => onNavigate(`product/${item.productId}`)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="trends-page">
        <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="trends" />
        <div className="trends-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="trends-page">
      <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="trends" />

      <div className="trends-container">
        <div className="trends-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h1>Food Trends & Analytics</h1>
          <p>Discover what's trending on campus</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Most favorite by course ── */}
        <section className="trend-block">
          <h2><span className="trend-icon">🎓</span> Most Favorite by Course</h2>
          <select
            className="trend-course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {isCourseLoading ? (
            <div className="trend-loading"><Loader /></div>
          ) : (
            <div className="trend-categories-grid">
              {CATEGORIES.map(category => (
                <div key={category} className="trend-category-section">
                  <h3>{category}</h3>
                  <div className="trend-card-grid">
                    {(courseWinners[category] || []).slice(0, 3).map(item => 
                      renderProductCard(item, `${category}-${item.productId}`)
                    )}
                    {(courseWinners[category] || []).length === 0 && (
                      <div className="trend-empty">No favorites yet</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Most favorite per category: today / week / month / all ── */}
        {(["today", "week", "month", "all"] as const).map(period => (
          <section className="trend-block" key={period}>
            <h2>
              <span className="trend-icon">
                {period === "today" ? "📅" : period === "week" ? "🗓️" : period === "month" ? "📆" : "🏆"}
              </span>
              Most Favorite by Category — {period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"}
            </h2>
            <div className="trend-categories-grid">
              {CATEGORIES.map(category => (
                <div key={`${period}-${category}`} className="trend-category-section">
                  <h3>{category}</h3>
                  <div className="trend-card-grid">
                    {((periodWinners[period] || {})[category] || []).slice(0, 3).map(item => 
                      renderProductCard(item, `${period}-${category}-${item.productId}`)
                    )}
                    {((periodWinners[period] || {})[category] || []).length === 0 && (
                      <div className="trend-empty">No favorites yet</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}