import { useEffect, useState } from "react";

interface TrendItem {
  _id: string;
  name: string;
  rating?: number;
  price?: number;
  favoriteCount?: number;
  reviewCount?: number;
  viewCount?: number;
  category?: string;
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
  onBack: () => void;
}

const initialTrends = {
  topRated: {
    title: "Top Rated Stalls",
    icon: "⭐",
    items: [],
    isLoading: true,
    error: null
  },
  topItems: {
    title: "Top Rated Items",
    icon: "🍜",
    items: [],
    isLoading: true,
    error: null
  },
  mostPopular: {
    title: "Most Popular Items",
    icon: "🔥",
    items: [],
    isLoading: true,
    error: null
  },
  trending: {
    title: "Trending This Week",
    icon: "📈",
    items: [],
    isLoading: true,
    error: null
  },
  favorites: {
    title: "Most Favorited Stalls",
    icon: "❤️",
    items: [],
    isLoading: true,
    error: null
  },
  favoriteItems: {
    title: "Most Favorited Items",
    icon: "💝",
    items: [],
    isLoading: true,
    error: null
  },
  cheapest: {
    title: "Cheapest Items",
    icon: "💰",
    items: [],
    isLoading: true,
    error: null
  },
  bestValue: {
    title: "Best Value",
    icon: "🎯",
    items: [],
    isLoading: true,
    error: null
  },
  mostReviewed: {
    title: "Most Reviewed Stalls",
    icon: "📝",
    items: [],
    isLoading: true,
    error: null
  },
  newArrivals: {
    title: "New Arrivals",
    icon: "✨",
    items: [],
    isLoading: true,
    error: null
  }
} satisfies Record<string, TrendCategory>;

export default function Trends({ token, onBack }: TrendsProps) {
  const [trends, setTrends] = useState<Record<string, TrendCategory>>(initialTrends);

  useEffect(() => {
    let cancelled = false;

    const loadTrends = async () => {
      try {
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [topRatedRes, topItemsRes, popularRes, trendingRes, favRes, favItemRes, cheapRes, valueRes, reviewedRes, newRes] = await Promise.all([
          fetch("/api/analytics/top-rated-stalls", { headers }),
          fetch("/api/analytics/top-rated-items", { headers }),
          fetch("/api/analytics/most-popular-items", { headers }),
          fetch("/api/analytics/trending-week", { headers }),
          fetch("/api/analytics/most-favorited-stalls", { headers }),
          fetch("/api/analytics/most-favorited-items", { headers }),
          fetch("/api/analytics/cheapest-items", { headers }),
          fetch("/api/analytics/best-value", { headers }),
          fetch("/api/analytics/most-reviewed-stalls", { headers }),
          fetch("/api/analytics/new-arrivals", { headers })
        ]);

        const [topRatedData, topItemsData, popularData, trendingData, favStallsData, favItemsData, cheapestData, bestValueData, reviewedData, newData] = await Promise.all([
          topRatedRes.ok ? topRatedRes.json() : Promise.resolve([]),
          topItemsRes.ok ? topItemsRes.json() : Promise.resolve([]),
          popularRes.ok ? popularRes.json() : Promise.resolve([]),
          trendingRes.ok ? trendingRes.json() : Promise.resolve([]),
          favRes.ok ? favRes.json() : Promise.resolve([]),
          favItemRes.ok ? favItemRes.json() : Promise.resolve([]),
          cheapRes.ok ? cheapRes.json() : Promise.resolve([]),
          valueRes.ok ? valueRes.json() : Promise.resolve([]),
          reviewedRes.ok ? reviewedRes.json() : Promise.resolve([]),
          newRes.ok ? newRes.json() : Promise.resolve([])
        ]);

        if (cancelled) {
          return;
        }

        setTrends((prev) => ({
          topRated: {
            ...prev.topRated,
            items: topRatedData,
            isLoading: false,
            error: topRatedRes.ok ? null : "Failed to load"
          },
          topItems: {
            ...prev.topItems,
            items: topItemsData,
            isLoading: false,
            error: topItemsRes.ok ? null : "Failed to load"
          },
          mostPopular: {
            ...prev.mostPopular,
            items: popularData,
            isLoading: false,
            error: popularRes.ok ? null : "Failed to load"
          },
          trending: {
            ...prev.trending,
            items: trendingData,
            isLoading: false,
            error: trendingRes.ok ? null : "Failed to load"
          },
          favorites: {
            ...prev.favorites,
            items: favStallsData,
            isLoading: false,
            error: favRes.ok ? null : "Failed to load"
          },
          favoriteItems: {
            ...prev.favoriteItems,
            items: favItemsData,
            isLoading: false,
            error: favItemRes.ok ? null : "Failed to load"
          },
          cheapest: {
            ...prev.cheapest,
            items: cheapestData,
            isLoading: false,
            error: cheapRes.ok ? null : "Failed to load"
          },
          bestValue: {
            ...prev.bestValue,
            items: bestValueData,
            isLoading: false,
            error: valueRes.ok ? null : "Failed to load"
          },
          mostReviewed: {
            ...prev.mostReviewed,
            items: reviewedData,
            isLoading: false,
            error: reviewedRes.ok ? null : "Failed to load"
          },
          newArrivals: {
            ...prev.newArrivals,
            items: newData,
            isLoading: false,
            error: newRes.ok ? null : "Failed to load"
          }
        }));
      } catch (error) {
        if (!cancelled) {
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
    };

    loadTrends();
    const pollInterval = setInterval(loadTrends, 10000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [token]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="trends-page">
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
              <div className="loading">Loading...</div>
            ) : category.error ? (
              <div className="error-message">{category.error}</div>
            ) : category.items.length === 0 ? (
              <div className="empty-state">No data available yet</div>
            ) : (
              <ul className="trend-list">
                {category.items.map((item, index) => {
                  const rank = index + 1;
                  const rankBadge = getRankBadge(rank);

                  return (
                    <li key={item._id} className="trend-item">
                      <div className="item-rank">
                        {rankBadge ? (
                          <span className="badge-large">{rankBadge}</span>
                        ) : (
                          <span className="rank-number">#{rank}</span>
                        )}
                      </div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-stats">
                          {item.rating !== undefined && <span className="stat">⭐ {item.rating.toFixed(1)}</span>}
                          {item.price !== undefined && <span className="stat">💰 Rs. {item.price}</span>}
                          {item.viewCount !== undefined && <span className="stat">👁️ {item.viewCount.toLocaleString()}</span>}
                          {item.favoriteCount !== undefined && <span className="stat">❤️ {item.favoriteCount.toLocaleString()}</span>}
                          {item.reviewCount !== undefined && <span className="stat">📝 {item.reviewCount}</span>}
                          {item.category && <span className="stat category">{item.category}</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
