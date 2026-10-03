import { useState, useEffect, useRef } from "react";
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

// PDF export
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  gray: '#6b6b6b',
};

const CHART_COLORS = [
  '#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9',
  '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71',
  '#3498db', '#e74c3c'
];

const VENDOR_STATUS_COLORS: Record<string, string> = {
  verified: '#4ecdc4',
  unverified: '#ffde59',
  deactivated: '#ff3131',
  suspended: '#9b59b6',
};

export function AdminDashboard({ token, onNavigate }: AdminDashboardProps) {
  const [insights, setInsights] = useState<any>(null);
  const [orderInsights, setOrderInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Chart data states
  const [studentRegistrationData, setStudentRegistrationData] = useState<any>(null);
  const [courseDistributionData, setCourseDistributionData] = useState<any>(null);
  const [verifiedComparisonData, setVerifiedComparisonData] = useState<any>(null);
  const [stallSectionData, setStallSectionData] = useState<any>(null);
  const [stallDetailsData, setStallDetailsData] = useState<any[]>([]);
  const [stallRevenueBarData, setStallRevenueBarData] = useState<any>(null);
  const [orderTrendData, setOrderTrendData] = useState<any>(null);
  const [ordersByCourseData, setOrdersByCourseData] = useState<any>(null);
  const [vendorByStallData, setVendorByStallData] = useState<any>(null);
  const [vendorStatusData, setVendorStatusData] = useState<any>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [orderPeriod, setOrderPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');

  const dashboardRef = useRef<HTMLDivElement>(null);

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
      const courseValues = Object.values(courseDist) as number[];
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

      // Stall Details (used for revenue bar + vendor-per-stall pie)
      const stalls = await getStallDetailsWithRevenue(token);
      setStallDetailsData(stalls);

      setStallRevenueBarData({
        labels: stalls.map((s: any) => s.stallName),
        datasets: [
          {
            label: 'Revenue (₱)',
            data: stalls.map((s: any) => s.totalRevenue),
            backgroundColor: COLORS.orange,
            borderRadius: 6,
          }
        ]
      });

      const stallsWithVendors = stalls.filter((s: any) => s.vendorCount > 0);
      setVendorByStallData({
        labels: stallsWithVendors.map((s: any) => s.stallName),
        datasets: [
          {
            data: stallsWithVendors.map((s: any) => s.vendorCount),
            backgroundColor: CHART_COLORS.slice(0, stallsWithVendors.length),
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

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
      const orderCourseValues = Object.values(ordersByCourse) as number[];
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

      // Vendor Status Breakdown (verified/unverified/deactivated/suspended)
      const vendorStatusRecord: Record<string, number> = insights?.vendors?.byStatus || {};
      const statusLabels = Object.keys(vendorStatusRecord);
      setVendorStatusData({
        labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [
          {
            data: statusLabels.map(s => vendorStatusRecord[s]),
            backgroundColor: statusLabels.map(s => VENDOR_STATUS_COLORS[s] || COLORS.gray),
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }

  async function handleDownloadPdf() {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fafaf8',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`FoodHub-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      setError("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12, family: 'Poppins' },
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      }
    },
    cutout: '60%',
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11, family: 'Poppins' } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Poppins' } }
      }
    },
    interaction: { intersect: false, mode: 'index' as const },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11, family: 'Poppins' } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Poppins' } }
      }
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
  const vendorStats = insights?.vendors || {};

  // ── Derived text helpers ──────────────────────────────────────────
  const verifiedPct = studentStats.verified && stats.totalStudents
    ? Math.round((studentStats.verified / stats.totalStudents) * 100)
    : 0;

  const topCourse = courseDistributionData?.labels?.length
    ? courseDistributionData.labels.reduce((top: string, label: string, i: number) =>
        courseDistributionData.datasets[0].data[i] > (courseDistributionData.datasets[0].data[courseDistributionData.labels.indexOf(top)] ?? 0) ? label : top,
        courseDistributionData.labels[0])
    : null;

  const topStall = stallDetailsData.length
    ? [...stallDetailsData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
    : null;

  const topOrderCourseIdx = ordersByCourseData?.datasets?.[0]?.data?.length
    ? ordersByCourseData.datasets[0].data.indexOf(Math.max(...ordersByCourseData.datasets[0].data))
    : -1;
  const topOrderCourse = topOrderCourseIdx >= 0 ? ordersByCourseData.labels[topOrderCourseIdx] : null;
  const topOrderCoursePct = topOrderCourseIdx >= 0
    ? Math.round((ordersByCourseData.datasets[0].data[topOrderCourseIdx] / orderStats.total) * 100)
    : 0;

  const topVendorStallIdx = vendorByStallData?.datasets?.[0]?.data?.length
    ? vendorByStallData.datasets[0].data.indexOf(Math.max(...vendorByStallData.datasets[0].data))
    : -1;
  const topVendorStall = topVendorStallIdx >= 0 ? vendorByStallData.labels[topVendorStallIdx] : null;

  const vendorVerifiedPct = vendorStats.byStatus?.verified && vendorStats.total
    ? Math.round((vendorStats.byStatus.verified / vendorStats.total) * 100)
    : 0;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container" ref={dashboardRef}>
        <div className="admin-dashboard-header">
          <div className="admin-dashboard-header-text">
            <h1>Dashboard</h1>
            <p>Overview of your FoodHub platform</p>
          </div>
          <button
            className="download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isExporting}
          >
            <i className="fas fa-file-pdf"></i>
            {isExporting ? "Generating..." : "Download PDF"}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ══════════════ SECTION 1: QUICK ANALYTICS (white) ══════════════ */}
        <div className="analytics-section section-quick">
          <div className="analytics-section-header">
            <h2>⚡ Quick Analytics</h2>
          </div>

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
                <span className="stat-value">{vendorStats.total || 0}</span>
                <span className="stat-label">Total Vendors</span>
                <span className="stat-sub">{vendorStats.byStatus?.verified || 0} verified</span>
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
                <span className="stat-sub">₱{orderStats.revenue?.total?.toFixed(2) || "0.00"} revenue</span>
              </div>
            </div>
          </div>

          <p className="quick-actions-label">Quick Actions</p>
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

        {/* ══════════════ SECTION 2: STUDENT ANALYTICS (red) ══════════════ */}
        <div className="analytics-section section-students">
          <div className="analytics-section-header">
            <h2>🎓 Student Analytics</h2>
            <div className="period-selector">
              <button className={`period-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
              <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
              <button className={`period-btn ${period === 'custom' ? 'active' : ''}`} onClick={() => setPeriod('custom')}>Custom</button>
            </div>
          </div>

          {/* Verification graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Verification Status</h3>
              <div className="analytics-graph-inner">
                {verifiedComparisonData ? (
                  <Pie data={verifiedComparisonData} options={pieOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
              <p className="chart-total">Total Students: {stats.totalStudents || 0}</p>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {verifiedPct}% of students are verified, meaning most accounts have been confirmed as
                legitimate TUP students. {studentStats.unverified || 0} accounts are still pending verification
                and {studentStats.deactivated || 0} have been deactivated — worth reviewing periodically to
                keep the student base clean and secure.
              </p>
            </div>
          </div>

          {/* Students by course graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Students by Course</h3>
              <div className="analytics-graph-inner">
                {courseDistributionData ? (
                  <Pie data={courseDistributionData} options={pieOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {topCourse
                  ? `${topCourse} has the largest student population on the platform. This breakdown helps identify which courses to prioritize when planning stall offerings, promos, or targeted announcements.`
                  : "This breakdown shows which courses make up your student base, helping you tailor stall offerings and announcements accordingly."}
              </p>
            </div>
          </div>

          {/* Registration trend graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Student Registration Trend</h3>
              <div className="analytics-graph-inner">
                {studentRegistrationData ? (
                  <Line data={studentRegistrationData} options={lineOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                This tracks new student sign-ups over the selected {period} period. Spikes usually line up
                with the start of a semester or enrollment drives — use this to gauge onboarding health and
                plan capacity ahead of peak periods.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════ SECTION 3: STALL ANALYTICS (orange) ══════════════ */}
        <div className="analytics-section section-stalls">
          <div className="analytics-section-header">
            <h2>🏪 Stall Analytics</h2>
          </div>

          {/* Section status graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Sections & Operation Status</h3>
              <div className="analytics-graph-inner">
                {stallSectionData ? (
                  <Pie data={stallSectionData} options={pieOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                This shows how many of your marketplace sections are occupied versus empty, and how many
                stalls are currently active versus inactive. Empty sections represent expansion opportunities
                for onboarding new vendors.
              </p>
            </div>
          </div>

          {/* Revenue per stall bar graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Total Revenue per Stall</h3>
              <div className="analytics-graph-inner">
                {stallRevenueBarData ? (
                  <Bar data={stallRevenueBarData} options={barOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {topStall
                  ? `${topStall.stallName} leads in total revenue at ₱${topStall.totalRevenue.toFixed(2)}, indicating strong customer demand. Comparing stalls side by side helps identify top performers versus stalls that may need support.`
                  : "This compares completed-order revenue across all stalls, helping identify top performers versus stalls that may need support."}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════ SECTION 4: ORDERS ANALYTICS (yellow) ══════════════ */}
        <div className="analytics-section section-orders">
          <div className="analytics-section-header">
            <h2>📦 Order Analytics</h2>
            <div className="period-selector">
              <button className={`period-btn ${orderPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setOrderPeriod('weekly')}>Weekly</button>
              <button className={`period-btn ${orderPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setOrderPeriod('monthly')}>Monthly</button>
              <button className={`period-btn ${orderPeriod === 'custom' ? 'active' : ''}`} onClick={() => setOrderPeriod('custom')}>Custom</button>
            </div>
          </div>

          {/* Order trend graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Order Trend</h3>
              <div className="analytics-graph-inner">
                {orderTrendData ? (
                  <Line data={orderTrendData} options={lineOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                This tracks order volume over the selected {orderPeriod} period, helping you spot peak ordering
                times (like lunch rushes) so stalls can prepare stock and staffing accordingly.
              </p>
            </div>
          </div>

          {/* Orders by course pie graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Orders by Course (%)</h3>
              <div className="analytics-graph-inner">
                {ordersByCourseData ? (
                  <Pie data={ordersByCourseData} options={pieOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {topOrderCourse
                  ? `${topOrderCourse} students account for roughly ${topOrderCoursePct}% of all orders, making them the most active ordering group. This is useful for tailoring promos and menu offerings to the courses that order most.`
                  : "This shows the share of total orders coming from each course, useful for tailoring promos to the courses that order most."}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════ SECTION 5: VENDOR ANALYTICS (gray) ══════════════ */}
        <div className="analytics-section section-vendors">
          <div className="analytics-section-header">
            <h2>👤 Vendor Analytics</h2>
          </div>

          {/* Vendors per stall pie graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Vendors per Stall (%)</h3>
              <div className="analytics-graph-inner">
                {vendorByStallData ? (
                  <Pie data={vendorByStallData} options={pieOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {topVendorStall
                  ? `${topVendorStall} has the largest vendor team, which can indicate either a high-volume stall or an opportunity to rebalance staffing across other stalls.`
                  : "This shows how vendor staff are distributed across stalls, helping identify understaffed stalls versus stalls with surplus vendors."}
              </p>
            </div>
          </div>

          {/* Vendor status pie graph */}
          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Vendor Status Breakdown</h3>
              <div className="analytics-graph-inner">
                {vendorStatusData ? (
                  <Pie data={vendorStatusData} options={pieOptions} />
                ) : (
                  <div className="chart-placeholder">Loading...</div>
                )}
              </div>
              <p className="chart-total">Total Vendors: {vendorStats.total || 0}</p>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {vendorVerifiedPct}% of vendors are verified and in good standing. Keep an eye on
                unverified, suspended, or deactivated accounts — these may need admin follow-up to
                resolve compliance issues or restore access.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}