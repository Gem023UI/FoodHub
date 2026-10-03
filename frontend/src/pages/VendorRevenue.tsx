import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorStall } from "../services/stall.service";
import {getStallOrders} from "../services/order.service";
import "../styles/VendorRevenue.css";

interface RevenueData {
  daily: {
    date: string;
    amount: number;
  }[];
  weekly: {
    week: string;
    amount: number;
  }[];
  monthly: {
    month: string;
    amount: number;
  }[];
  categoryRevenue: {
    category: string;
    amount: number;
  }[];
  totalRevenue: number;
  averageDaily: number;
  averageWeekly: number;
  averageMonthly: number;
}

interface VendorRevenueProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

type PeriodType = "daily" | "weekly" | "monthly";

export function VendorRevenue({ token, onNavigate }: VendorRevenueProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [revenueData, setRevenueData] = useState<RevenueData>({
    daily: [],
    weekly: [],
    monthly: [],
    categoryRevenue: [],
    totalRevenue: 0,
    averageDaily: 0,
    averageWeekly: 0,
    averageMonthly: 0
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      calculateRevenue();
    }
  }, [orders, period]);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);
    try {
      const stall = await getVendorStall(token);
      const data = await getStallOrders(token, stall._id);
      setOrders(data.filter(o => o.orderStatus === "completed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  function calculateRevenue() {
    const completedOrders = orders.filter(o => o.orderStatus === "completed");
    
    // Daily revenue (last 7 days)
    const dailyMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    
    // Weekly revenue (last 4 weeks)
    const weeklyMap: Record<string, number> = {};
    for (let i = 3; i >= 0; i--) {
      const week = new Date(today);
      week.setDate(week.getDate() - (i * 7));
      const key = `Week ${week.toISOString().split('T')[0]}`;
      weeklyMap[key] = 0;
    }

    // Monthly revenue (last 6 months)
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today);
      month.setMonth(month.getMonth() - i);
      const key = month.toISOString().slice(0, 7);
      monthlyMap[key] = 0;
    }

    // Category revenue
    const categoryMap: Record<string, number> = {};

    // Process orders
    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0];
      const monthKey = orderDate.toISOString().slice(0, 7);
      
      const weekStart = new Date(orderDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = `Week ${weekStart.toISOString().split('T')[0]}`;

      if (dailyMap[dateKey] !== undefined) {
        dailyMap[dateKey] += order.totalAmount;
      }

      if (weeklyMap[weekKey] !== undefined) {
        weeklyMap[weekKey] += order.totalAmount;
      }

      if (monthlyMap[monthKey] !== undefined) {
        monthlyMap[monthKey] += order.totalAmount;
      }

      order.orderLines?.forEach((line: any) => {
        const category = line.category || "General";
        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }
        categoryMap[category] += line.subtotal || (line.price * line.quantity);
      });
    });

    const dailyData = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));
    const weeklyData = Object.entries(weeklyMap).map(([week, amount]) => ({ week, amount }));
    const monthlyData = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));
    const categoryData = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageDaily = totalRevenue / 7;
    const averageWeekly = totalRevenue / 4;
    const averageMonthly = totalRevenue / 6;

    setRevenueData({
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
      categoryRevenue: categoryData,
      totalRevenue,
      averageDaily,
      averageWeekly,
      averageMonthly
    });
  }

  function getCurrentData(): { label: string; amount: number }[] {
   switch (period) {
     case "weekly": return revenueData.weekly.map(d => ({ label: d.week, amount: d.amount }));
     case "monthly": return revenueData.monthly.map(d => ({ label: d.month, amount: d.amount }));
     default: return revenueData.daily.map(d => ({ label: d.date, amount: d.amount }));
    }
  }

  function getCurrentAverage() {
    switch (period) {
      case "daily": return revenueData.averageDaily;
      case "weekly": return revenueData.averageWeekly;
      case "monthly": return revenueData.averageMonthly;
      default: return revenueData.averageDaily;
    }
  }

  function getMaxRevenue() {
    const data = getCurrentData();
    if (data.length === 0) return 0;
    return Math.max(...data.map(d => d.amount));
  }

  if (isLoading) {
    return (
      <div className="vendor-revenue-page">
        <div className="vendor-revenue-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const currentData = getCurrentData();
  const maxRevenue = getMaxRevenue();
  const currentAverage = getCurrentAverage();

  return (
    <div className="vendor-revenue-page">
      <div className="vendor-revenue-container">
        <div className="vendor-revenue-header">
          <h1>Revenue Analytics</h1>
          <button className="refresh-btn" onClick={loadOrders}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="revenue-summary-cards">
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-info">
              <span className="summary-label">Total Revenue</span>
              <span className="summary-value">₱{revenueData.totalRevenue.toFixed(2)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <span className="summary-label">Average {period}</span>
              <span className="summary-value">₱{currentAverage.toFixed(2)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📦</div>
            <div className="summary-info">
              <span className="summary-label">Total Orders</span>
              <span className="summary-value">{orders.length}</span>
            </div>
          </div>
        </div>

        <div className="period-selector">
          <button
            className={`period-btn ${period === "daily" ? "active" : ""}`}
            onClick={() => setPeriod("daily")}
          >
            Daily
          </button>
          <button
            className={`period-btn ${period === "weekly" ? "active" : ""}`}
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </button>
          <button
            className={`period-btn ${period === "monthly" ? "active" : ""}`}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
        </div>

        <div className="revenue-chart">
          <h3>Revenue Overview</h3>
          {currentData.length === 0 ? (
            <div className="chart-empty">
              <p>No revenue data available yet.</p>
            </div>
          ) : (
            <div className="chart-bars">
              {currentData.map((item, index) => {
                const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                const label = item.label.slice(5);

                return (
                  <div key={index} className="chart-bar-wrapper">
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <span className="bar-tooltip">₱{item.amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="chart-label">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="category-revenue">
          <h3>Revenue by Category</h3>
          {revenueData.categoryRevenue.length === 0 ? (
            <p className="empty-text">No category data available.</p>
          ) : (
            <div className="category-list">
              {revenueData.categoryRevenue.map((cat, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{cat.category}</span>
                    <span className="category-amount">₱{cat.amount.toFixed(2)}</span>
                  </div>
                  <div className="category-bar-container">
                    <div 
                      className="category-bar" 
                      style={{ 
                        width: `${(cat.amount / revenueData.totalRevenue) * 100}%`,
                        backgroundColor: `hsl(${index * 45}, 70%, 50%)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}