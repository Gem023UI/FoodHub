import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Lanyard from "../components/Lanyard";
import Loader from "../components/Loader";
import bgImage from "../../images/profile background.png";
import "../styles/AdminProfile.css";

interface AdminProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePictureUrl?: string | null;
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

// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export function AdminProfile({ token, userId, onNavigate, onLogout }: AdminProfileProps) {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Section 1: edit / deactivate modals ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
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
      const response = await fetch(`${apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      console.log("📋 Loaded profile data:", data);
      setProfile(data);
      setEditFirstName(data.firstName || "");
      setEditLastName(data.lastName || "");
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
      let profilePictureUrl = profile.profilePictureUrl || null;
      
      // Upload picture if a new one is selected
      if (editPictureFile) {
        const formData = new FormData();
        formData.append("profile", editPictureFile);
        
        console.log("📤 Uploading admin profile picture to:", `${apiBaseUrl}/users/profile/admin`);
        
        const uploadRes = await fetch(`${apiBaseUrl}/users/profile/admin`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        
        console.log("📤 Upload response status:", uploadRes.status);
        
        if (uploadRes.ok) {
          const uploaded = await uploadRes.json();
          profilePictureUrl = uploaded.url;
          console.log("📸 Uploaded new profile picture:", profilePictureUrl);
        } else {
          const errorData = await uploadRes.json();
          console.error("❌ Upload failed:", errorData);
          throw new Error(errorData.message || "Failed to upload picture");
        }
      }

      const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          firstName: editFirstName,
          lastName: editLastName,
          contactNumber: editContact,
          profilePictureUrl: profilePictureUrl 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to save profile");
      }
      
      const updated = await response.json();
      console.log("✅ Profile updated:", updated);
      
      setProfile(updated);
      setShowEditModal(false);
      setEditPictureFile(null);
      setEditPicturePreview(null);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDeactivate() {
    setIsDeactivating(true);
    setError(null);
    try {
      await fetch(`${apiBaseUrl}/admins/${userId}/deactivate`, {
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
      {error && <div className="alert alert-error ap-alert">{error}</div>}
      {successMsg && <div className="alert alert-success ap-alert">{successMsg}</div>}

      <section className="ap-hero" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="ap-hero-overlay" />
        <div className="ap-hero-content">
          <div className="ap-hero-text">
            <p className="ap-hero-welcome">Welcome,</p>
            <h1 className="ap-hero-name">{displayName}</h1>
            <p className="ap-hero-meta">
              Administrator &nbsp; {profile.contactNumber || "No contact number set"}
            </p>
            <p className="ap-hero-email">{profile.email}</p>
            <div className="ap-hero-actions">
              <button className="ap-btn ap-btn-yellow" onClick={() => setShowEditModal(true)}>EDIT PROFILE</button>
              <button className="ap-btn ap-btn-red" onClick={() => setShowDeactivateModal(true)}>DEACTIVATE</button>
            </div>
          </div>

          <div className="ap-lanyard-wrap">
            <Lanyard
              key={profile.profilePictureUrl || "default"}
              frontImage={profile.profilePictureUrl || null}
              imageFit="cover"
            />
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />

      {showEditModal && (
        <div className="ap-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="ap-modal-avatar-row">
              <div 
                className="ap-modal-avatar" 
                style={(editPicturePreview || profile.profilePictureUrl) ? {
                  backgroundImage: `url(${editPicturePreview || profile.profilePictureUrl})`, 
                  backgroundSize: "cover", 
                  backgroundPosition: "center"
                } : {}}
              >
                {!(editPicturePreview || profile.profilePictureUrl) && <i className="fas fa-user" />}
              </div>
              <label className="ap-btn ap-btn-yellow-outline" style={{ cursor: "pointer" }}>
                Upload Photo
                <input type="file" accept="image/*" hidden onChange={handlePictureSelect} />
              </label>
            </div>
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                value={editFirstName} 
                onChange={(e) => setEditFirstName(e.target.value)} 
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                value={editLastName} 
                onChange={(e) => setEditLastName(e.target.value)} 
                placeholder="Enter last name"
              />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input 
                type="text" 
                value={editContact} 
                onChange={(e) => setEditContact(e.target.value)} 
                placeholder="09XXXXXXXXX"
              />
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