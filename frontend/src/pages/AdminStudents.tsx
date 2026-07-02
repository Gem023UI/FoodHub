import { useState, useEffect } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStudentInsights } from "../services/report.service";
import "../styles/AdminStudents.css";

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

export function AdminStudents({ token, onNavigate, onLogout }: AdminStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [token]);

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

  if (isLoading) {
    return (
      <div className="admin-students-page">
        <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin-students" />
        <div className="admin-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="admin-students-page">
      <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin-students" />

      <div className="admin-students-container">
        <div className="admin-students-header">
          <div className="header-left">
            <h1>Manage Students</h1>
            <p className="subtitle">{students.length} students total</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No Students Yet</h3>
            <p>Students will appear here once they register.</p>
          </div>
        ) : (
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
                      <span className={`status-badge ${student.status === "verified" ? "active" : "suspended"}`}>
                        {student.status || "Pending"}
                      </span>
                    </td>
                    <td>{student.orderCount || 0}</td>
                    <td>₱{(student.totalSpent || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}