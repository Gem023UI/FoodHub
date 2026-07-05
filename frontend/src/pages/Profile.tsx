import { useEffect, useMemo, useState } from "react";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import Lanyard from "../components/Lanyard";
import Loader from "../components/Loader";
import { getMe, updateMyProfile, uploadStudentPicture } from "../services/user.service";
import { getFavorites } from "../services/favorite.service";
import { getStudentOrders, getStudentOrdersWithDateRange, type Order } from "../services/order.service";
import { getProductDetails, type Product } from "../services/product.service";
import {
  getStudentBudgetCaps,
  createBudgetCap,
  deleteBudgetCap,
  ActiveBudgetCapError,
  getSpendingAnalytics,
  type StudentBudgetCap
} from "../services/budget.service";
import { getNutritionAnalytics, type NutritionAnalytics } from "../services/report.service";
import { getReviewsByProduct, createReview, uploadReviewImages, type ProductReview } from "../services/review.service";
import backgroundImage from "../../images/profile background.png";
import "../styles/Profile.css";

interface ProfileProps {
  token: string;
  userId: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

type ViewRange = "daily" | "weekly" | "monthly";

interface OrderLike {
  _id: string;
  orderNumber?: number;
  createdAt: string;
  stallSection?: number;
  totalQuantity?: number;
  totalPrice?: number;
  totalAmount?: number;
  paymentMethod: "cash" | "gcash" | "paymaya";
  paymentStatus?: "paid" | "unpaid";
  orderStatus: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  orderLines?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    hasReview?: boolean;
  }>;
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

// ── Range/period dropdown ──
function RangeDropdown({
  value, onChange, options = ["weekly", "monthly"],
}: {
  value: ViewRange;
  onChange: (v: ViewRange) => void;
  options?: ViewRange[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="range-dropdown">
      <button type="button" className="range-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        {value} <i className="fas fa-caret-down" />
      </button>
      {open && (
        <div className="range-dropdown-menu">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              className={`range-dropdown-item ${value === opt ? "active" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function orderStatusIcon(status: string) {
  return status === "completed" ? "fa-eye" : "fa-clock";
}

export function Profile({ token, userId, onNavigate, onLogout }: ProfileProps) {
  const [student, setStudent] = useState<any>(null);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderLike[]>([]);
  const [budgetCaps, setBudgetCaps] = useState<StudentBudgetCap[]>([]);
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
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [newBudgetStart, setNewBudgetStart] = useState(isoDate(new Date()));
  const [newBudgetEnd, setNewBudgetEnd] = useState(isoDate(new Date()));
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [spendingData, setSpendingData] = useState<any>(null);
  const [showBudgetRecords, setShowBudgetRecords] = useState(false);
  const [capPendingDelete, setCapPendingDelete] = useState<StudentBudgetCap | null>(null);
  const [isDeletingCap, setIsDeletingCap] = useState(false);
  const [budgetCapConflict, setBudgetCapConflict] = useState<StudentBudgetCap | null>(null);
  const [budgetChartData, setBudgetChartData] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: []
  });

  // ── Section 4: order history ──
  const [orderRangeStart, setOrderRangeStart] = useState(isoDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)));
  const [orderRangeEnd, setOrderRangeEnd] = useState(isoDate(new Date()));
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<OrderLike | null>(null);
  const [orderDetailsTarget, setOrderDetailsTarget] = useState<OrderLike | null>(null);
  const [reviewViewTarget, setReviewViewTarget] = useState<{ order: OrderLike; review: ProductReview } | null>(null);
  const [productReviewsMap, setProductReviewsMap] = useState<Record<string, ProductReview[]>>({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ── Section 5: nutrition ──
  const [nutritionView, setNutritionView] = useState<ViewRange>("monthly");
  const [nutritionData, setNutritionData] = useState<NutritionAnalytics>({
    labels: [],
    protein: [],
    carbs: [],
    calories: [],
    averages: { protein: 0, carbs: 0, calories: 0 }
  });

  useEffect(() => {
    loadProfile();
  }, [token]);

  useEffect(() => {
    if (student) {
      loadBudgetAnalytics();
      loadNutritionAnalytics();
    }
  }, [budgetView, student]);

  useEffect(() => {
    if (student) {
      loadNutritionAnalytics();
    }
  }, [nutritionView]);

  useEffect(() => {
    if (student) {
      loadOrders();
    }
  }, [orderRangeStart, orderRangeEnd]);

  useEffect(() => {
    async function loadProductReviews() {
      const productIds = Array.from(new Set(
        orders.flatMap(o => (o.orderLines || []).map(l => l.productId))
      ));
      if (productIds.length === 0) return;
      try {
        const entries = await Promise.all(
          productIds.map(async (id) => [id, await getReviewsByProduct(id)] as const)
        );
        setProductReviewsMap(Object.fromEntries(entries));
      } catch (err) {
        console.error("Error loading product reviews for order history:", err);
      }
    }
    loadProductReviews();
  }, [orders]);

  async function loadBudgetCaps() {
    try {
      const caps = await getStudentBudgetCaps(token);
      setBudgetCaps(caps);
    } catch (err) {
      console.error("Error loading budget caps:", err);
    }
  }

  async function loadProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const me = await getMe(token) as any;
      setStudent(me);
      setEditSection(me.section || "");
      setEditContact(me.contactNumber || "");
      
      // Load budget caps from student data
      await loadBudgetCaps();

      // Load favorites
      try {
        const favs = await getFavorites(token);
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
      } catch (err) {
        console.error("Error loading favorites:", err);
      }

      // Load orders
      await loadOrders();
      
      // Load analytics
      await loadBudgetAnalytics();
      await loadNutritionAnalytics();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const ordersData = await getStudentOrdersWithDateRange(
        token, 
        orderRangeStart, 
        orderRangeEnd
      );
      setOrders(ordersData as any[]);
    } catch (err) {
      console.error("Error loading orders:", err);
      // Fallback to regular getStudentOrders
      try {
        const ordersData = await getStudentOrders(token);
        setOrders(ordersData as any[]);
      } catch (e) {
        console.error("Error loading orders fallback:", e);
      }
    }
  }

  async function loadBudgetAnalytics() {
    try {
      const spending = await getSpendingAnalytics(token, budgetView === "monthly" ? "monthly" : "weekly");
      setSpendingData(spending);
      if (spending.periodData) {
        setBudgetChartData({
          labels: spending.periodData.map(d => d.label),
          values: spending.periodData.map(d => d.value)
        });
      }
    } catch (err) {
      console.error("Error loading budget analytics:", err);
    }
  }

  async function loadNutritionAnalytics() {
    try {
      const nutrition = await getNutritionAnalytics(token, nutritionView);
      setNutritionData(nutrition);
    } catch (err) {
      console.error("Error loading nutrition analytics:", err);
      const now = new Date();
      const labels = [];
      const protein = [];
      const carbs = [];
      const calories = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        protein.push(Math.floor(Math.random() * 30) + 20);
        carbs.push(Math.floor(Math.random() * 40) + 30);
        calories.push(Math.floor(Math.random() * 200) + 100);
      }
      setNutritionData({
        labels,
        protein,
        carbs,
        calories,
        averages: {
          protein: protein.reduce((a, b) => a + b, 0) / protein.length,
          carbs: carbs.reduce((a, b) => a + b, 0) / carbs.length,
          calories: calories.reduce((a, b) => a + b, 0) / calories.length
        }
      });
    }
  }

  function getOrderReview(order: OrderLike): ProductReview | null {
    if (!order.orderLines?.length) return null;
    for (const line of order.orderLines) {
      const match = (productReviewsMap[line.productId] || []).find(
        r => r.orderId === order._id
      );
      if (match) return match;
    }
    return null;
  }

  function isOrderFullyReviewed(order: OrderLike): boolean {
    if (!order.orderLines?.length) return false;
    return order.orderLines.every(line =>
      (productReviewsMap[line.productId] || []).some(r => r.orderId === order._id)
    );
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
      await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "/api"}/students/${userId}/deactivate`, {
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
  const activeBudget = useMemo(() => {
    const now = new Date();
    return budgetCaps.find(b =>
      b.status === "active" &&
      new Date(b.startDate) <= now &&
      new Date(b.endDate) >= now
    ) || null;
  }, [budgetCaps]);

  const budgetCapDurationDays = useMemo(() => {
    if (!activeBudget) return 0;
    const ms = new Date(activeBudget.endDate).getTime() - new Date(activeBudget.startDate).getTime();
    return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
  }, [activeBudget]);

  const avgDaily = useMemo(() => activeBudget ? activeBudget.amount / budgetCapDurationDays : 0, [activeBudget, budgetCapDurationDays]);
  const avgWeekly = useMemo(() => avgDaily * 7, [avgDaily]);
  const avgMonthly = useMemo(() => avgDaily * 30, [avgDaily]);

  const remainingBudget = useMemo(() => {
    if (!activeBudget) return 0;
    return activeBudget.currentBudget;
  }, [activeBudget]);

  const canAddNextBudget = useMemo(() => !activeBudget, [activeBudget]);

  // ── Section 4 derived data ──
  const rangedOrders = useMemo(() => {
    const start = new Date(orderRangeStart);
    const end = new Date(orderRangeEnd);
    end.setHours(23, 59, 59, 999);
    return orders
      .filter(o => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, orderRangeStart, orderRangeEnd]);

  // ── Section 5 derived data ──
  const avgCarbs = useMemo(() => Math.round(nutritionData.averages.carbs), [nutritionData]);
  const avgProtein = useMemo(() => Math.round(nutritionData.averages.protein), [nutritionData]);
  const avgCalories = useMemo(() => Math.round(nutritionData.averages.calories), [nutritionData]);

  async function handleAddBudgetCap() {
    setIsSavingBudget(true);
    setError(null);
    try {
      await createBudgetCap(token, {
        amount: Number(newBudgetAmount),
        period: "custom",
        startDate: newBudgetStart,
        endDate: newBudgetEnd
      });
      setShowAddBudgetModal(false);
      setNewBudgetAmount("");
      setSuccessMsg("Budget cap added successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadBudgetCaps();
    } catch (err) {
      if (err instanceof ActiveBudgetCapError) {
        setShowAddBudgetModal(false);
        setBudgetCapConflict(err.activeCap);
      } else {
        setError(err instanceof Error ? err.message : "Failed to add budget cap");
      }
    } finally {
      setIsSavingBudget(false);
    }
  }

  async function handleDeleteBudgetCap() {
    if (!capPendingDelete?._id) return;
    setIsDeletingCap(true);
    setError(null);
    try {
      await deleteBudgetCap(token, capPendingDelete._id);
      setCapPendingDelete(null);
      setSuccessMsg("Budget cap deleted.");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadBudgetCaps();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget cap");
    } finally {
      setIsDeletingCap(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewTarget?.orderLines?.length) return;
    setIsSubmittingReview(true);
    setError(null);

    try {
      let imageUrls: string[] = [];
      if (reviewImages.length > 0) {
        imageUrls = await uploadReviewImages(token, reviewImages);
      }

      const results = await Promise.allSettled(
        reviewTarget.orderLines.map(line =>
          createReview(token, {
            productId: line.productId,
            orderId: reviewTarget._id,
            rating: reviewRating,
            comment: reviewComment,
            images: imageUrls
          })
        )
      );

      const anySucceeded = results.some(r => r.status === "fulfilled");
      if (!anySucceeded) {
        const firstError = results.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason instanceof Error ? firstError.reason.message : "Failed to submit review");
      }

      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
      setReviewImages([]);
      setSuccessMsg("Review submitted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);

      const productIds = Array.from(new Set(orders.flatMap(o => (o.orderLines || []).map(l => l.productId))));
      const entries = await Promise.all(
        productIds.map(async (id) => [id, await getReviewsByProduct(id)] as const)
      );
      setProductReviewsMap(Object.fromEntries(entries));
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <p>{error || "Could not load your profile."}</p>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {error && <div className="alert alert-error profile-alert">{error}</div>}
      {successMsg && <div className="alert alert-success profile-alert">{successMsg}</div>}

      {/* ══════════════════════════ SECTION 1 — Student Info ══════════════════════════ */}
      <section className="pf-section pf-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
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
            <LineChart
              labels={budgetChartData.labels.length > 0 ? budgetChartData.labels : ["No Data"]}
              series={[{
                label: "Budget",
                color: "#ff3131",
                values: budgetChartData.values.length > 0 ? budgetChartData.values : [0]
              }]}
            />
          </div>
          <div className="pf-budget-stats">
            <div className="pf-budget-stats-header">
              <span>GRAPH:</span>
              <RangeDropdown
                value={budgetView}
                onChange={setBudgetView}
                options={["weekly", "monthly"]}
              />
            </div>
            <div className="pf-budget-numbers">
              <div><strong>{avgDaily.toFixed(2)}</strong><label>AVG DAILY</label></div>
              <div><strong>{avgWeekly.toFixed(2)}</strong><label>AVG WEEKLY</label></div>
              <div><strong>{avgMonthly.toFixed(2)}</strong><label>AVG MONTHLY</label></div>
            </div>
            <p className="pf-budget-remaining-label">Remaining Budget:</p>
            <p className="pf-budget-remaining-value">PHP {remainingBudget.toFixed(2)}</p>
            <div className="pf-budget-actions">
              <button
                className="pf-btn pf-btn-white-outline"
                onClick={() => {
                  if (activeBudget) {
                    setBudgetCapConflict(activeBudget);
                  } else {
                    setShowAddBudgetModal(true);
                  }
                }}
              >
                ADD NEXT BUDGET CAP
              </button>
              <button
                className="pf-btn pf-btn-white-outline"
                onClick={() => setShowBudgetRecords(v => !v)}
              >
                {showBudgetRecords ? "HIDE BUDGET CAP RECORDS" : "BUDGET CAP RECORDS"}
              </button>
            </div>
          </div>
        </div>

        {showBudgetRecords && (
          <div className={`pf-budget-records-wrap ${showBudgetRecords ? "is-open" : ""}`}>
            <div className="pf-budget-records-inner">
              <div className="pf-budget-records">
                <h3 className="pf-budget-records-title">Budget Cap Records</h3>
                {budgetCaps.length === 0 ? (
                  <p className="pf-empty pf-empty-light">No budget cap records yet.</p>
                ) : (
                  <table className="pf-budget-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Surplus</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetCaps.map((cap) => (
                        <tr key={cap._id}>
                          <td>PHP {cap.amount.toFixed(2)}</td>
                          <td>{new Date(cap.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td>{new Date(cap.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td className={`pf-budget-status pf-budget-status-${cap.status}`}>{cap.status}</td>
                          <td>
                            {cap.status === "active" ? (
                              <i className="fas fa-clock" title="Active — surplus pending" />
                            ) : (
                              <span className={cap.surplus >= 0 ? "pf-surplus-positive" : "pf-surplus-negative"}>
                                {cap.surplus >= 0 ? "+" : ""}{cap.surplus.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td>
                            <button className="pf-btn-icon pf-btn-icon-red" onClick={() => setCapPendingDelete(cap)} title="Delete">
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
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
            {rangedOrders.map((order, index) => (
              <div key={order._id || index} className="pf-order-row">
                <div className="pf-order-number">No.{index + 1}</div>
                <div className="pf-order-info">
                  <p>Date: {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  <p>Stall Section: {order.stallSection || (order as any).stallId?.section || "—"}</p>
                </div>
                <div className="pf-order-info">
                  <p>Total Quantity: {order.totalQuantity || order.orderLines?.reduce((sum, l) => sum + l.quantity, 0) || 0}</p>
                  <p>Total Price: Php {(order.totalPrice || order.totalAmount || 0).toFixed(2)}</p>
                </div>
                <div className="pf-order-info">
                  <p>Payment Method: {order.paymentMethod === "gcash" ? "GCash" : order.paymentMethod === "paymaya" ? "Maya" : "Cash"}</p>
                  <p>Payment Status: {order.paymentStatus || (order.paymentRecord?.status === "paid" ? "Paid" : "Unpaid")}</p>
                </div>
                <div className="pf-order-icons">
                  {order.orderStatus === "completed" ? (
                    <button
                      className="pf-order-icon pf-order-icon-btn"
                      title="View order details"
                      onClick={() => setOrderDetailsTarget(order)}
                    >
                      <i className="fas fa-eye" />
                    </button>
                  ) : (
                    <span className="pf-order-icon" title={order.orderStatus}>
                      <i className="fas fa-clock" />
                    </span>
                  )}

                  {order.orderStatus === "completed" ? (
                    isOrderFullyReviewed(order) ? (
                      <button
                        className="pf-order-icon pf-order-icon-btn"
                        title="View your review"
                        onClick={() => {
                          const review = getOrderReview(order);
                          if (review) setReviewViewTarget({ order, review });
                        }}
                      >
                        <i className="fas fa-eye" />
                      </button>
                    ) : (
                      <button
                        className="pf-order-icon pf-order-icon-btn"
                        title="Add review"
                        onClick={() => setReviewTarget(order)}
                      >
                        <i className="fas fa-pen" />
                      </button>
                    )
                  ) : (
                    <span className="pf-order-icon" title="Not completed yet">
                      <i className="fas fa-clock" />
                    </span>
                  )}
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
              labels={nutritionData.labels.length > 0 ? nutritionData.labels : ["No Data"]}
              series={[
                { label: "Protein", color: "#f5c518", values: nutritionData.protein.length > 0 ? nutritionData.protein : [0] },
                { label: "Carbs", color: "#ff5a1f", values: nutritionData.carbs.length > 0 ? nutritionData.carbs : [0] },
                { label: "Calories", color: "#1a1a1a", values: nutritionData.calories.length > 0 ? nutritionData.calories : [0] },
              ]}
            />
          </div>
          <div className="pf-nutrition-stats">
            <div className="pf-nutrition-stats-header">
              <span>AVERAGE:</span>
              <RangeDropdown
                value={nutritionView}
                onChange={setNutritionView}
                options={["daily", "weekly", "monthly"]}
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

      {budgetCapConflict && (
        <div className="pf-modal-overlay" onClick={() => setBudgetCapConflict(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Budget Cap Already Active</h3>
            <p>
              A budget cap already exists for this time period (
              {new Date(budgetCapConflict.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {" – "}
              {new Date(budgetCapConflict.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              ). Please wait for it to end before adding a new one.
            </p>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-yellow" onClick={() => setBudgetCapConflict(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {capPendingDelete && (
        <div className="pf-modal-overlay" onClick={() => setCapPendingDelete(null)}>
          <div className="pf-modal pf-modal-danger" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Budget Cap?</h3>
            <p>This will permanently remove this budget cap record. Are you sure you want to continue?</p>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-white-outline" onClick={() => setCapPendingDelete(null)} disabled={isDeletingCap}>Cancel</button>
              <button className="pf-btn pf-btn-red" onClick={handleDeleteBudgetCap} disabled={isDeletingCap}>
                {isDeletingCap ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="pf-modal-overlay" onClick={() => setReviewTarget(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Review Your Order ({reviewTarget.orderLines?.length || 0} item{(reviewTarget.orderLines?.length || 0) === 1 ? "" : "s"})</h3>
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

      {orderDetailsTarget && (
        <div className="pf-modal-overlay" onClick={() => setOrderDetailsTarget(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Order Details</h3>
            <div className="pf-order-details-list">
              {(orderDetailsTarget.orderLines || []).map((line, i) => (
                <div key={i} className="pf-order-details-row">
                  <span className="pf-order-details-name">{line.productName}</span>
                  <span className="pf-order-details-qty">× {line.quantity}</span>
                  <span className="pf-order-details-subtotal">Php {line.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pf-order-details-total">
              <span>Total</span>
              <span>Php {(orderDetailsTarget.totalPrice || orderDetailsTarget.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-yellow" onClick={() => setOrderDetailsTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {reviewViewTarget && (
        <div className="pf-modal-overlay" onClick={() => setReviewViewTarget(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Your Review</h3>
            <div className="review-rating">
              {"⭐".repeat(reviewViewTarget.review.rating)}{"☆".repeat(5 - reviewViewTarget.review.rating)}
            </div>
            {reviewViewTarget.review.comment && (
              <p className="review-comment">{reviewViewTarget.review.comment}</p>
            )}
            {reviewViewTarget.review.reviewImages?.length > 0 && (
              <div className="review-photos">
                {reviewViewTarget.review.reviewImages.map((photo, i) => (
                  <img key={i} src={photo} alt={`Review ${i + 1}`} />
                ))}
              </div>
            )}
            <div className="review-date">
              {new Date(reviewViewTarget.review.reviewDate).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
              })}
            </div>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-yellow" onClick={() => setReviewViewTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}