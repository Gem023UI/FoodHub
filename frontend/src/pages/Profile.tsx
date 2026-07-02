import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import Lanyard from "../components/Lanyard";
import Loader from "../components/Loader";
import { getMe, updateMyProfile, uploadStudentPicture } from "../services/user.service";
import { getFavorites } from "../services/favorite.service";
import { getStudentOrders } from "../services/order.service";
import { getProductDetails, type Product } from "../services/product.service";
import "../styles/Profile.css";

interface ProfileProps {
  token: string;
  userId: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

// ── Local types that extend beyond what lib/api currently exposes ─────────
// These mirror the student/stall mongoose models. Wire these up to real
// endpoints later — for now the page renders against this shape.
type ViewRange = "weekly" | "monthly" | "custom";

interface BudgetCap {
  _id?: string;
  amount: number;
  period: "daily" | "weekly" | "monthly" | "custom";
  startDate: string;
  endDate: string;
  status: "accomplished" | "failed" | "active";
}

type OrderStatus = "pending" | "preparing" | "complete";

interface OrderItemLike {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  hasReview?: boolean;
}

interface OrderLike {
  _id: string;
  orderNumber: number;
  createdAt: string;
  stallSection: number;
  totalQuantity: number;
  totalPrice: number;
  paymentMethod: "cash" | "gcash" | "paymaya";
  paymentStatus: "paid" | "unpaid";
  orderStatus: OrderStatus;
  items: OrderItemLike[];
}

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${s} – ${e}`;
}

// ── Line chart used for both Budget (single series) and Nutrition (multi) ──
interface LineSeries {
  label: string;
  color: string;
  values: number[];
}

function LineChart({ labels, series, height = 220 }: { labels: string[]; series: LineSeries[]; height?: number }) {
  const width = 420;
  const padding = 28;
  const allValues = series.flatMap(s => s.values);
  const max = Math.max(...allValues, 1);
  const stepX = labels.length > 1 ? (width - padding * 2) / (labels.length - 1) : 0;

  const toPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (v / max) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg" preserveAspectRatio="xMinYMin meet">
      {/* horizontal gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line
          key={i}
          x1={padding}
          x2={width - padding}
          y1={height - padding - f * (height - padding * 2)}
          y2={height - padding - f * (height - padding * 2)}
          className="chart-gridline"
        />
      ))}
      {series.map((s) => (
        <g key={s.label}>
          <polyline points={toPoints(s.values)} fill="none" stroke={s.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {s.values.map((v, i) => {
            const x = padding + i * stepX;
            const y = height - padding - (v / max) * (height - padding * 2);
            return <circle key={i} cx={x} cy={y} r={4} fill={s.color} />;
          })}
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={l + i} x={padding + i * stepX} y={height - 6} textAnchor="middle" className="chart-axis-label">
          {l}
        </text>
      ))}
    </svg>
  );
}

// ── Range/period dropdown used in Section 3 and Section 5 headers ─────────
function RangeDropdown({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  value: ViewRange;
  onChange: (v: ViewRange) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="range-dropdown">
      <button type="button" className="range-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        {value === "custom" ? "custom range" : value} <i className="fas fa-caret-down" />
      </button>
      {open && (
        <div className="range-dropdown-menu">
          {(["weekly", "monthly", "custom"] as ViewRange[]).map(opt => (
            <button
              key={opt}
              type="button"
              className={`range-dropdown-item ${value === opt ? "active" : ""}`}
              onClick={() => {
                onChange(opt);
                if (opt !== "custom") setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
          {value === "custom" && (
            <div className="range-dropdown-custom">
              <input type="date" value={customStart} onChange={(e) => onCustomChange(e.target.value, customEnd)} />
              <span>to</span>
              <input type="date" value={customEnd} onChange={(e) => onCustomChange(customStart, e.target.value)} />
              <button type="button" className="btn-mini" onClick={() => setOpen(false)}>Apply</button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

function statusIcon(status: OrderStatus) {
  if (status === "pending") return "fa-clock";
  if (status === "preparing") return "fa-thumbs-up";
  return "fa-check";
}

export function Profile({ token, userId, onNavigate, onLogout }: ProfileProps) {
  const [student, setStudent] = useState<StudentMe | null>(null);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderLike[]>([]);
  const [budgetCaps, setBudgetCaps] = useState<BudgetCap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Section 1: edit / deactivate modals ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editSection, setEditSection] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editPictureFile, setEditPictureFile] = useState<File | null>(null);
  const [editPicturePreview, setEditPicturePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // ── Section 3: budget cap ──
  const [budgetView, setBudgetView] = useState<ViewRange>("weekly");
  const [budgetCustomStart, setBudgetCustomStart] = useState(isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [budgetCustomEnd, setBudgetCustomEnd] = useState(isoDate(new Date()));
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [newBudgetStart, setNewBudgetStart] = useState(isoDate(new Date()));
  const [newBudgetEnd, setNewBudgetEnd] = useState(isoDate(new Date()));
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // ── Section 4: order history ──
  const [orderRangeStart, setOrderRangeStart] = useState(isoDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)));
  const [orderRangeEnd, setOrderRangeEnd] = useState(isoDate(new Date()));
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ orderId: string; productId: string; productName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ── Section 5: nutrition ──
  const [nutritionView, setNutritionView] = useState<ViewRange>("monthly");
  const [nutritionCustomStart, setNutritionCustomStart] = useState(isoDate(new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)));
  const [nutritionCustomEnd, setNutritionCustomEnd] = useState(isoDate(new Date()));

  useEffect(() => {
    loadProfile();
  }, [token]);

  async function loadProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const [me, favs, ordersData] = await Promise.all([
        getMe(token) as Promise<StudentMe>,
        getFavorites(token),
        getStudentOrders(token),
      ]);
      setStudent(me);
      setEditSection(me.section || "");
      setEditContact(me.contactNumber || "");
      setBudgetCaps(((me as unknown as { budgetCap?: BudgetCap[] }).budgetCap) || []);

      const enrichedFavorites: Product[] = [];
      for (const fav of favs) {
        try {
          const product = await getProductDetails(fav.productId);
          enrichedFavorites.push(product);
        } catch (err) {
          console.error("Error fetching favorite product:", err);
        }
      }
      setFavorites(enrichedFavorites);
      setOrders((ordersData as unknown as OrderLike[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Section 1 handlers ──
  function handlePictureSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPictureFile(file);
    setEditPicturePreview(URL.createObjectURL(file));
  }

  async function handleSaveEdit() {
    if (!student) return;
    setIsSaving(true);
    setError(null);
    try {
      let profilePictureUrl = student.profilePictureUrl;
      if (editPictureFile) {
        const { url } = await uploadStudentPicture(token, editPictureFile);
        profilePictureUrl = url;
      }
      await updateMyProfile(token, userId, {
        contactNumber: editContact,
        section: editSection,
        profilePictureUrl,
      });
      setSuccessMsg("Profile updated!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setShowEditModal(false);
      setEditPictureFile(null);
      setEditPicturePreview(null);
      await loadProfile();
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
      // TODO: wire to real deactivate endpoint, e.g. PATCH /api/students/:id/deactivate
      await fetch(`/api/students/${userId}/deactivate`, {
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

  // ── Section 3 derived data ──
  const activeBudget = useMemo(() => budgetCaps.find(b => b.status === "active") || null, [budgetCaps]);
  const remainingBudget = 0; // TODO: compute amount - spent-in-period once order/expense linkage exists
  const canAddNextBudget = remainingBudget <= 0;

  const budgetChart = useMemo(() => {
    // TODO: derive from real spending history once available; placeholder progression
    const labels = ["Jan 2021", "Jul 2021", "Jan 2022", "Jul 2022", "Jan 2023", "Jul 2023", "Jan 2024", "Jul 2024", "Jan 2025"];
    const values = [8, 18, 18, 20, 21, 27, 33, 34, 36];
    return { labels, values };
  }, [budgetView, budgetCustomStart, budgetCustomEnd]);

  async function handleAddBudgetCap() {
    setIsSavingBudget(true);
    setError(null);
    try {
      const payload = { amount: Number(newBudgetAmount), period: "custom", startDate: newBudgetStart, endDate: newBudgetEnd };
      // TODO: POST to real budget cap endpoint, e.g. POST /api/students/:id/budget-cap
      await fetch(`/api/students/${userId}/budget-cap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setShowAddBudgetModal(false);
      setNewBudgetAmount("");
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add budget cap");
    } finally {
      setIsSavingBudget(false);
    }
  }

  // ── Section 4 derived data ──
  const rangedOrders = useMemo(() => {
    const start = new Date(orderRangeStart);
    const end = new Date(orderRangeEnd);
    end.setHours(23, 59, 59, 999);
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });
  }, [orders, orderRangeStart, orderRangeEnd]);

  async function handleSubmitReview() {
    if (!reviewTarget) return;
    setIsSubmittingReview(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewComment);
      reviewImages.slice(0, 5).forEach(img => formData.append("reviewImages", img));
      // TODO: wire to real review endpoint, e.g. POST /api/stalls/:stallId/products/:productId/reviews
      await fetch(`/api/orders/${reviewTarget.orderId}/products/${reviewTarget.productId}/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
      setReviewImages([]);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  // ── Section 5 derived data ──
  const nutritionChart = useMemo(() => {
    // TODO: derive from real order + product nutrition data once linkage exists
    const labels = ["Jan", "Feb", "Mar", "Apr", "May"];
    return {
      labels,
      protein: [12, 14, 16, 18, 24],
      carbs: [10, 12, 16, 17, 20],
      calories: [8, 9, 13, 15, 16],
    };
  }, [nutritionView, nutritionCustomStart, nutritionCustomEnd]);

  const avgCarbs = 240, avgProtein = 57, avgCalories = 980; // TODO: compute from nutritionChart data

  if (isLoading) {
    return (
      <div className="profile-page">
        <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="profile" />
        <div className="profile-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="profile-page">
        <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="profile" />
        <div className="profile-error">
          <p>{error || "Could not load your profile."}</p>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="profile" />

      {error && <div className="alert alert-error profile-alert">{error}</div>}
      {successMsg && <div className="alert alert-success profile-alert">{successMsg}</div>}

      {/* ══════════════════════════ SECTION 1 — Student Info ══════════════════════════ */}
      <section className="pf-section pf-hero">
        <div className="pf-hero-overlay" />
        <div className="pf-hero-content">
          <div className="pf-hero-text">
            <p className="pf-hero-welcome">Welcome,</p>
            <h1 className="pf-hero-name">{student.firstName} {student.lastName}</h1>
            <p className="pf-hero-meta">
              {student.course} - SECTION {student.section || "—"} &nbsp; TUPT - {student.tuptId || "—"}
            </p>
            <p className="pf-hero-email">{student.email}</p>
            <div className="pf-hero-actions">
              <button className="pf-btn pf-btn-yellow" onClick={() => setShowEditModal(true)}>EDIT PROFILE</button>
              <button className="pf-btn pf-btn-red" onClick={() => setShowDeactivateModal(true)}>DEACTIVATE</button>
            </div>
          </div>

          {/* Real 3D lanyard — profile picture is baked onto the card's front face. */}
          <div className="lanyard-wrap">
            <Lanyard
              frontImage={student.profilePictureUrl || null}
              imageFit="cover"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════ SECTION 2 — Favorites ══════════════════════════ */}
      <section className="pf-section pf-favorites">
        <h2 className="pf-favorites-title">My Favorites</h2>
        {favorites.length === 0 ? (
          <p className="pf-empty">You haven't favorited any products yet.</p>
        ) : (
          <div className="pf-favorites-scroll">
            {favorites.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                token={token}
                onClick={() => onNavigate(`product/${product._id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════ SECTION 3 — Budget Tracking ══════════════════════════ */}
      <section className="pf-section pf-budget">
        <h2 className="pf-section-title">Budget Cap and Expense Tracking</h2>
        <div className="pf-budget-grid">
          <div className="pf-budget-chart-card">
            <LineChart labels={budgetChart.labels} series={[{ label: "Budget", color: "#ff3131", values: budgetChart.values }]} />
          </div>
          <div className="pf-budget-stats">
            <div className="pf-budget-stats-header">
              <span>GRAPH:</span>
              <RangeDropdown
                value={budgetView}
                onChange={setBudgetView}
                customStart={budgetCustomStart}
                customEnd={budgetCustomEnd}
                onCustomChange={(s, e) => { setBudgetCustomStart(s); setBudgetCustomEnd(e); }}
              />
            </div>
            <div className="pf-budget-numbers">
              <div><strong>{activeBudget ? Math.round(activeBudget.amount) : 100}</strong><label>AVG DAILY</label></div>
              <div><strong>{activeBudget ? Math.round(activeBudget.amount * 5) : 500}</strong><label>AVG WEEKLY</label></div>
              <div><strong>2.2K</strong><label>AVG MONTHLY</label></div>
            </div>
            <p className="pf-budget-remaining-label">Remaining Budget:</p>
            <p className="pf-budget-remaining-value">PHP {remainingBudget.toFixed(2)}</p>
            <button
              className="pf-btn pf-btn-white-outline"
              disabled={!canAddNextBudget}
              onClick={() => setShowAddBudgetModal(true)}
              title={canAddNextBudget ? "" : "Available once your remaining budget hits Php 0.00"}
            >
              ADD NEXT BUDGET CAP
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ SECTION 4 — Order History ══════════════════════════ */}
      <section className="pf-section pf-orders">
        <div className="pf-orders-header">
          <h2 className="pf-section-title">Order History</h2>
          <button className="pf-date-pill" onClick={() => setShowOrderDatePicker(o => !o)}>
            {fmtRange(orderRangeStart, orderRangeEnd)} <i className="fas fa-caret-down" />
          </button>
          {showOrderDatePicker && (
            <div className="pf-date-pill-menu">
              <label>From <input type="date" value={orderRangeStart} onChange={e => setOrderRangeStart(e.target.value)} /></label>
              <label>To <input type="date" value={orderRangeEnd} onChange={e => setOrderRangeEnd(e.target.value)} /></label>
              <button className="btn-mini" onClick={() => setShowOrderDatePicker(false)}>Apply</button>
            </div>
          )}
        </div>

        {rangedOrders.length === 0 ? (
          <p className="pf-empty pf-empty-light">No orders in this date range.</p>
        ) : (
          <div className="pf-orders-list">
            {rangedOrders.map(order => (
              <div key={order._id} className="pf-order-row">
                <div className="pf-order-number">No.{order.orderNumber}</div>
                <div className="pf-order-info">
                  <p>Date: {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  <p>Stall Section: {order.stallSection}</p>
                </div>
                <div className="pf-order-info">
                  <p>Total Quantity: {order.totalQuantity}</p>
                  <p>Total Price: Php {order.totalPrice.toFixed(2)}</p>
                </div>
                <div className="pf-order-info">
                  <p>Payment Method: {order.paymentMethod === "gcash" ? "GCash" : order.paymentMethod === "paymaya" ? "Maya" : "Cash"}</p>
                  <p>Payment Status: {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}</p>
                </div>
                <div className="pf-order-icons">
                  <span className="pf-order-icon" title={order.orderStatus}>
                    <i className={`fas ${statusIcon(order.orderStatus)}`} />
                  </span>
                  <button
                    className="pf-order-icon pf-order-icon-btn"
                    title={order.items.every(i => i.hasReview) ? "Reviewed" : "Add review"}
                    onClick={() => {
                      const item = order.items[0];
                      if (item && !item.hasReview) {
                        setReviewTarget({ orderId: order._id, productId: item.productId, productName: item.productName });
                      }
                    }}
                  >
                    <i className={`fas ${order.items.every(i => i.hasReview) ? "fa-check" : "fa-pen"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════ SECTION 5 — Nutrition Consumption ══════════════════════════ */}
      <section className="pf-section pf-nutrition">
        <h2 className="pf-section-title">Macro Tracking and Consumption</h2>
        <div className="pf-nutrition-grid">
          <div className="pf-nutrition-chart-card">
            <div className="pf-nutrition-legend">
              <span><i className="pf-dot" style={{ background: "#f5c518" }} /> Protein</span>
              <span><i className="pf-dot" style={{ background: "#ff5a1f" }} /> Carbs</span>
              <span><i className="pf-dot" style={{ background: "#1a1a1a" }} /> Calories</span>
            </div>
            <LineChart
              labels={nutritionChart.labels}
              series={[
                { label: "Protein", color: "#f5c518", values: nutritionChart.protein },
                { label: "Carbs", color: "#ff5a1f", values: nutritionChart.carbs },
                { label: "Calories", color: "#1a1a1a", values: nutritionChart.calories },
              ]}
            />
          </div>
          <div className="pf-nutrition-stats">
            <div className="pf-nutrition-stats-header">
              <span>AVERAGE:</span>
              <RangeDropdown
                value={nutritionView}
                onChange={setNutritionView}
                customStart={nutritionCustomStart}
                customEnd={nutritionCustomEnd}
                onCustomChange={(s, e) => { setNutritionCustomStart(s); setNutritionCustomEnd(e); }}
              />
            </div>
            <div className="pf-nutrition-numbers">
              <div><strong>{avgCarbs}g</strong><label>CARBS</label></div>
              <div><strong>{avgProtein}g</strong><label>PROTEIN</label></div>
              <div><strong>{avgCalories}g</strong><label>CALORIES</label></div>
            </div>
            <p className="pf-nutrition-tip">
              TIP: To balance carbs, calories, and protein effectively, prioritize protein first — aim for 1.6–2.2g per kg of body
              weight to preserve muscle and boost satiety. Then, set calorie intake based on your goal (maintenance, loss, or
              gain), using a modest deficit or surplus of 300–500 calories. Fill remaining calories with carbs, adjusting to your
              activity level: more on high-intensity days, fewer on rest days. This macro-nutrient hierarchy ensures you hit
              essential targets without overcomplicating meals. Remember, quality matters — choose fiber-rich carbs and lean
              proteins — and monitor progress weekly, tweaking portions based on energy, performance, and body composition
              changes rather than rigid daily numbers.
            </p>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />

      {/* ══════════════════════════ MODALS ══════════════════════════ */}

      {showEditModal && (
        <div className="pf-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="pf-modal-avatar-row">
              <div className="pf-modal-avatar" style={(editPicturePreview || student.profilePictureUrl) ? {
                backgroundImage: `url(${editPicturePreview || student.profilePictureUrl})`, backgroundSize: "cover", backgroundPosition: "center"
              } : {}}>
                {!(editPicturePreview || student.profilePictureUrl) && <i className="fas fa-user" />}
              </div>
              <label className="pf-btn pf-btn-yellow-outline" style={{ cursor: "pointer" }}>
                Upload Photo
                <input type="file" accept="image/*" hidden onChange={handlePictureSelect} />
              </label>
            </div>
            <div className="form-group">
              <label>Section</label>
              <input type="text" value={editSection} onChange={(e) => setEditSection(e.target.value)} placeholder="e.g. 3-1" />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={editContact} onChange={(e) => setEditContact(e.target.value)} placeholder="09XXXXXXXXX" />
            </div>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-white-outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>Cancel</button>
              <button className="pf-btn pf-btn-yellow" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateModal && (
        <div className="pf-modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="pf-modal pf-modal-danger" onClick={(e) => e.stopPropagation()}>
            <h3>Deactivate Account?</h3>
            <p>This will deactivate your account and you won't be able to place orders until it's reactivated. Are you sure you want to continue?</p>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-white-outline" onClick={() => setShowDeactivateModal(false)} disabled={isDeactivating}>Cancel</button>
              <button className="pf-btn pf-btn-red" onClick={handleConfirmDeactivate} disabled={isDeactivating}>
                {isDeactivating ? "Deactivating…" : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddBudgetModal && (
        <div className="pf-modal-overlay" onClick={() => setShowAddBudgetModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Next Budget Cap</h3>
            <div className="form-group">
              <label>Amount (₱)</label>
              <input type="number" min="0" value={newBudgetAmount} onChange={(e) => setNewBudgetAmount(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={newBudgetStart} onChange={(e) => setNewBudgetStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={newBudgetEnd} onChange={(e) => setNewBudgetEnd(e.target.value)} />
            </div>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-white-outline" onClick={() => setShowAddBudgetModal(false)} disabled={isSavingBudget}>Cancel</button>
              <button className="pf-btn pf-btn-yellow" onClick={handleAddBudgetCap} disabled={isSavingBudget}>
                {isSavingBudget ? "Saving…" : "Add Budget Cap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="pf-modal-overlay" onClick={() => setReviewTarget(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Review {reviewTarget.productName}</h3>
            <div className="form-group">
              <label>Rating</label>
              <div className="pf-star-row">
                {[1, 2, 3, 4, 5].map(n => (
                  <i
                    key={n}
                    className={`fas fa-star ${n <= reviewRating ? "pf-star-active" : ""}`}
                    onClick={() => setReviewRating(n)}
                  />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} />
            </div>
            <div className="form-group">
              <label>Photos (up to 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setReviewImages(Array.from(e.target.files || []).slice(0, 5))}
              />
              {reviewImages.length > 0 && <p className="pf-hint">{reviewImages.length} photo(s) selected</p>}
            </div>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-white-outline" onClick={() => setReviewTarget(null)} disabled={isSubmittingReview}>Cancel</button>
              <button className="pf-btn pf-btn-yellow" onClick={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}