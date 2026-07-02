import { useState, useEffect } from "react";
import { VendorHeader } from "../components/VendorHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import "../styles/VendorProfile.css";

interface VendorProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePictureUrl?: string | null;
  contactNumber?: string;
  position?: "Cook" | "Manager" | "Financier";
  status: string;
  stallId?: {
    _id: string;
    stallName: string;
    section: number;
  } | string;
  createdAt: string;
}

interface VendorProfileProps {
  token: string;
  userId: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onProfileUpdate?: (name: string, profilePicUrl: string | null) => void;
}

export function VendorProfile({
  token,
  userId,
  onNavigate,
  onLogout,
  onProfileUpdate,
}: VendorProfileProps) {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Section 1: edit / deactivate modals ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editContact, setEditContact] = useState("");
  const [editPictureFile, setEditPictureFile] = useState<File | null>(null);
  const [editPicturePreview, setEditPicturePreview] = useState<string | null>(null);
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

  function handlePictureSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }
    setEditPictureFile(file);
    setEditPicturePreview(URL.createObjectURL(file));
  }

  async function handleSaveEdit() {
    if (!profile) return;
    setIsSaving(true);
    setError(null);
    try {
      // TODO: swap for a real vendor picture-upload endpoint once available
      let profilePictureUrl = profile.profilePictureUrl ?? null;
      if (editPictureFile) {
        const formData = new FormData();
        formData.append("picture", editPictureFile);
        const uploadRes = await fetch(`/api/vendors/${userId}/picture`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploaded = await uploadRes.json();
          profilePictureUrl = uploaded.url ?? profilePictureUrl;
        }
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactNumber: editContact, profilePictureUrl }),
      });
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to save profile");
      }
      const updated = await response.json();
      setProfile(updated);
      setShowEditModal(false);
      setEditPictureFile(null);
      setEditPicturePreview(null);
      setSuccessMsg("Profile updated!");
      setTimeout(() => setSuccessMsg(null), 3000);

      if (onProfileUpdate) {
        onProfileUpdate(`${updated.firstName} ${updated.lastName}`, updated.profilePictureUrl ?? null);
      }
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
      // TODO: wire to real deactivate endpoint, e.g. PATCH /api/vendors/:id/deactivate
      await fetch(`/api/vendors/${userId}/deactivate`, {
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
      <div className="vendor-profile-page">
        <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
        <div className="vendor-profile-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="vendor-profile-page">
        <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
        <div className="vendor-profile-error">
          <p>Profile not found.</p>
          <button onClick={() => onNavigate("vendor-stall")}>Go Back</button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const displayName = `${profile.firstName} ${profile.lastName}`;
  const stallName = typeof profile.stallId === "object" ? profile.stallId.stallName : "No stall assigned";
  const stallSection = typeof profile.stallId === "object" ? profile.stallId.section : null;

  return (
    <div className="vendor-profile-page">
      <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />

      {error && <div className="alert alert-error vp-alert">{error}</div>}
      {successMsg && <div className="alert alert-success vp-alert">{successMsg}</div>}

      {/* ══════════════════════════ SECTION 1 — Vendor Info (only section shown) ══════════════════════════ */}
      <section className="vp-hero">
        <div className="vp-hero-overlay" />
        <div className="vp-hero-content">
          <div className="vp-hero-text">
            <p className="vp-hero-welcome">Welcome,</p>
            <h1 className="vp-hero-name">{displayName}</h1>
            <p className="vp-hero-meta">
              {stallName}{stallSection ? ` — Section ${stallSection}` : ""} &nbsp; {profile.position || "Vendor"}
            </p>
            <p className="vp-hero-email">{profile.email}</p>
            <div className="vp-hero-actions">
              <button className="vp-btn vp-btn-yellow" onClick={() => setShowEditModal(true)}>EDIT PROFILE</button>
              <button className="vp-btn vp-btn-red" onClick={() => setShowDeactivateModal(true)}>DEACTIVATE</button>
            </div>
          </div>

          {/* Stylized 3D lanyard placeholder — swap for a real 3D model later */}
          <div className="vp-lanyard-wrap">
            <svg className="vp-lanyard-straps" viewBox="0 0 200 120" preserveAspectRatio="none">
              <path d="M60 0 L100 90 L140 0" fill="none" stroke="#f5c518" strokeWidth="14" strokeLinecap="round" />
            </svg>
            <div className="vp-lanyard-card">
              <div className="vp-lanyard-card-notch" />
              <div
                className="vp-lanyard-photo"
                style={profile.profilePictureUrl ? {
                  backgroundImage: `url(${profile.profilePictureUrl})`, backgroundSize: "cover", backgroundPosition: "center"
                } : {}}
              >
                {!profile.profilePictureUrl && <span>{displayName.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="vp-lanyard-line vp-lanyard-line-name" />
              <div className="vp-lanyard-line" />
              <div className="vp-lanyard-line short" />
              {profile.status && (
                <div className={`vp-status-badge ${profile.status === "verified" ? "active" : "inactive"}`}>
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
        <div className="vp-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="vp-modal-avatar-row">
              <div
                className="vp-modal-avatar"
                style={(editPicturePreview || profile.profilePictureUrl) ? {
                  backgroundImage: `url(${editPicturePreview || profile.profilePictureUrl})`, backgroundSize: "cover", backgroundPosition: "center"
                } : {}}
              >
                {!(editPicturePreview || profile.profilePictureUrl) && displayName.charAt(0).toUpperCase()}
              </div>
              <label className="vp-btn vp-btn-yellow-outline" style={{ cursor: "pointer" }}>
                Upload Photo
                <input type="file" accept="image/*" hidden onChange={handlePictureSelect} />
              </label>
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={editContact} onChange={(e) => setEditContact(e.target.value)} placeholder="09XXXXXXXXX" />
            </div>
            <div className="vp-modal-actions">
              <button className="vp-btn vp-btn-white-outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>Cancel</button>
              <button className="vp-btn vp-btn-yellow" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateModal && (
        <div className="vp-modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="vp-modal vp-modal-danger" onClick={(e) => e.stopPropagation()}>
            <h3>Deactivate Account?</h3>
            <p>This will deactivate your vendor account and hide your stall from students. Are you sure you want to continue?</p>
            <div className="vp-modal-actions">
              <button className="vp-btn vp-btn-white-outline" onClick={() => setShowDeactivateModal(false)} disabled={isDeactivating}>Cancel</button>
              <button className="vp-btn vp-btn-red" onClick={handleConfirmDeactivate} disabled={isDeactivating}>
                {isDeactivating ? "Deactivating…" : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}