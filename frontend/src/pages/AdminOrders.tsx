import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStalls } from "../services/stall.service";
import { getStallOrders, Order } from "../services/order.service";
import { getStallSectionStatus, getStallDetailsWithRevenue, getOrderInsights } from "../services/report.service";
import "../styles/AdminOrders.css";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface AdminOrdersProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const COLORS = { red: '#ff3131', orange: '#ff751f', green: '#4ecdc4', blue: '#4a90d9' };
const CHART_COLORS = ['#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9', '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71'];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled"
};

export function AdminOrders({ token, onNavigate, onLogout }: AdminOrdersProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sectionStatusData, setSectionStatusData] = useState<any>(null);
  const [stallRevenueData, setStallRevenueData] = useState<any>(null);
  const [todayTotalRevenue, setTodayTotalRevenue] = useState(0);

  const [stallOrdersMap, setStallOrdersMap] = useState<Record<string, { stallName: string; orders: Order[] }>>({});

  useEffect(() => {
    fetchAll();
  }, [token]);

  async function fetchAll() {
    setIsLoading(true);
    setError(null);
    try {
      const [stalls, sectionStatus, stallDetails, orderInsights] = await Promise.all([
        getStalls(),
        getStallSectionStatus(token),
        getStallDetailsWithRevenue(token),
        getOrderInsights(token)
      ]);

      setSectionStatusData({
        labels: ['Occupied Sections', 'Empty Sections'],
        datasets: [{
          data: [sectionStatus.occupiedSections, sectionStatus.emptySections],
          backgroundColor: [COLORS.green, COLORS.red],
          borderWidth: 2, borderColor: '#fff',
        }]
      });

      const sorted = [...stallDetails].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
      setStallRevenueData({
        labels: sorted.map(s => s.stallName.length > 15 ? s.stallName.slice(0, 15) + '...' : s.stallName),
        datasets: [{
          label: 'Revenue (₱)',
          data: sorted.map(s => s.totalRevenue),
          backgroundColor: CHART_COLORS.slice(0, sorted.length),
          borderRadius: 6,
        }]
      });

      setTodayTotalRevenue(orderInsights.todayRevenue || 0);

      // Today's orders per stall
      const todayStr = new Date().toDateString();
      const ordersMap: Record<string, { stallName: string; orders: Order[] }> = {};

      await Promise.all(stalls.map(async (stall) => {
        try {
          const orders = await getStallOrders(token, stall._id);
          const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
          ordersMap[stall._id] = { stallName: stall.stallName, orders: todaysOrders };
        } catch (err) {
          ordersMap[stall._id] = { stallName: stall.stallName, orders: [] };
        }
      }));

      setStallOrdersMap(ordersMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders data");
    } finally {
      setIsLoading(false);
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 12, family: 'Poppins' }, usePointStyle: true } } },
    cutout: '60%',
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11, family: 'Poppins' } } },
      x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Poppins' } } }
    },
  };

  if (isLoading) {
    return (
      <div className="admin-orders-page">
        <div className="admin-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const stallEntries = Object.entries(stallOrdersMap);
  const totalOrdersToday = stallEntries.reduce((sum, [, v]) => sum + v.orders.length, 0);

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        <div className="admin-orders-header">
          <div className="header-left">
            <h1>Order Management</h1>
            <p className="subtitle">Today's orders across all stalls</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Quick Insight ── */}
        <div className="quick-insight-card">
          <div className="quick-insight-icon">💰</div>
          <div className="quick-insight-info">
            <span className="quick-insight-value">₱{todayTotalRevenue.toFixed(2)}</span>
            <span className="quick-insight-label">Total Revenue From All Stalls Today</span>
            <span className="quick-insight-sub">{totalOrdersToday} orders placed today</span>
          </div>
        </div>

        {/* ── Stall Analytics (reused from dashboard) ── */}
        <div className="analytics-section-white">
          <div className="section-header">
            <h2>Stall Analytics</h2>
          </div>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Sections Overview</h3>
              <div className="analytics-graph-inner">
                {sectionStatusData ? <Pie data={sectionStatusData} options={pieOptions} /> : <div className="chart-placeholder">Loading...</div>}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>This shows how many marketplace sections are occupied versus empty — useful context when reviewing order volume per stall.</p>
            </div>
          </div>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Top Stalls by Revenue</h3>
              <div className="analytics-graph-inner">
                {stallRevenueData ? <Bar data={stallRevenueData} options={barOptions} /> : <div className="chart-placeholder">Loading...</div>}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>Comparing all-time completed revenue across stalls helps you spot which stalls are driving the most order volume overall.</p>
            </div>
          </div>
        </div>

        {/* ── Today's Orders, one table per stall ── */}
        <h2 className="records-label">Today's Orders</h2>
        {stallEntries.map(([stallId, { stallName, orders }]) => (
          <div key={stallId} className="stall-orders-table-block">
            <h3 className="stall-table-title">{stallName}</h3>
            {orders.length === 0 ? (
              <div className="empty-state small">
                <p>No orders placed today.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const student = typeof order.studentId === "object" ? order.studentId : null;
                      return (
                        <tr key={order._id}>
                          <td className="order-student">{student ? `${student.firstName} ${student.lastName}` : "—"}</td>
                          <td>{order.course || "—"}</td>
                          <td>{order.orderLines.map(l => `${l.productName} x${l.quantity}`).join(", ")}</td>
                          <td>₱{order.totalAmount.toFixed(2)}</td>
                          <td className="order-payment">{order.paymentMethod}</td>
                          <td>
                            <span className={`order-status ${order.orderStatus}`}>
                              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}