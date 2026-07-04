import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorInsights } from "../services/report.service";
import { createAdminVendor, fetchAdminStalls, AdminStallItem } from "../services/admin.service";
import "../styles/AdminVendors.css";

interface Vendor {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  vendorImage: string | null;
  position: string;
  status: string;
  stallName: string;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminVendorsProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function AdminVendors({ token, onNavigate, onLogout }: AdminVendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [stalls, setStalls] = useState<AdminStallItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
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

  useEffect(() => {
    fetchVendors();
    fetchAdminStalls(token).then(setStalls).catch(() => {});
  }, [token]);  

  async function fetchVendors() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVendorInsights(token);
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  }

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
      setShowAddForm(false);
      fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="admin-vendors-page">
        <div className="admin-loading">
          <Loader />
        </div>
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
            <p className="subtitle">{vendors.length} vendors total</p>
          </div>
          <button className="auth-submit-btn" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? "Cancel" : "+ Add Vendor"}
          </button>
        </div>

        {showAddForm && (
          <form className="auth-form" onSubmit={handleAddVendor} style={{ marginBottom: 24 }}>
            <div className="auth-field-row">
              <div className="auth-field">
                <label>First name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Last name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Email address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                placeholder="Temporary password for the vendor"
              />
            </div>

            <div className="auth-field-row">
              <div className="auth-field">
                <label>Contact number</label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>
              <div className="auth-field">
                <label>Position</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as typeof formData.position })}
                >
                  <option value="Cook">Cook</option>
                  <option value="Manager">Manager</option>
                  <option value="Financier">Financier</option>
                </select>
              </div>
            </div>

            <div className="auth-field">
              <label>Stall</label>
              <select
                value={formData.stallId}
                onChange={(e) => setFormData({ ...formData, stallId: e.target.value })}
                required
              >
                <option value="">Select stall…</option>
                {stalls.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Vendor Account"}
            </button>
          </form>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {vendors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No Vendors Yet</h3>
            <p>Vendors will appear here once they register.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Stall</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.email}>
                    <td className="vendor-name">
                      {vendor.firstName} {vendor.lastName}
                    </td>
                    <td>{vendor.email}</td>
                    <td>{vendor.phoneNumber || "—"}</td>
                    <td>{vendor.stallName || "No stall"}</td>
                    <td>{vendor.position || "—"}</td>
                    <td>
                      <span className={`status-badge ${vendor.status === "verified" ? "active" : "suspended"}`}>
                        {vendor.status || "Pending"}
                      </span>
                    </td>
                    <td>{vendor.totalOrders || 0}</td>
                    <td>₱{(vendor.totalRevenue || 0).toFixed(2)}</td>
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