import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStudentInsights } from "../services/report.service";
import {
  getStudentRegistrationTrend,
  getStudentCourseDistribution,
  getStudentVerifiedComparison
} from "../services/report.service";
import "../styles/AdminStudents.css";

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
  Title,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  tuptId: string;
  course: string;
  section: string;
  contactNumber: string;
  status: string;
  orderCount: number;
  totalSpent: number;
}

interface AdminStudentsProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Color palette
const COLORS = {
  red: '#ff3131',
  orange: '#ff751f',
  yellow: '#ffde59',
  green: '#4ecdc4',
  blue: '#4a90d9',
  purple: '#9b59b6',
};

const CHART_COLORS = [
  '#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9',
  '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71',
  '#3498db', '#e74c3c'
];

export function AdminStudents({ token, onNavigate, onLogout }: AdminStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Chart data states
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [courseDistributionData, setCourseDistributionData] = useState<any>(null);
  const [verifiedComparisonData, setVerifiedComparisonData] = useState<any>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');

  // Edit/Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchChartData();
  }, [token]);

  useEffect(() => {
    fetchChartData();
  }, [period]);

  async function fetchStudents() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStudentInsights(token);
      setStudents(data.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChartData() {
    try {
      // Student Registration Trend
      const regData = await getStudentRegistrationTrend(token, period);
      setRegistrationData({
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

    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }

  // ─── EDIT STUDENT STATUS ──────────────────────────────────────────────
  async function handleEditStudent() {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/users/students/${selectedStudent._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: editStatus }),
      });

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to update student");
      }

      const updated = await response.json();
      setStudents(prev => prev.map(s => 
        s._id === selectedStudent._id ? { ...s, status: updated.status } : s
      ));
      
      setShowEditModal(false);
      setSelectedStudent(null);
      setSuccessMsg("Student status updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── DELETE STUDENT ────────────────────────────────────────────────────
  async function handleDeleteStudent() {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/users/students/${selectedStudent._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to delete student");
      }

      setStudents(prev => prev.filter(s => s._id !== selectedStudent._id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
      setSuccessMsg("Student deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(student: Student) {
    setSelectedStudent(student);
    setEditStatus(student.status);
    setShowEditModal(true);
  }

  function openDeleteModal(student: Student) {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  }

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 11, family: 'Poppins' },
          padding: 12,
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
          font: { size: 10 },
          stepSize: 1,
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
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
      <div className="admin-students-page">
        <div className="admin-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const totalStudents = students.length;

  return (
    <div className="admin-students-page">
      <div className="admin-students-container">
        <div className="admin-students-header">
          <div className="header-left">
            <h1>Manage Students</h1>
            <p className="subtitle">{totalStudents} students total</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* ─── CHARTS SECTION ─────────────────────────────────────────────── */}
        <div className="students-charts-section">
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
            {/* Pie: Verified vs Unverified vs Deactivated */}
            <div className="chart-container">
              <h3>Verification Status</h3>
              {verifiedComparisonData ? (
                <Pie data={verifiedComparisonData} options={pieOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
              <p className="chart-total">Total Students: {totalStudents}</p>
            </div>

            {/* Line: Registration Trend */}
            <div className="chart-container">
              <h3>Student Registration Trend</h3>
              {registrationData ? (
                <Line data={registrationData} options={lineOptions} />
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

        {/* ─── TABLE SECTION ───────────────────────────────────────────────── */}
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No Students Yet</h3>
            <p>Students will appear here once they register.</p>
          </div>
        ) : (
          <div className="table-section">
            <h2>📋 Student Records</h2>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>TUPT ID</th>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Orders</th>
                    <th>Spent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="student-name">
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.email}</td>
                      <td>{student.tuptId || "—"}</td>
                      <td>{student.course || "—"}</td>
                      <td>{student.section || "—"}</td>
                      <td>
                        <span className={`status-badge ${student.status === "verified" ? "active" : student.status === "deactivated" ? "deactivated" : "suspended"}`}>
                          {student.status || "Pending"}
                        </span>
                      </td>
                      <td>{student.orderCount || 0}</td>
                      <td>₱{(student.totalSpent || 0).toFixed(2)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn edit" 
                            onClick={() => openEditModal(student)}
                            title="Edit Status"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => openDeleteModal(student)}
                            title="Delete Student"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── EDIT STATUS MODAL ───────────────────────────────────────────── */}
      {showEditModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Student Status</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="student-info">
                <p><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Current Status:</strong> 
                  <span className={`status-badge ${selectedStudent.status === "verified" ? "active" : "suspended"}`}>
                    {selectedStudent.status || "Pending"}
                  </span>
                </p>
              </div>
              <div className="form-group">
                <label>New Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="status-select"
                >
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditStudent} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ──────────────────────────────────── */}
      {showDeleteModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Student</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="delete-icon">⚠️</div>
              <p>Are you sure you want to delete <strong>"{selectedStudent.firstName} {selectedStudent.lastName}"</strong>?</p>
              <p className="delete-warning">This action cannot be undone. All associated data will be permanently removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteStudent} disabled={isSubmitting}>
                {isSubmitting ? "Deleting..." : "Delete Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}