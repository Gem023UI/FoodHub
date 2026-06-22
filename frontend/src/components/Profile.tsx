import { useState, useEffect } from "react";

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: "user" | "vendor" | "admin";
  profilePictureUrl?: string | null;
  // Student fields
  studentId?: string | null;
  courseSection?: string | null;
  schoolEmail?: string | null;
  // Vendor fields
  contactNumber?: string | null;
  // Metadata
  createdAt?: string;
  status?: string;
}

interface ProfileProps {
  token: string;
  userId: string;
  role: string;
  onBack: () => void;
  onProfileUpdate?: (name: string, profilePicUrl: string | null) => void;
}

export function Profile({ token, userId, role, onBack, onProfileUpdate }: ProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      setProfile(data);
      setFormData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    }
  }

  async function saveProfile() {
    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name: formData.name
      };

      if (role === "user") {
        updateData.studentId = formData.studentId || null;
        updateData.courseSection = formData.courseSection || null;
        updateData.schoolEmail = formData.schoolEmail || null;
      } else if (role === "vendor") {
        updateData.email = formData.email;
        updateData.contactNumber = formData.contactNumber || null;
      }

      updateData.profilePictureUrl = formData.profilePictureUrl || null;

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error("Failed to save profile");
      const updated = await response.json();
      setProfile(updated);
      setFormData(updated);
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setError(null);
      // Notify parent to update header
      if (onProfileUpdate) {
        onProfileUpdate(updated.name, updated.profilePictureUrl ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  const getRoleBadgeColor = () => {
    switch (role) {
      case "admin":
        return "#FF6B6B";
      case "vendor":
        return "#4ECDC4";
      case "user":
        return "#45B7D1";
      default:
        return "#95A3A6";
    }
  };

  const getRoleBadgeText = () => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "vendor":
        return "Vendor";
      case "user":
        return "Student";
      default:
        return role;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>My Profile</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div
              className="profile-avatar"
              style={{
                backgroundImage: profile.profilePictureUrl
                  ? `url(${profile.profilePictureUrl})`
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              {!profile.profilePictureUrl && (
                <span>{profile.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="role-badge" style={{ backgroundColor: getRoleBadgeColor() }}>
              {getRoleBadgeText()}
            </div>
          </div>

          <div className="profile-info">
            {!isEditing ? (
              <>
                <div className="info-field">
                  <label>Name</label>
                  <p>{profile.name}</p>
                </div>

                <div className="info-field">
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>

                {role === "user" && (
                  <>
                    <div className="info-field">
                      <label>Student ID</label>
                      <p className={!profile.studentId ? "not-set" : ""}>{profile.studentId || "Not set"}</p>
                    </div>
                    <div className="info-field">
                      <label>Course & Section</label>
                      <p className={!profile.courseSection ? "not-set" : ""}>{profile.courseSection || "Not set"}</p>
                    </div>
                    <div className="info-field">
                      <label>School Email</label>
                      <p className={!profile.schoolEmail ? "not-set" : ""}>{profile.schoolEmail || "Not set"}</p>
                    </div>
                  </>
                )}

                {role === "vendor" && (
                  <div className="info-field">
                    <label>Contact Number</label>
                    <p className={!profile.contactNumber ? "not-set" : ""}>{profile.contactNumber || "Not set"}</p>
                  </div>
                )}

                {profile.status && (
                  <div className="info-field">
                    <label>Account Status</label>
                    <p><span className={`status-dot status-${profile.status.toLowerCase()}`}></span>{profile.status}</p>
                  </div>
                )}

                {profile.createdAt && (
                  <div className="info-field">
                    <label>Member Since</label>
                    <p>{new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                )}

                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              </>
            ) : (
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveProfile();
                }}
              >
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                {role === "user" && (
                  <>
                    <div className="form-group">
                      <label>Student ID</label>
                      <input
                        type="text"
                        value={formData.studentId || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, studentId: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Course & Section</label>
                      <input
                        type="text"
                        placeholder="e.g., BSCS-1A"
                        value={formData.courseSection || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, courseSection: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>School Email</label>
                      <input
                        type="email"
                        value={formData.schoolEmail || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, schoolEmail: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {role === "vendor" && (
                  <>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Contact Number</label>
                      <input
                        type="tel"
                        value={formData.contactNumber || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, contactNumber: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

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
                        style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "50%", border: "1px solid #ddd", objectFit: "cover" }}
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
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                  >
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
  );
}
