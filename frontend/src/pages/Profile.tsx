import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStudentOrders } from "../lib/api";
import "../styles/Profile.css";

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  role: "student" | "vendor" | "admin";
  profilePictureUrl?: string | null;
  // Student fields
  birthday?: string;
  tuptId?: string;
  course?: string;
  section?: string;
  contactNumber?: string;
  // Vendor fields
  stallId?: {
    _id: string;
    name: string;
    location: string;
  } | string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface ProfileProps {
  token: string;
  userId: string;
  role: string;
  onNavigate: (page: string) => void;
  onProfileUpdate?: (name: string, profilePicUrl: string | null) => void;
  onBack?: () => void;
}

export function Profile({ token, userId, role, onNavigate, onProfileUpdate, onBack }: ProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    if (role === "student") {
      loadOrders();
    }
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      // Handle both name formats
      if (!data.name && data.firstName && data.lastName) {
        data.name = `${data.firstName} ${data.lastName}`;
      }
      setProfile(data);
      setFormData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const orderData = await getStudentOrders(token);
      setOrders(orderData);
    } catch (err) {
      console.error("Failed to load orders:", err);
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
      };

      if (role === "student") {
        updateData.birthday = formData.birthday;
        updateData.tuptId = formData.tuptId;
        updateData.course = formData.course;
        updateData.section = formData.section;
        updateData.contactNumber = formData.contactNumber;
      } else if (role === "vendor") {
        updateData.contactNumber = formData.contactNumber;
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

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || "Failed to save profile");
      }

      const updated = await response.json();
      // Handle both name formats
      if (!updated.name && updated.firstName && updated.lastName) {
        updated.name = `${updated.firstName} ${updated.lastName}`;
      }
      setProfile(updated);
      setFormData(updated);
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      
      if (onProfileUpdate) {
        onProfileUpdate(updated.name || updated.firstName + " " + updated.lastName, updated.profilePictureUrl ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  // Calculate nutrition totals from orders
  const nutritionTotals = orders.reduce((totals, order) => {
    if (order.orderStatus === "Completed") {
      order.orderLines?.forEach((line: any) => {
        totals.calories += line.nutrition?.calories || 0;
        totals.protein += line.nutrition?.proteinGrams || 0;
        totals.carbs += line.nutrition?.carbsGrams || 0;
        totals.fat += line.nutrition?.fatGrams || 0;
      });
    }
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  if (isLoading) {
    return (
      <div className="profile-page">
        <Header onNavigate={onNavigate} token={token} />
        <div className="profile-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <Header onNavigate={onNavigate} token={token} />
        <div className="profile-error">
          <p>Profile not found.</p>
          <button onClick={() => onNavigate("home")}>Go Home</button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const displayName = profile.name || `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="profile-page">
      <Header onNavigate={onNavigate} token={token} />

      <div className="profile-container">
        <div className="profile-header">
          {onBack && (
            <button className="btn-back" onClick={onBack}>
              ← Back
            </button>
          )}
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
                    : "linear-gradient(135deg, #ff3131, #ff6b6b)",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                {!profile.profilePictureUrl && (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="role-badge" style={{ 
                backgroundColor: role === "admin" ? "#ff6b6b" : role === "vendor" ? "#4ecdc4" : "#ff3131" 
              }}>
                {role === "admin" ? "Administrator" : role === "vendor" ? "Vendor" : "Student"}
              </div>
              {profile.status && (
                <div className={`status-badge ${profile.status === "verified" || profile.status === "active" ? "active" : "inactive"}`}>
                  {profile.status}
                </div>
              )}
            </div>

            <div className="profile-info">
              {!isEditing ? (
                <>
                  <div className="info-field">
                    <label>Name</label>
                    <p>{displayName}</p>
                  </div>

                  <div className="info-field">
                    <label>Email</label>
                    <p>{profile.email}</p>
                  </div>

                  {role === "student" && (
                    <>
                      <div className="info-field">
                        <label>TUPT ID</label>
                        <p>{profile.tuptId || "Not set"}</p>
                      </div>
                      <div className="info-field">
                        <label>Course</label>
                        <p>{profile.course || "Not set"}</p>
                      </div>
                      <div className="info-field">
                        <label>Section</label>
                        <p>{profile.section || "Not set"}</p>
                      </div>
                      <div className="info-field">
                        <label>Birthday</label>
                        <p>{profile.birthday ? new Date(profile.birthday).toLocaleDateString() : "Not set"}</p>
                      </div>
                    </>
                  )}

                  <div className="info-field">
                    <label>Contact Number</label>
                    <p>{profile.contactNumber || "Not set"}</p>
                  </div>

                  {role === "vendor" && profile.stallId && (
                    <div className="info-field">
                      <label>Assigned Stall</label>
                      <p>{
                        typeof profile.stallId === "object" 
                          ? profile.stallId.name 
                          : profile.stallId
                      }</p>
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

                  {role === "student" && orders.length > 0 && (
                    <div className="nutrition-summary">
                      <h3>Nutrition Summary</h3>
                      <div className="nutrition-stats">
                        <div className="nutrition-stat">
                          <span className="stat-label">🔥 Calories</span>
                          <span className="stat-value">{Math.round(nutritionTotals.calories)}</span>
                        </div>
                        <div className="nutrition-stat">
                          <span className="stat-label">💪 Protein</span>
                          <span className="stat-value">{Math.round(nutritionTotals.protein)}g</span>
                        </div>
                        <div className="nutrition-stat">
                          <span className="stat-label">🍞 Carbs</span>
                          <span className="stat-value">{Math.round(nutritionTotals.carbs)}g</span>
                        </div>
                        <div className="nutrition-stat">
                          <span className="stat-label">🧈 Fat</span>
                          <span className="stat-value">{Math.round(nutritionTotals.fat)}g</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                </>
              ) : (
                <form className="profile-form" onSubmit={saveProfile}>
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

                  {role === "student" && (
                    <>
                      <div className="form-group">
                        <label>Birthday</label>
                        <input
                          type="date"
                          value={formData.birthday?.split('T')[0] || ""}
                          onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>TUPT ID</label>
                        <input
                          type="text"
                          placeholder="TUPT-XX-XXXX"
                          value={formData.tuptId || ""}
                          onChange={(e) => setFormData({ ...formData, tuptId: e.target.value })}
                          pattern="TUPT-\d{2}-\d{4}"
                        />
                      </div>

                      <div className="form-group">
                        <label>Course</label>
                        <input
                          type="text"
                          value={formData.course || ""}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Section</label>
                        <input
                          type="text"
                          value={formData.section || ""}
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        />
                      </div>
                    </>
                  )}

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

          {role === "student" && orders.length > 0 && (
            <div className="orders-summary">
              <h3>Recent Orders</h3>
              <div className="orders-list">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="order-item">
                    <div className="order-info">
                      <span className="order-stall">{order.stallId?.name || "Unknown Stall"}</span>
                      <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="order-details">
                      <span className="order-total">₱{order.totalAmount.toFixed(2)}</span>
                      <span className={`order-status ${order.orderStatus.toLowerCase()}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}