import { useState, useEffect } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import "../styles/AdminProfile.css";

interface AdminProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contactNumber?: string | null;
  status: string;
  createdAt: string;
}

interface AdminProfileProps {
  token: string;
  userId: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function AdminProfile({ token, userId, onNavigate, onLogout }: AdminProfileProps) {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Section 1: edit / deactivate modals ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editContact, setEditContact] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      setProfile(data);
      setEditContact(data.contactNumber || "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!profile) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admins/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactNumber: editContact }),
      });
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to save profile");
      }
      const updated = await response.json();
      setProfile(updated);
      setShowEditModal(false);
      setSuccessMsg("Profile updated!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDeactivate() {
    setIsDeactivating(true);
    setError(null);
    try {
      // TODO: wire to real deactivate endpoint, e.g. PATCH /api/admins/:id/deactivate
      await fetch(`/api/admins/${userId}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeactivateModal(false);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate account");
    } finally {
      setIsDeactivating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="admin-profile-page">
        <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
        <div className="admin-profile-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-profile-page">
        <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
        <div className="admin-profile-error">
          <p>Profile not found.</p>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const displayName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="admin-profile-page">
      <AdminHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />

      {error && <div className="alert alert-error ap-alert">{error}</div>}
      {successMsg && <div className="alert alert-success ap-alert">{successMsg}</div>}

      {/* ══════════════════════════ SECTION 1 — Admin Info (only section shown) ══════════════════════════ */}
      <section className="ap-hero">
        <div className="ap-hero-overlay" />
        <div className="ap-hero-content">
          <div className="ap-hero-text">
            <p className="ap-hero-welcome">Welcome,</p>
            <h1 className="ap-hero-name">{displayName}</h1>
            <p className="ap-hero-meta">Administrator &nbsp; {profile.contactNumber || "No contact number set"}</p>
            <p className="ap-hero-email">{profile.email}</p>
            <div className="ap-hero-actions">
              <button className="ap-btn ap-btn-yellow" onClick={() => setShowEditModal(true)}>EDIT PROFILE</button>
              <button className="ap-btn ap-btn-red" onClick={() => setShowDeactivateModal(true)}>DEACTIVATE</button>
            </div>
          </div>

          {/* Stylized 3D lanyard placeholder — swap for a real 3D model later */}
          <div className="ap-lanyard-wrap">
            <svg className="ap-lanyard-straps" viewBox="0 0 200 120" preserveAspectRatio="none">
              <path d="M60 0 L100 90 L140 0" fill="none" stroke="#f5c518" strokeWidth="14" strokeLinecap="round" />
            </svg>
            <div className="ap-lanyard-card">
              <div className="ap-lanyard-card-notch" />
              <div className="ap-lanyard-photo">
                <span>{displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="ap-lanyard-line ap-lanyard-line-name" />
              <div className="ap-lanyard-line" />
              <div className="ap-lanyard-line short" />
              {profile.status && (
                <div className={`ap-status-badge ${profile.status === "verified" ? "active" : "inactive"}`}>
                  {profile.status}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />

      {/* ══════════════════════════ MODALS ══════════════════════════ */}

      {showEditModal && (
        <div className="ap-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={editContact} onChange={(e) => setEditContact(e.target.value)} placeholder="09XXXXXXXXX" />
            </div>
            <div className="ap-modal-actions">
              <button className="ap-btn ap-btn-white-outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>Cancel</button>
              <button className="ap-btn ap-btn-yellow" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateModal && (
        <div className="ap-modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="ap-modal ap-modal-danger" onClick={(e) => e.stopPropagation()}>
            <h3>Deactivate Account?</h3>
            <p>This will deactivate your admin account and revoke your access to the admin dashboard. Are you sure you want to continue?</p>
            <div className="ap-modal-actions">
              <button className="ap-btn ap-btn-white-outline" onClick={() => setShowDeactivateModal(false)} disabled={isDeactivating}>Cancel</button>
              <button className="ap-btn ap-btn-red" onClick={handleConfirmDeactivate} disabled={isDeactivating}>
                {isDeactivating ? "Deactivating…" : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}