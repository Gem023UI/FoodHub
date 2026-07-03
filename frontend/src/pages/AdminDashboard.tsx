import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { 
  getDashboardInsights, 
  getOrderInsights,
  getStudentRegistrationTrend,
  getStudentCourseDistribution,
  getStudentVerifiedComparison,
  getStallSectionStatus,
  getStallDetailsWithRevenue,
  getOrderTrend,
  getOrdersByCourseDistribution
} from "../services/report.service";
import "../styles/AdminDashboard.css";

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

interface AdminDashboardProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

// Color palette
const COLORS = {
  red: '#ff3131',
  orange: '#ff751f',
  yellow: '#ffde59',
  green: '#4ecdc4',
  blue: '#4a90d9',
  purple: '#9b59b6',
  pink: '#e91e63',
  teal: '#1abc9c',
};

const CHART_COLORS = [
  '#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9',
  '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71',
  '#3498db', '#e74c3c'
];

export function AdminDashboard({ token, onNavigate, onLogout }: AdminDashboardProps) {
  const [insights, setInsights] = useState<any>(null);
  const [orderInsights, setOrderInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart data states
  const [studentRegistrationData, setStudentRegistrationData] = useState<any>(null);
  const [courseDistributionData, setCourseDistributionData] = useState<any>(null);
  const [verifiedComparisonData, setVerifiedComparisonData] = useState<any>(null);
  const [stallSectionData, setStallSectionData] = useState<any>(null);
  const [stallDetailsData, setStallDetailsData] = useState<any[]>([]);
  const [orderTrendData, setOrderTrendData] = useState<any>(null);
  const [ordersByCourseData, setOrdersByCourseData] = useState<any>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [orderPeriod, setOrderPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    if (insights) {
      fetchChartData();
    }
  }, [insights, period, orderPeriod]);

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

  async function fetchChartData() {
    try {
      // Student Registration Trend
      const regData = await getStudentRegistrationTrend(token, period);
      setStudentRegistrationData({
        labels: regData.labels,
        datasets: [
          {
            label: 'New Students',
            data: regData.values,
            borderColor: COLORS.red,
            backgroundColor: 'rgba(255, 49, 49, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: COLORS.red,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }
        ]
      });

      // Student Course Distribution
      const courseDist = await getStudentCourseDistribution(token);
      const courseLabels = Object.keys(courseDist);
      const courseValues = Object.values(courseDist);
      setCourseDistributionData({
        labels: courseLabels,
        datasets: [
          {
            data: courseValues,
            backgroundColor: CHART_COLORS.slice(0, courseLabels.length),
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

      // Student Verified Comparison
      const verifiedComp = await getStudentVerifiedComparison(token);
      setVerifiedComparisonData({
        labels: ['Verified', 'Unverified', 'Deactivated'],
        datasets: [
          {
            data: [verifiedComp.verified, verifiedComp.unverified, verifiedComp.deactivated],
            backgroundColor: [COLORS.green, COLORS.yellow, COLORS.red],
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

      // Stall Section Status
      const sectionStatus = await getStallSectionStatus(token);
      setStallSectionData({
        labels: ['Occupied Sections', 'Empty Sections', 'Active Stalls', 'Inactive Stalls'],
        datasets: [
          {
            data: [
              sectionStatus.occupiedSections,
              sectionStatus.emptySections,
              sectionStatus.activeStalls,
              sectionStatus.inactiveStalls
            ],
            backgroundColor: [COLORS.green, COLORS.gray, COLORS.blue, COLORS.red],
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

      // Stall Details
      const stalls = await getStallDetailsWithRevenue(token);
      setStallDetailsData(stalls);

      // Order Trend
      const orderTrend = await getOrderTrend(token, orderPeriod);
      setOrderTrendData({
        labels: orderTrend.labels,
        datasets: [
          {
            label: 'Orders',
            data: orderTrend.values,
            borderColor: COLORS.blue,
            backgroundColor: 'rgba(74, 144, 217, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: COLORS.blue,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }
        ]
      });

      // Orders by Course Distribution
      const ordersByCourse = await getOrdersByCourseDistribution(token);
      const orderCourseLabels = Object.keys(ordersByCourse);
      const orderCourseValues = Object.values(ordersByCourse);
      setOrdersByCourseData({
        labels: orderCourseLabels,
        datasets: [
          {
            data: orderCourseValues,
            backgroundColor: CHART_COLORS.slice(0, orderCourseLabels.length),
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12, family: 'Poppins' },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      }
    },
    cutout: '60%',
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          font: { size: 11 },
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard-page">
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

        {/* ─── SECTION 1: STUDENTS ─────────────────────────────────────────── */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📊 Student Analytics</h2>
            <div className="period-selector">
              <button 
                className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
                onClick={() => setPeriod('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
                onClick={() => setPeriod('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`period-btn ${period === 'custom' ? 'active' : ''}`}
                onClick={() => setPeriod('custom')}
              >
                Custom
              </button>
            </div>
          </div>
          <div className="charts-grid-3">
            {/* Pie: Verified vs Total */}
            <div className="chart-container">
              <h3>Verification Status</h3>
              {verifiedComparisonData ? (
                <Pie data={verifiedComparisonData} options={pieOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
              <p className="chart-total">Total Students: {stats.totalStudents || 0}</p>
            </div>

            {/* Line: Registration Trend */}
            <div className="chart-container">
              <h3>Student Registration Trend</h3>
              {studentRegistrationData ? (
                <Line data={studentRegistrationData} options={lineOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
            </div>

            {/* Pie: Students by Course */}
            <div className="chart-container">
              <h3>Students by Course</h3>
              {courseDistributionData ? (
                <Pie data={courseDistributionData} options={pieOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: STALLS ───────────────────────────────────────────── */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🏪 Stall Analytics</h2>
          </div>
          <div className="charts-grid-2">
            {/* Pie: Section Status */}
            <div className="chart-container">
              <h3>Sections & Operation Status</h3>
              {stallSectionData ? (
                <Pie data={stallSectionData} options={pieOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
            </div>

            {/* Stall Cards */}
            <div className="chart-container stall-cards-container">
              <h3>Stall Details</h3>
              <div className="stall-cards-grid">
                {stallDetailsData.length > 0 ? (
                  stallDetailsData.slice(0, 6).map((stall) => (
                    <div key={stall._id} className="stall-card">
                      <img 
                        src={stall.stallPicture || 'https://via.placeholder.com/60x60?text=Stall'} 
                        alt={stall.stallName}
                        className="stall-card-image"
                      />
                      <div className="stall-card-info">
                        <h4>{stall.stallName}</h4>
                        <p>Section {stall.section}</p>
                        <div className="stall-card-stats">
                          <span>💰 ₱{stall.totalRevenue.toFixed(2)}</span>
                          <span>📦 {stall.productCount}</span>
                          <span>👤 {stall.vendorCount}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="chart-placeholder">No stalls available</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: ORDERS ───────────────────────────────────────────── */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📦 Order Analytics</h2>
            <div className="period-selector">
              <button 
                className={`period-btn ${orderPeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => setOrderPeriod('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`period-btn ${orderPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setOrderPeriod('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`period-btn ${orderPeriod === 'custom' ? 'active' : ''}`}
                onClick={() => setOrderPeriod('custom')}
              >
                Custom
              </button>
            </div>
          </div>
          <div className="charts-grid-2">
            {/* Line: Order Trend */}
            <div className="chart-container">
              <h3>Order Trend</h3>
              {orderTrendData ? (
                <Line data={orderTrendData} options={lineOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
            </div>

            {/* Pie: Orders by Course */}
            <div className="chart-container">
              <h3>Orders by Course</h3>
              {ordersByCourseData ? (
                <Pie data={ordersByCourseData} options={pieOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
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