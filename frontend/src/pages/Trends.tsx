import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { 
  getTopFavoritesByCourse,
  getTopFavoritesByPeriod,
  getAllStallsWithFavorites,
  type TopFavoriteItem
} from "../services/favorite.service";
import "../styles/Trends.css";

const CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];
const COURSES = ["BSIT", "BSCS", "BSIS", "BSBA", "BSHM", "BSEd", "BEED", "BSN", "BSPSYCH", "BSCRIM"];

// Category icons and colors
const CATEGORY_META: Record<string, { icon: string; color: string; bgColor: string }> = {
  "Rice Meal": { icon: "🍚", color: "#e67e22", bgColor: "#fdf6ec" },
  "Beverage": { icon: "🥤", color: "#3498db", bgColor: "#ebf5fb" },
  "Snacks": { icon: "🍿", color: "#e74c3c", bgColor: "#fdedec" },
  "Add-ons": { icon: "🧂", color: "#2ecc71", bgColor: "#eafaf1" }
};

const PERIOD_META: Record<string, { label: string; icon: string; gradient: string }> = {
  today: { label: "Today", icon: "🔥", gradient: "linear-gradient(135deg, #ff6b6b, #ee5a24)" },
  week: { label: "This Week", icon: "📈", gradient: "linear-gradient(135deg, #f093fb, #f5576c)" },
  month: { label: "This Month", icon: "📊", gradient: "linear-gradient(135deg, #4facfe, #00f2fe)" },
  all: { label: "All Time", icon: "🏆", gradient: "linear-gradient(135deg, #f7971e, #ffd200)" }
};

interface TrendsProps {
  token?: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onBack: () => void;
}

export default function Trends({ onNavigate, onBack }: TrendsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'course' | 'period'>('course');
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
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


  // Get top 3 items for a category
  function getTopItems(items: TopFavoriteItem[], count: number = 3) {
    return (items || []).slice(0, count);
  }

  // Get total favorites count
  function getTotalFavorites(items: TopFavoriteItem[]) {
    return (items || []).reduce((sum, item) => sum + (item.favorite || item.favoriteCount || 0), 0);
  }

  if (isLoading) {
    return (
      <div className="trends-page">
        <div className="trends-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="trends-page">
      <div className="trends-container">
        {/* ─── HEADER ─── */}
        <div className="trends-header">
          <button className="btn-back" onClick={onBack}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <div className="trends-header-content">
            <div>
              <h1>📊 Food Trends</h1>
              <p>Discover what's trending on campus</p>
            </div>
            <div className="trends-stats">
              <div className="stat-item">
                <span className="stat-number">{stallsWithFavorites.length}</span>
                <span className="stat-label">Active Stalls</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {Object.values(periodWinners.all).reduce((sum, items) => sum + items.length, 0)}
                </span>
                <span className="stat-label">Trending Items</span>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {/* ─── TAB NAVIGATION ─── */}
        <div className="trends-tabs" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'course' ? 'active' : ''}`}
            onClick={() => setActiveTab('course')}
            role="tab"
            aria-selected={activeTab === 'course'}
          >
            <i className="fas fa-graduation-cap"></i> By Course
          </button>
          <button
            className={`tab-btn ${activeTab === 'period' ? 'active' : ''}`}
            onClick={() => setActiveTab('period')}
            role="tab"
            aria-selected={activeTab === 'period'}
          >
            <i className="fas fa-calendar-alt"></i> By Period
          </button>
        </div>

        {/* ─── COURSE TAB ─── */}
        {activeTab === 'course' && (
          <div className="trend-tab-content">
            <div className="trend-controls">
              <div className="course-selector">
                <label htmlFor="trend-course-select">Select Course:</label>
                <select
                  id="trend-course-select"
                  className="trend-course-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="trend-summary">
                <span>Showing favorites for <strong>{selectedCourse}</strong></span>
              </div>
            </div>

            {isCourseLoading ? (
              <div className="trend-loading"><Loader /></div>
            ) : (
              <div className="trend-categories-grid">
                {CATEGORIES.map(category => {
                  const items = courseWinners[category] || [];
                  const totalFavs = getTotalFavorites(items);
                  const meta = CATEGORY_META[category] || { icon: "📦", color: "#666", bgColor: "#f5f5f5" };

                  return (
                    <div key={category} className="trend-category-card">
                      <div className="category-header" style={{ background: meta.bgColor }}>
                        <div className="category-icon" style={{ color: meta.color }}>
                          {meta.icon}
                        </div>
                        <div className="category-info">
                          <h3>{category}</h3>
                          <span className="category-fav-count">❤️ {totalFavs} favorites</span>
                        </div>
                      </div>
                      <div className="category-items">
                        {getTopItems(items, 3).length > 0 ? (
                          getTopItems(items, 3).map((item, index) => (
                            <div key={item.productId} className="trend-item-card">
                              <div className="item-rank-badge" style={{ background: meta.color }}>
                                #{index + 1}
                              </div>
                              <div className="item-content">
                                <div className="item-name">{item.productName}</div>
                                <div className="item-meta">
                                  <span className="item-stall">📍 {item.stallName}</span>
                                  <span className="item-favs">❤️ {item.favorite || item.favoriteCount || 0}</span>
                                </div>
                              </div>
                              <button
                                className="item-view-btn"
                                onClick={() => onNavigate(`product/${item.productId}`)}
                              >
                                View
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="trend-empty">No favorites yet</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── PERIOD TAB ─── */}
        {activeTab === 'period' && (
          <div className="trend-tab-content">
            <div className="trend-controls">
              <div className="period-selector">
                {(['today', 'week', 'month', 'all'] as const).map(period => (
                  <button
                    key={period}
                    className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    <span>{PERIOD_META[period].icon}</span>
                    {PERIOD_META[period].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="period-summary" style={{ background: PERIOD_META[selectedPeriod].gradient }}>
              <span className="period-icon">{PERIOD_META[selectedPeriod].icon}</span>
              <span className="period-label">{PERIOD_META[selectedPeriod].label} Favorites</span>
            </div>

            <div className="trend-categories-grid">
              {CATEGORIES.map(category => {
                const items = (periodWinners[selectedPeriod] || {})[category] || [];
                const totalFavs = getTotalFavorites(items);
                const meta = CATEGORY_META[category] || { icon: "📦", color: "#666", bgColor: "#f5f5f5" };

                return (
                  <div key={`${selectedPeriod}-${category}`} className="trend-category-card">
                    <div className="category-header" style={{ background: meta.bgColor }}>
                      <div className="category-icon" style={{ color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="category-info">
                        <h3>{category}</h3>
                        <span className="category-fav-count">❤️ {totalFavs} favorites</span>
                      </div>
                    </div>
                    <div className="category-items">
                      {getTopItems(items, 3).length > 0 ? (
                        getTopItems(items, 3).map((item, index) => (
                          <div key={item.productId} className="trend-item-card">
                            <div className="item-rank-badge" style={{ background: meta.color }}>
                              #{index + 1}
                            </div>
                            <div className="item-content">
                              <div className="item-name">{item.productName}</div>
                              <div className="item-meta">
                                <span className="item-stall">📍 {item.stallName}</span>
                                <span className="item-favs">❤️ {item.favorite || item.favoriteCount || 0}</span>
                              </div>
                            </div>
                            <button
                              className="item-view-btn"
                              onClick={() => onNavigate(`product/${item.productId}`)}
                            >
                              View
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="trend-empty">No favorites yet</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}