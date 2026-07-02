import { useState, useEffect } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStalls, createStall, updateStall, deleteStall } from "../services/stall.service";
import "../styles/AdminStalls.css";

interface Stall {
  _id: string;
  stallName: string;
  stallDescription: string;
  stallPicture: string | null;
  section: number;
  status: boolean;
  vendors?: any[];
  products?: any[];
}

interface AdminStallsProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const SECTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function AdminStalls({ token, onNavigate, onLogout }: AdminStallsProps) {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  const [formData, setFormData] = useState<Partial<Stall>>({
    stallName: "",
    stallDescription: "",
    stallPicture: null,
    section: 1,
    status: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStalls();
  }, [token]);

  async function fetchStalls() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStalls();
      setStalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stalls");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddStall(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createStall(token, formData);
      setStalls(prev => [...prev, result.stall]);
      setShowAddModal(false);
      resetForm();
      setSuccessMsg("Stall added successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stall");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStall(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (!selectedStall) return;
      const result = await updateStall(token, selectedStall._id, formData);
      setStalls(prev => prev.map(s => s._id === selectedStall._id ? result.stall : s));
      setShowEditModal(false);
      resetForm();
      setSuccessMsg("Stall updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stall");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteStall() {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!selectedStall) return;
      await deleteStall(token, selectedStall._id);
      setStalls(prev => prev.filter(s => s._id !== selectedStall._id));
      setShowDeleteModal(false);
      setSelectedStall(null);
      setSuccessMsg("Stall deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stall");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      stallName: "",
      stallDescription: "",
      stallPicture: null,
      section: 1,
      status: true
    });
    setSelectedStall(null);
  }

  function openEditModal(stall: Stall) {
    setSelectedStall(stall);
    setFormData({
      stallName: stall.stallName,
      stallDescription: stall.stallDescription || "",
      stallPicture: stall.stallPicture,
      section: stall.section,
      status: stall.status
    });
    setShowEditModal(true);
  }

  function openDeleteModal(stall: Stall) {
    setSelectedStall(stall);
    setShowDeleteModal(true);
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  if (isLoading) {
    return (
      <div className="admin-stalls-page">
        <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin-stalls" />
        <div className="admin-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="admin-stalls-page">
      <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin-stalls" />

      <div className="admin-stalls-container">
        <div className="admin-stalls-header">
          <div className="header-left">
            <h1>Manage Stalls</h1>
            <p className="subtitle">{stalls.length} stalls total</p>
          </div>
          <button className="add-btn" onClick={openAddModal}>
            <i className="fas fa-plus"></i> Add Stall
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {stalls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No Stalls Yet</h3>
            <p>Start by adding your first stall.</p>
            <button className="btn-primary" onClick={openAddModal}>
              Add Stall
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Vendors</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stalls.map((stall) => (
                  <tr key={stall._id}>
                    <td className="stall-name">{stall.stallName}</td>
                    <td>Section {stall.section}</td>
                    <td>
                      <span className={`status-badge ${stall.status ? "active" : "inactive"}`}>
                        {stall.status ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td>{stall.vendors?.length || 0}</td>
                    <td>{stall.products?.length || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => openEditModal(stall)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="action-btn delete" onClick={() => openDeleteModal(stall)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Simplified for brevity */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showAddModal ? "Add New Stall" : "Edit Stall"}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>✕</button>
            </div>
            <form onSubmit={showAddModal ? handleAddStall : handleUpdateStall} className="admin-form">
              <div className="form-group">
                <label>Stall Name *</label>
                <input
                  type="text"
                  value={formData.stallName || ""}
                  onChange={(e) => setFormData({ ...formData, stallName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.stallDescription || ""}
                  onChange={(e) => setFormData({ ...formData, stallDescription: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Section *</label>
                  <select
                    value={formData.section || 1}
                    onChange={(e) => setFormData({ ...formData, section: Number(e.target.value) })}
                    required
                  >
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.status !== false}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    />
                    Open
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : showAddModal ? "Add Stall" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStall && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Stall</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="delete-confirmation">
              <div className="delete-icon">⚠️</div>
              <p>Are you sure you want to delete <strong>"{selectedStall.stallName}"</strong>?</p>
              <p className="delete-warning">This will also remove all associated products and vendors.</p>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-danger" onClick={handleDeleteStall} disabled={isSubmitting}>
                  {isSubmitting ? "Deleting..." : "Delete Stall"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}