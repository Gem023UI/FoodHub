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

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Filler
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

const COLORS = {
  red: '#ff3131', orange: '#ff751f', yellow: '#ffde59',
  green: '#4ecdc4', blue: '#4a90d9', purple: '#9b59b6',
};

const CHART_COLORS = [
  '#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9',
  '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71',
  '#3498db', '#e74c3c'
];

const STUDENT_STATUSES = ["verified", "unverified", "deactivated"];

export function AdminStudents({ token, onNavigate }: AdminStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [registrationData, setRegistrationData] = useState<any>(null);
  const [courseDistributionData, setCourseDistributionData] = useState<any>(null);
  const [verifiedComparisonData, setVerifiedComparisonData] = useState<any>(null);
  const [period] = useState<'weekly' | 'monthly' | 'custom'>('weekly');

  // Inline status edit + delete modal (same pattern as vendors)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course filter
  const [courseFilter, setCourseFilter] = useState<string>("All");

  useEffect(() => {
    fetchStudents();
  }, [token]);

  useEffect(() => {
    fetchChartData();
  }, [period, token]);

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
      const regData = await getStudentRegistrationTrend(token, period);
      setRegistrationData({
        labels: regData.labels,
        datasets: [{
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
        }]
      });

      const courseDist = await getStudentCourseDistribution(token);
      const courseLabels = Object.keys(courseDist).map(label => label === "Unknown" ? "Staff" : label);
      const courseValues = Object.values(courseDist) as number[];
      setCourseDistributionData({
        labels: courseLabels,
        datasets: [{
          data: courseValues,
          backgroundColor: CHART_COLORS.slice(0, courseLabels.length),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      });

      const verifiedComp = await getStudentVerifiedComparison(token);
      setVerifiedComparisonData({
        labels: ['Verified', 'Unverified', 'Deactivated'],
        datasets: [{
          data: [verifiedComp.verified, verifiedComp.unverified, verifiedComp.deactivated],
          backgroundColor: [COLORS.green, COLORS.yellow, COLORS.red],
          borderWidth: 2,
          borderColor: '#fff',
        }]
      });
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }

  async function handleStatusChange(studentId: string, status: string) {
    try {
      const response = await fetch(`${apiBaseUrl}/users/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to update student");
      }
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, status } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setEditingStudentId(null);
    }
  }

  async function handleDeleteStudent() {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/users/students/${selectedStudent._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to delete student");
      }
      setStudents(prev => prev.filter(s => s._id !== selectedStudent._id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
      setSuccessMsg("Student deleted successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeleteModal(student: Student) {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 12, family: 'Poppins' }, usePointStyle: true } } },
    cutout: '60%',
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11, family: 'Poppins' } } },
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Poppins' } } }
    },
  };

  if (isLoading) {
    return (
      <div className="admin-students-page">
        <div className="admin-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const totalStudents = students.length;
  const verifiedPct = totalStudents ? Math.round((students.filter(s => s.status === "verified").length / totalStudents) * 100) : 0;

  const topCourse = courseDistributionData?.labels?.length
    ? courseDistributionData.labels.reduce((top: string, label: string, i: number) =>
        courseDistributionData.datasets[0].data[i] > (courseDistributionData.datasets[0].data[courseDistributionData.labels.indexOf(top)] ?? 0) ? label : top,
        courseDistributionData.labels[0])
    : null;

  const courseOptions = ["All", ...Array.from(new Set(students.map(s => s.course).filter(Boolean)))];
  const filteredStudents = courseFilter === "All" ? students : students.filter(s => s.course === courseFilter);

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

        {/* ── Student Analytics (white, graph-left/text-right, stacked) ── */}
        <div className="analytics-section-white">
          <div className="section-header">
            <h2>Student Analytics</h2>
            {/* <div className="period-selector">
              <button className={`period-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
              <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
              <button className={`period-btn ${period === 'custom' ? 'active' : ''}`} onClick={() => setPeriod('custom')}>Custom</button>
            </div> */}
          </div>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Verification Status</h3>
              <div className="analytics-graph-inner">
                {verifiedComparisonData ? <Pie data={verifiedComparisonData} options={pieOptions} /> : <div className="chart-placeholder">Loading...</div>}
              </div>
              <p className="chart-total">Total Students: {totalStudents}</p>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>{verifiedPct}% of students are verified. Keep an eye on unverified and deactivated accounts that may need admin review.</p>
            </div>
          </div>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Students by Course</h3>
              <div className="analytics-graph-inner">
                {courseDistributionData ? <Pie data={courseDistributionData} options={pieOptions} /> : <div className="chart-placeholder">Loading...</div>}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>{topCourse ? `${topCourse} has the largest student population, useful for tailoring stall offerings and announcements.` : "This breakdown shows which courses make up your student base."}</p>
            </div>
          </div>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Student Registration Trend</h3>
              <div className="analytics-graph-inner">
                {registrationData ? <Line data={registrationData} options={lineOptions} /> : <div className="chart-placeholder">Loading...</div>}
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>This tracks new student sign-ups over the selected {period} period, useful for spotting enrollment spikes.</p>
            </div>
          </div>
        </div>

        {/* ── Table section ── */}
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No Students Yet</h3>
            <p>Students will appear here once they register.</p>
          </div>
        ) : (
          <div className="table-section">
            <div className="table-section-header">
              <h2>Student Records</h2>
              <select
                className="course-filter-select"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td className="student-name">{student.firstName} {student.lastName}</td>
                      <td>{student.email}</td>
                      <td>{student.tuptId || "—"}</td>
                      <td>{student.course || "—"}</td>
                      <td>{student.section || "—"}</td>
                      <td>
                        {editingStudentId === student._id ? (
                          <select
                            autoFocus
                            className="status-inline-select"
                            value={student.status}
                            onChange={(e) => handleStatusChange(student._id, e.target.value)}
                            onBlur={() => setEditingStudentId(null)}
                          >
                            {STUDENT_STATUSES.map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`status-badge clickable ${student.status}`}
                            onClick={() => setEditingStudentId(student._id)}
                            title="Click to change status"
                          >
                            {student.status || "Pending"}
                          </span>
                        )}
                      </td>
                      <td>{student.orderCount || 0}</td>
                      <td>₱{(student.totalSpent || 0).toFixed(2)}</td>
                      <td>
                        <button className="action-btn delete" onClick={() => openDeleteModal(student)} title="Delete Student">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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