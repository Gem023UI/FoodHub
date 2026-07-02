import { useState, useEffect } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorInsights } from "../services/report.service";
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

  useEffect(() => {
    fetchVendors();
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

  if (isLoading) {
    return (
      <div className="admin-vendors-page">
        <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin-vendors" />
        <div className="admin-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="admin-vendors-page">
      <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="admin-vendors" />

      <div className="admin-vendors-container">
        <div className="admin-vendors-header">
          <div className="header-left">
            <h1>Manage Vendors</h1>
            <p className="subtitle">{vendors.length} vendors total</p>
          </div>
        </div>

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