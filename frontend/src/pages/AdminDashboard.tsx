import { useState, useEffect } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getDashboardInsights, getOrderInsights } from "../services/report.service";
import "../styles/AdminDashboard.css";

interface AdminDashboardProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function AdminDashboard({ token, onNavigate, onLogout }: AdminDashboardProps) {
  const [insights, setInsights] = useState<any>(null);
  const [orderInsights, setOrderInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  async function fetchDashboardData() {
    setIsLoading(true);
    setError(null);

    try {
      const [dashboardData, ordersData] = await Promise.all([
        getDashboardInsights(token),
        getOrderInsights(token)
      ]);
      
      setInsights(dashboardData);
      setOrderInsights(ordersData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="admin-dashboard-page">
        <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin" />
        <div className="admin-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const stats = insights?.summary || {};
  const studentStats = insights?.students || {};
  const stallStats = insights?.stalls || {};
  const orderStats = insights?.orders || {};
  const revenueStats = orderInsights || {};

  return (
    <div className="admin-dashboard-page">
      <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin" />

      <div className="admin-dashboard-container">
        <div className="admin-dashboard-header">
          <h1>Dashboard</h1>
          <p>Overview of your FoodHub platform</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeftColor: "#ff3131" }}>
            <div className="stat-icon">🏪</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalStalls || 0}</span>
              <span className="stat-label">Total Stalls</span>
              <span className="stat-sub">{stallStats.active || 0} active</span>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "#ff751f" }}>
            <div className="stat-icon">👤</div>
            <div className="stat-info">
              <span className="stat-value">{insights?.vendors?.total || 0}</span>
              <span className="stat-label">Total Vendors</span>
              <span className="stat-sub">
                {insights?.vendors?.byStatus?.verified || 0} verified
              </span>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "#ffde59" }}>
            <div className="stat-icon">🎓</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalStudents || 0}</span>
              <span className="stat-label">Total Students</span>
              <span className="stat-sub">{studentStats.verified || 0} verified</span>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: "#4ecdc4" }}>
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalOrders || 0}</span>
              <span className="stat-label">Total Orders</span>
              <span className="stat-sub">₱{orderStats.totalRevenue?.toFixed(2) || "0.00"} revenue</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => onNavigate("admin-stalls")}>
              <i className="fas fa-plus-circle"></i>
              <span>Add Stall</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate("admin-vendors")}>
              <i className="fas fa-user-check"></i>
              <span>Manage Vendors</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate("admin-students")}>
              <i className="fas fa-user-graduate"></i>
              <span>Manage Students</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate("trends")}>
              <i className="fas fa-chart-line"></i>
              <span>View Trends</span>
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        {revenueStats.recentOrders && revenueStats.recentOrders.length > 0 && (
          <div className="recent-orders">
            <h2>Recent Orders</h2>
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Stall</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueStats.recentOrders.slice(0, 5).map((order: any) => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6).toUpperCase()}</td>
                      <td>{order.stallId?.stallName || "Unknown"}</td>
                      <td>₱{order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`order-status ${order.orderStatus || "pending"}`}>
                          {order.orderStatus || "Pending"}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}