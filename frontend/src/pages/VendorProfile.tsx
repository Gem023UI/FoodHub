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
  proofOfLegitimacyUrl?: string;
  status: string;
  isActive: boolean;
  stallId?: {
    _id: string;
    name: string;
    location: string;
    photos: string[];
    openingHours: string;
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
  onProfileUpdate 
}: VendorProfileProps) {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      setProfile(data);
      setFormData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profilePictureUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  async function saveProfile() {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updateData: Record<string, unknown> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactNumber: formData.contactNumber,
        profilePictureUrl: formData.profilePictureUrl || null,
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to save profile");
      }

      const updated = await response.json();
      setProfile(updated);
      setFormData(updated);
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      
      if (onProfileUpdate) {
        onProfileUpdate(
          `${updated.firstName} ${updated.lastName}`, 
          updated.profilePictureUrl ?? null
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVerifyEmail() {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: profile?.email, 
          code: verificationCode.trim() 
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Verification failed");
      }

      setSuccessMsg("Email verified successfully!");
      setShowVerification(false);
      setVerificationCode("");
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendVerification() {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.email }),
      });

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to resend code");
      }

      setSuccessMsg("New verification code sent to your email!");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
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
  const stallName = typeof profile.stallId === "object" ? profile.stallId.name : profile.stallId || "No stall assigned";
  const stallLocation = typeof profile.stallId === "object" ? profile.stallId.location : "";

  return (
    <div className="vendor-profile-page">
      <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />

      <div className="vendor-profile-container">
        <div className="vendor-profile-header">
          <button className="btn-back" onClick={() => onNavigate("vendor-stall")}>
            ← Back to Stall
          </button>
          <h1>Vendor Profile</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <div className="vendor-profile-content">
          <div className="vendor-profile-card">
            <div className="vendor-profile-avatar-section">
              <div
                className="vendor-profile-avatar"
                style={{
                  backgroundImage: profile.profilePictureUrl
                    ? `url(${profile.profilePictureUrl})`
                    : "linear-gradient(135deg, #ff3131, #ff6b6b)",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                {!profile.profilePictureUrl && (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="vendor-role-badge">Vendor</div>
              {profile.status && (
                <div className={`vendor-status-badge ${profile.status === "verified" ? "active" : "inactive"}`}>
                  {profile.status}
                </div>
              )}
            </div>

            <div className="vendor-profile-info">
              {!isEditing ? (
                <>
                  <div className="info-field">
                    <label>Business Name</label>
                    <p>{stallName}</p>
                  </div>

                  <div className="info-field">
                    <label>Stall Location</label>
                    <p>{stallLocation || "Not set"}</p>
                  </div>

                  <div className="info-field">
                    <label>Vendor Name</label>
                    <p>{displayName}</p>
                  </div>

                  <div className="info-field">
                    <label>Email</label>
                    <p>{profile.email}</p>
                    {profile.status !== "verified" && (
                      <button 
                        className="verify-email-btn"
                        onClick={() => setShowVerification(true)}
                      >
                        Verify Email
                      </button>
                    )}
                  </div>

                  <div className="info-field">
                    <label>Contact Number</label>
                    <p>{profile.contactNumber || "Not set"}</p>
                  </div>

                  {profile.proofOfLegitimacyUrl && (
                    <div className="info-field">
                      <label>Proof of Legitimacy</label>
                      <a 
                        href={profile.proofOfLegitimacyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="proof-link"
                      >
                        <i className="fas fa-file-alt"></i> View Document
                      </a>
                    </div>
                  )}

                  {profile.createdAt && (
                    <div className="info-field">
                      <label>Member Since</label>
                      <p>{new Date(profile.createdAt).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                      })}</p>
                    </div>
                  )}

                  <button className="btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                </>
              ) : (
                <form className="vendor-profile-form" onSubmit={saveProfile}>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName || ""}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName || ""}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      placeholder="09XXXXXXXXX"
                      value={formData.contactNumber || ""}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUploadChange}
                      style={{ padding: "8px 0" }}
                    />
                    {formData.profilePictureUrl && (
                      <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
                        <img
                          src={formData.profilePictureUrl}
                          alt="Preview"
                          style={{ 
                            maxWidth: "120px", 
                            maxHeight: "120px", 
                            borderRadius: "50%", 
                            border: "1px solid #ddd", 
                            objectFit: "cover" 
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, profilePictureUrl: null })}
                          style={{
                            position: "absolute",
                            top: "-5px",
                            right: "-5px",
                            background: "#8B0000",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(profile);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      {showVerification && (
        <div className="modal-overlay" onClick={() => setShowVerification(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📧</div>
            <h3>Verify Your Email</h3>
            <p>A verification code has been sent to <strong>{profile.email}</strong></p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, ''))}
              maxLength={6}
              className="verification-input"
            />
            <div className="modal-actions">
              <button 
                className="modal-btn cancel" 
                onClick={() => setShowVerification(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm" 
                onClick={handleVerifyEmail}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
            <button 
              className="resend-link" 
              onClick={handleResendVerification}
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}