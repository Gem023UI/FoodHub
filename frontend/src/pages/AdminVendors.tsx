import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import {
  fetchAdminStalls,
  createAdminVendor,
  updateVendorStatus,
  removeStallVendor,
  AdminStallItem,
  AdminStallVendor
} from "../services/admin.service";
import "../styles/AdminVendors.css";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
  '#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9',
  '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71'
];

const STATUS_COLORS: Record<string, string> = {
  verified: '#4ecdc4',
  unverified: '#ffde59',
  deactivated: '#ff3131',
  suspended: '#9b59b6',
};

const VENDOR_STATUSES = ["unverified", "verified", "deactivated", "suspended"];

interface AdminVendorsProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function AdminVendors({ token, onNavigate, onLogout }: AdminVendorsProps) {
  const [stalls, setStalls] = useState<AdminStallItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    position: "Cook" as "Cook" | "Manager" | "Financier",
    stallId: "",
  });

  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ stallId: string; vendor: AdminStallVendor } | null>(null);

  useEffect(() => {
    fetchStalls();
  }, [token]);

  async function fetchStalls() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminStalls(token);
      setStalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  }

  const allVendors = stalls.flatMap(s => (s.vendors || []).map(v => ({ ...v, stallId: s._id, stallName: s.name })));

  const vendorByStallData = {
    labels: stalls.filter(s => (s.vendors?.length || 0) > 0).map(s => s.name),
    datasets: [{
      data: stalls.filter(s => (s.vendors?.length || 0) > 0).map(s => s.vendors!.length),
      backgroundColor: CHART_COLORS,
      borderWidth: 2,
      borderColor: '#fff',
    }]
  };

  const statusCounts: Record<string, number> = {};
  for (const v of allVendors) {
    statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
  }
  const vendorStatusData = {
    labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: Object.keys(statusCounts).map(s => STATUS_COLORS[s] || '#999'),
      borderWidth: 2,
      borderColor: '#fff',
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 12, family: 'Poppins' }, usePointStyle: true } }
    },
    cutout: '60%',
  };

  const topVendorStall = stalls.length
    ? [...stalls].sort((a, b) => (b.vendors?.length || 0) - (a.vendors?.length || 0))[0]
    : null;
  const verifiedPct = allVendors.length
    ? Math.round(((statusCounts.verified || 0) / allVendors.length) * 100)
    : 0;

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!formData.stallId) {
      setError("Please select a stall.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminVendor(token, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        contactNumber: formData.contactNumber || undefined,
        position: formData.position,
        stallId: formData.stallId,
      });

      setSuccessMsg("Vendor account created successfully.");
      setFormData({ firstName: "", lastName: "", email: "", password: "", contactNumber: "", position: "Cook", stallId: "" });
      setShowAddModal(false);
      fetchStalls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(stallId: string, vendorId: string, status: string) {
    try {
      await updateVendorStatus(token, stallId, vendorId, status as any);
      setStalls(prev => prev.map(s =>
        s._id === stallId
          ? { ...s, vendors: s.vendors?.map(v => v._id === vendorId ? { ...v, status: status as any } : v) }
          : s
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor status");
    } finally {
      setEditingVendorId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await removeStallVendor(token, deleteTarget.stallId, deleteTarget.vendor._id);
      setStalls(prev => prev.map(s =>
        s._id === deleteTarget.stallId
          ? { ...s, vendors: s.vendors?.filter(v => v._id !== deleteTarget.vendor._id) }
          : s
      ));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="admin-vendors-page">
        <div className="admin-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="admin-vendors-page">
      <div className="admin-vendors-container">
        <div className="admin-vendors-header">
          <div className="header-left">
            <h1>Manage Vendors</h1>
            <p className="subtitle">{allVendors.length} vendors total</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Vendor
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* ── Vendor Analytics (white bg, graph-left/text-right, stacked) ── */}
        <div className="analytics-section-white">
          <h2>Vendor Analytics</h2>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Vendors per Stall</h3>
              <div className="analytics-graph-inner">
                <Pie data={vendorByStallData} options={pieOptions} />
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {topVendorStall
                  ? `${topVendorStall.name} has the largest vendor team (${topVendorStall.vendors?.length || 0}). Compare against smaller stalls to spot staffing imbalances.`
                  : "This shows how vendor staff are distributed across stalls."}
              </p>
            </div>
          </div>

          <div className="analytics-block">
            <div className="analytics-graph">
              <h3>Vendor Status Breakdown</h3>
              <div className="analytics-graph-inner">
                <Pie data={vendorStatusData} options={pieOptions} />
              </div>
            </div>
            <div className="analytics-text">
              <h4>What this tells you</h4>
              <p>
                {verifiedPct}% of vendors are verified and in good standing. Keep an eye on unverified,
                suspended, or deactivated accounts that may need follow-up.
              </p>
            </div>
          </div>
        </div>

        {/* ── Vendor Records, one table per stall ── */}
        <h2 className="records-label">Vendor Records</h2>
        {stalls.map(stall => (
          <div key={stall._id} className="stall-vendor-table-block">
            <h3 className="stall-table-title">{stall.name}</h3>
            {(!stall.vendors || stall.vendors.length === 0) ? (
              <div className="empty-state small">
                <p>No vendors assigned to this stall yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stall.vendors.map(vendor => (
                      <tr key={vendor._id}>
                        <td className="vendor-name">{vendor.firstName} {vendor.lastName}</td>
                        <td>{vendor.email}</td>
                        <td>{vendor.phoneNumber || "—"}</td>
                        <td>{vendor.position || "—"}</td>
                        <td>
                          {editingVendorId === vendor._id ? (
                            <select
                              autoFocus
                              className="status-inline-select"
                              value={vendor.status}
                              onChange={(e) => handleStatusChange(stall._id, vendor._id, e.target.value)}
                              onBlur={() => setEditingVendorId(null)}
                            >
                              {VENDOR_STATUSES.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`status-badge clickable ${vendor.status}`}
                              onClick={() => setEditingVendorId(vendor._id)}
                              title="Click to change status"
                            >
                              {vendor.status}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="action-btn delete"
                            onClick={() => { setDeleteTarget({ stallId: stall._id, vendor }); setShowDeleteModal(true); }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── ADD VENDOR MODAL ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Vendor</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddVendor}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First name</label>
                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last name</label>
                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} placeholder="Temporary password for the vendor" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact number</label>
                    <input type="tel" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value as typeof formData.position })}>
                      <option value="Cook">Cook</option>
                      <option value="Manager">Manager</option>
                      <option value="Financier">Financier</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Stall</label>
                  <select value={formData.stallId} onChange={(e) => setFormData({ ...formData, stallId: e.target.value })} required>
                    <option value="">Select stall…</option>
                    {stalls.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create Vendor Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Vendor</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="delete-icon">⚠️</div>
              <p>Are you sure you want to delete <strong>{deleteTarget.vendor.firstName} {deleteTarget.vendor.lastName}</strong>?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleConfirmDelete} disabled={isSubmitting}>
                {isSubmitting ? "Deleting…" : "Delete Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}