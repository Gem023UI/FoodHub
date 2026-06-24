import { useEffect, useState, useMemo } from "react";
import {
  type AdminStallItem,
  type AdminMenuItem,
  type AdminCategoryItem,
  createAdminMenuItem,
  createAdminStall,
  deleteAdminStall,
  fetchVendorStalls,
  updateAdminMenuItem,
  updateAdminStall,
  fetchAdminCategories,
  fetchAdminMenuItemsAll,
  deleteAdminMenuItem,
  generateNutritionInfo
} from "../lib/adminApi";
import { fetchVendorOrders, updateOrderStatusAPI, type OrderSummary, submitReport } from "../lib/api";

interface VendorDashboardProps {
  token: string;
}

const emptyStall = {
  name: "",
  location: "",
  category: "general",
  description: "",
  section: "",
  openingHours: "",
  photoUrl: "",
  isActive: true,
  status: "pending" as "pending" | "approved" | "rejected"
};

const emptyMenuItem = {
  name: "",
  description: "",
  price: 0,
  category: "general",
  ingredients: "",
  allergens: "",
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  sodiumMilligrams: 0,
  isAvailable: true,
  isFeatured: false,
  stallId: "",
  photoUrl: ""
};

export function VendorDashboard({ token }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"stalls" | "products" | "orders">("stalls");
  
  // Data States
  const [stalls, setStalls] = useState<AdminStallItem[]>([]);
  const [products, setProducts] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");

  // Search/Filter/Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [stallCategoryFilter, setStallCategoryFilter] = useState("all");
  const [stallStatusFilter, setStallStatusFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStallFilter, setProductStallFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [activeModal, setActiveModal] = useState<"none" | "stall_create" | "stall_edit" | "product_create" | "product_edit" | "student_report">("none");
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Student Report States
  const [reportStudentId, setReportStudentId] = useState("");
  const [reportStudentName, setReportStudentName] = useState("");
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // Form States
  const [stallForm, setStallForm] = useState(() => ({ ...emptyStall }));
  const [menuItemForm, setMenuItemForm] = useState(() => ({ ...emptyMenuItem }));

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: "stall" | "product";
    id: string;
    name: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);

  const handleAutofillNutrition = async () => {
    if (!menuItemForm.name) {
      setError("Please input the Product Name first.");
      return;
    }
    setIsAutofilling(true);
    setError(null);
    try {
      const data = await generateNutritionInfo(token, menuItemForm.name, menuItemForm.category, menuItemForm.description);
      setMenuItemForm(prev => ({
        ...prev,
        description: data.description,
        ingredients: data.ingredients.join(", "),
        allergens: data.allergens.join(", "),
        calories: data.nutrition.calories,
        proteinGrams: data.nutrition.proteinGrams,
        carbsGrams: data.nutrition.carbsGrams,
        fatGrams: data.nutrition.fatGrams,
        sodiumMilligrams: data.nutrition.sodiumMilligrams
      }));
      showSuccess("Food details and description autofilled successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to autofill food details.");
    } finally {
      setIsAutofilling(false);
    }
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMenuItemForm(prev => ({
        ...prev,
        photoUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleStallPhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setStallForm(prev => ({
        ...prev,
        photoUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  async function loadData() {
    try {
      const [stallData, productData, categoryData, orderData] = await Promise.all([
        fetchVendorStalls(token),
        fetchAdminMenuItemsAll(token), // Fetches all, backend will filter vendor's items automatically
        fetchAdminCategories(token),
        fetchVendorOrders(token)
      ]);
      setStalls(stallData);
      setProducts(productData);
      setCategories(categoryData);
      setOrders(orderData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor dashboard data.");
    }
  }

  useEffect(() => {
    void loadData();
  }, [token]);

  // Reset pagination and search when activeTab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- Stalls Actions ---
  const handleCreateStall = async () => {
    setIsSaving(true);
    try {
      const result = await createAdminStall(token, { ...stallForm, status: "pending" });
      setStalls((prev) => [result.stall, ...prev]);
      setActiveModal("none");
      setStallForm({ ...emptyStall });
      showSuccess("Stall request submitted successfully for approval");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create stall.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStall = async () => {
    if (!selectedStallId) return;
    setIsSaving(true);
    try {
      const result = await updateAdminStall(token, selectedStallId, stallForm);
      setStalls((prev) => prev.map((s) => (s._id === selectedStallId ? result.stall : s)));
      setActiveModal("none");
      setSelectedStallId(null);
      setStallForm({ ...emptyStall });
      showSuccess("Stall updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stall.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Products (MenuItems) Actions ---
  const handleCreateProduct = async () => {
    if (!menuItemForm.stallId) {
      setError("Please select a stall for this product.");
      return;
    }
    setIsSaving(true);
    try {
      const submission = {
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: Number(menuItemForm.price),
        category: menuItemForm.category,
        ingredients: menuItemForm.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
        allergens: menuItemForm.allergens.split(",").map((i) => i.trim()).filter(Boolean),
        nutrition: {
          calories: Number(menuItemForm.calories) || 0,
          proteinGrams: Number(menuItemForm.proteinGrams) || 0,
          carbsGrams: Number(menuItemForm.carbsGrams) || 0,
          fatGrams: Number(menuItemForm.fatGrams) || 0,
          sodiumMilligrams: Number(menuItemForm.sodiumMilligrams) || 0
        },
        isAvailable: menuItemForm.isAvailable,
        isFeatured: menuItemForm.isFeatured,
        photoUrl: menuItemForm.photoUrl || null
      };

      await createAdminMenuItem(token, menuItemForm.stallId, submission);
      setActiveModal("none");
      setMenuItemForm({ ...emptyMenuItem });
      showSuccess("Product created successfully");
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProductId) return;
    setIsSaving(true);
    try {
      const submission = {
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: Number(menuItemForm.price),
        category: menuItemForm.category,
        ingredients: menuItemForm.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
        allergens: menuItemForm.allergens.split(",").map((i) => i.trim()).filter(Boolean),
        nutrition: {
          calories: Number(menuItemForm.calories) || 0,
          proteinGrams: Number(menuItemForm.proteinGrams) || 0,
          carbsGrams: Number(menuItemForm.carbsGrams) || 0,
          fatGrams: Number(menuItemForm.fatGrams) || 0,
          sodiumMilligrams: Number(menuItemForm.sodiumMilligrams) || 0
        },
        isAvailable: menuItemForm.isAvailable,
        isFeatured: menuItemForm.isFeatured,
        photoUrl: menuItemForm.photoUrl || null
      };

      await updateAdminMenuItem(token, selectedProductId, submission);
      setActiveModal("none");
      setSelectedProductId(null);
      setMenuItemForm({ ...emptyMenuItem });
      showSuccess("Product updated successfully");
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled") => {
    try {
      setError(null);
      const res = await updateOrderStatusAPI(token, orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? res.order : o));
      showSuccess("Order status updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status.");
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: "Unpaid" | "Paid") => {
    try {
      setError(null);
      const res = await updateOrderStatusAPI(token, orderId, { paymentStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? res.order : o));
      showSuccess("Payment status updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment status.");
    }
  };

  const handleOpenReportModal = (studentId: string, studentName: string, orderId: string) => {
    setReportStudentId(studentId);
    setReportStudentName(studentName);
    setReportOrderId(orderId);
    setReportReason("");
    setReportDescription("");
    setError(null);
    setSuccessMsg(null);
    setActiveModal("student_report");
  };

  const handleCreateReport = async () => {
    if (!reportReason || !reportDescription) {
      setError("Please select a reason and fill out the details.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await submitReport(token, {
        reportedUserId: reportStudentId,
        orderId: reportOrderId,
        reason: reportReason,
        description: reportDescription
      });
      showSuccess(`Report against ${reportStudentName} has been submitted successfully.`);
      setActiveModal("none");
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Actions ---
  const triggerDeleteConfirm = (type: "stall" | "product", id: string, name: string) => {
    setConfirmDelete({ isOpen: true, type, id, name });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsSaving(true);
    const { type, id } = confirmDelete;
    try {
      if (type === "stall") {
        await deleteAdminStall(token, id);
        setStalls((prev) => prev.filter((s) => s._id !== id));
        showSuccess("Stall deleted successfully");
      } else if (type === "product") {
        await deleteAdminMenuItem(token, id);
        setProducts((prev) => prev.filter((p) => p._id !== id));
        showSuccess("Product deleted successfully");
      }
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Search/Filter Logic ---
  const filteredStalls = useMemo(() => {
    return stalls.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.section.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = stallCategoryFilter === "all" || s.category === stallCategoryFilter;
      const status = s.status || (s.isActive ? "approved" : "rejected");
      const matchesStatus = stallStatusFilter === "all" || status === stallStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stalls, searchTerm, stallCategoryFilter, stallStatusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
      
      const stallIdStr = typeof p.stallId === "object" && p.stallId ? p.stallId._id : p.stallId;
      const matchesStall = productStallFilter === "all" || stallIdStr === productStallFilter;

      return matchesSearch && matchesCategory && matchesStall;
    });
  }, [products, searchTerm, productCategoryFilter, productStallFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const studentName = typeof o.userId === "object" && o.userId ? o.userId.name : "";
      const studentId = typeof o.userId === "object" && o.userId ? (o.userId.studentId || "") : "";
      const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
      const matchesPayment = orderPaymentFilter === "all" || o.paymentStatus === orderPaymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, orderStatusFilter, orderPaymentFilter]);

  // --- Pagination Slice ---
  const currentStalls = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStalls.slice(start, start + itemsPerPage);
  }, [filteredStalls, currentPage]);

  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = useMemo(() => {
    let count = 0;
    if (activeTab === "stalls") count = filteredStalls.length;
    else if (activeTab === "products") count = filteredProducts.length;
    else if (activeTab === "orders") count = filteredOrders.length;
    return Math.ceil(count / itemsPerPage);
  }, [activeTab, filteredStalls, filteredProducts, filteredOrders]);

  // Get stall name helper
  const getStallName = (menuItem: AdminMenuItem) => {
    if (menuItem.stallId && typeof menuItem.stallId === "object") {
      return menuItem.stallId.name;
    }
    const found = stalls.find((s) => s._id === menuItem.stallId);
    return found ? found.name : "Unknown Stall";
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Vendor Dashboard</h1>
            <p>Manage your food stalls, active menus, and business stats</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success">
          <span>✅ {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg(null)}>&times;</button>
        </div>
      )}

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "stalls" ? "active" : ""}`} onClick={() => setActiveTab("stalls")}>
          <span>🏪</span> My Stalls
        </button>
        <button className={`tab-btn ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
          <span>🍜</span> Menu Products
        </button>
        <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
          <span>📋</span> Pre-Orders
        </button>
      </div>

      <div className="admin-content-full">
        {activeTab === "stalls" && stalls.length >= 1 && (
          <div className="alert-warning-block" style={{
            backgroundColor: "#fffde7",
            border: "1px solid #fff59d",
            color: "#f57f17",
            padding: "16px",
            borderRadius: "6px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px"
          }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <div>
              <strong>Stall Limit Reached:</strong> As a vendor, you are restricted to registering and owning a maximum of <strong>1 food stall</strong>. If you need to modify your existing stall, please click the <strong>Edit</strong> button in the table below.
            </div>
          </div>
        )}

        {/* TOP CONTROLS & FILTER BAR */}
        <div className="admin-filters-bar">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="filter-dropdowns">
            {activeTab === "stalls" && (
              <>
                <select value={stallCategoryFilter} onChange={(e) => { setStallCategoryFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Categories</option>
                  {Array.from(new Set(stalls.map((s) => s.category))).filter(Boolean).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select value={stallStatusFilter} onChange={(e) => { setStallStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved / Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </>
            )}

            {activeTab === "products" && (
              <>
                <select value={productCategoryFilter} onChange={(e) => { setProductCategoryFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <select value={productStallFilter} onChange={(e) => { setProductStallFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Stalls</option>
                  {stalls.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </>
            )}

            {activeTab === "orders" && (
              <>
                <select value={orderStatusFilter} onChange={(e) => { setOrderStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Order Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select value={orderPaymentFilter} onChange={(e) => { setOrderPaymentFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Payment Statuses</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </>
            )}
          </div>

          <div className="add-btn-container">
            {activeTab === "stalls" && (
              stalls.length >= 1 ? (
                <button className="btn-teal" disabled title="You can only own a maximum of 1 stall" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  + Add Stall
                </button>
              ) : (
                <button className="btn-teal" onClick={() => { setStallForm({ ...emptyStall }); setActiveModal("stall_create"); }}>
                  + Add Stall
                </button>
              )
            )}
            {activeTab === "products" && (
              <button className="btn-teal" onClick={() => { setMenuItemForm({ ...emptyMenuItem }); setActiveModal("product_create"); }}>
                + Add Product
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLES */}
        <div className="table-wrapper">
          {activeTab === "stalls" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Stall Name</th>
                  <th>Location</th>
                  <th>Section</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStalls.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">No stalls found. Create a stall to get started!</td></tr>
                ) : (
                  currentStalls.map((stall) => {
                    const status = stall.status || (stall.isActive ? "approved" : "rejected");
                    return (
                      <tr key={stall._id}>
                        <td><strong>{stall.name}</strong></td>
                        <td>{stall.location}</td>
                        <td>{stall.section || "-"}</td>
                        <td><span className="text-tag">{stall.category}</span></td>
                        <td>
                          <span className={`badge badge-status-${status}`}>
                            {status === "approved" ? "Active" : status === "pending" ? "Pending" : "Rejected"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn-sm btn-edit"
                              onClick={() => {
                                setSelectedStallId(stall._id);
                                setStallForm({
                                  name: stall.name,
                                  location: stall.location,
                                  category: stall.category,
                                  description: stall.description,
                                  section: stall.section,
                                  openingHours: stall.openingHours,
                                  photoUrl: stall.photoUrl ?? "",
                                  isActive: stall.isActive,
                                  status: status as any
                                });
                                setActiveModal("stall_edit");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-sm btn-danger"
                              onClick={() => triggerDeleteConfirm("stall", stall._id, stall.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === "products" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Stall</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">No products found. Add a product to showcase in your menu.</td></tr>
                ) : (
                  currentProducts.map((p) => {
                    const stallIdStr = typeof p.stallId === "object" && p.stallId ? p.stallId._id : p.stallId;
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="product-cell">
                            {p.photoUrl && <img src={p.photoUrl} alt={p.name} className="product-thumbnail" />}
                            <strong>{p.name}</strong>
                          </div>
                        </td>
                        <td>{getStallName(p)}</td>
                        <td><span className="text-tag">{p.category}</span></td>
                        <td><strong className="text-teal">Rs. {p.price}</strong></td>
                        <td>
                          <span className={`badge badge-availability-${p.isAvailable ? "yes" : "no"}`}>
                            {p.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn-sm btn-edit"
                              onClick={() => {
                                setSelectedProductId(p._id);
                                setMenuItemForm({
                                  name: p.name,
                                  description: p.description,
                                  price: p.price,
                                  category: p.category,
                                  ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(", ") : "",
                                  allergens: Array.isArray(p.allergens) ? p.allergens.join(", ") : "",
                                  calories: p.nutrition?.calories ?? 0,
                                  proteinGrams: p.nutrition?.proteinGrams ?? 0,
                                  carbsGrams: p.nutrition?.carbsGrams ?? 0,
                                  fatGrams: p.nutrition?.fatGrams ?? 0,
                                  sodiumMilligrams: p.nutrition?.sodiumMilligrams ?? 0,
                                  isAvailable: p.isAvailable,
                                  isFeatured: p.isFeatured ?? false,
                                  stallId: stallIdStr ?? "",
                                  photoUrl: (p as any).photoUrl ?? ""
                                });
                                setActiveModal("product_edit");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-sm btn-danger"
                              onClick={() => triggerDeleteConfirm("product", p._id, p.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === "orders" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Student Info</th>
                  <th>Stall</th>
                  <th>Items & Total</th>
                  <th>Pickup & Payment</th>
                  <th>Status Controls</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">No pre-orders found.</td></tr>
                ) : (
                  currentOrders.map((o) => {
                    const student = typeof o.userId === "object" ? o.userId : null;
                    const stallName = typeof o.stallId === "object" && o.stallId ? o.stallId.name : "Unknown Stall";
                    return (
                      <tr key={o._id}>
                        <td>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            <strong>ID:</strong> <span style={{ fontFamily: "monospace" }}>{o._id.substring(o._id.length - 6)}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                            {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          {student ? (
                            <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
                              <strong>{student.name}</strong>
                              <div style={{ fontSize: "12px", color: "#555" }}>
                                🆔 {student.studentId || "No Student ID"} | 📚 {student.courseSection || "No Section"}
                              </div>
                              <div style={{ fontSize: "12.5px", color: "#008080", fontWeight: 600 }}>
                                📞 {student.contactNumber || "No Contact"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#888" }}>
                                ✉️ {student.schoolEmail || student.email}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "#999" }}>Unknown Student ({typeof o.userId === "string" ? o.userId : "N/A"})</span>
                          )}
                        </td>
                        <td>
                          <strong>{stallName}</strong>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", maxHeight: "100px", overflowY: "auto", marginBottom: "6px" }}>
                            {o.items.map((item, idx) => (
                              <div key={idx} style={{ padding: "2px 0", borderBottom: "1px dashed #f0f0f0" }}>
                                • {item.name} x{item.quantity} <span style={{ color: "#666" }}>({item.price * item.quantity})</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#8B0000" }}>
                            Total: Rs. {o.totalAmount}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px" }}>
                            ⏰ Pickup: <strong>{o.pickupTime}</strong>
                          </div>
                          <div style={{ marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                            <span className={`badge badge-pm-${o.paymentMethod.toLowerCase()}`}>
                              {o.paymentMethod === "GCash" ? "📱 GCash" : "💵 Cash"}
                            </span>
                            <span className={`badge badge-ps-${o.paymentStatus.toLowerCase()}`}>
                              {o.paymentStatus}
                            </span>
                          </div>
                          {o.paymentMethod === "GCash" && o.gcashNumber && (
                            <div style={{ fontSize: "11.5px", color: "#333", marginTop: "6px", borderTop: "1px dashed #ddd", paddingTop: "4px" }}>
                              📱 Ref: <strong>{o.gcashNumber}</strong>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "160px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <label style={{ fontSize: "11px", fontWeight: "bold", color: "#666" }}>Order Status</label>
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value as any)}
                                style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #ccc", background: "#fff" }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready">Ready</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <label style={{ fontSize: "11px", fontWeight: "bold", color: "#666" }}>Payment Status</label>
                              <select
                                value={o.paymentStatus}
                                onChange={(e) => handleUpdatePaymentStatus(o._id, e.target.value as any)}
                                style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #ccc", background: "#fff" }}
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                              </select>
                            </div>

                            {student && (
                              <button
                                type="button"
                                onClick={() => handleOpenReportModal(student._id, student.name, o._id)}
                                style={{
                                  marginTop: "6px",
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  background: "#ffeef0",
                                  color: "#d9363e",
                                  border: "1px solid #ffccc7",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#ffccc7";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#ffeef0";
                                }}
                              >
                                ⚠️ Report Student
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. STALL CREATE MODAL */}
      {activeModal === "stall_create" && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>🏪 Create New Stall</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleCreateStall(); }} className="modal-grid-form">
              <div className="form-group">
                <label>Stall Name *</label>
                <input
                  type="text"
                  required
                  value={stallForm.name}
                  onChange={(e) => setStallForm({ ...stallForm, name: e.target.value })}
                  placeholder="e.g. Gourmet Delights"
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  required
                  value={stallForm.location}
                  onChange={(e) => setStallForm({ ...stallForm, location: e.target.value })}
                  placeholder="e.g. Block C, Food Hall"
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={stallForm.category}
                  onChange={(e) => setStallForm({ ...stallForm, category: e.target.value })}
                >
                  <option value="general">General</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name.toLowerCase()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={stallForm.section}
                  onChange={(e) => setStallForm({ ...stallForm, section: e.target.value })}
                  placeholder="e.g. Stall 4"
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={stallForm.description}
                  onChange={(e) => setStallForm({ ...stallForm, description: e.target.value })}
                  placeholder="Describe your stall and foods..."
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Opening Hours</label>
                <input
                  type="text"
                  value={stallForm.openingHours}
                  onChange={(e) => setStallForm({ ...stallForm, openingHours: e.target.value })}
                  placeholder="e.g. 8:00 AM - 6:00 PM"
                />
              </div>
              <div className="form-group">
                <label>Stall Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStallPhotoUploadChange}
                  style={{ padding: "8px 0" }}
                />
                {stallForm.photoUrl && (
                  <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
                    <img
                      src={stallForm.photoUrl}
                      alt="Preview"
                      style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "6px", border: "1px solid #ddd", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => setStallForm({ ...stallForm, photoUrl: "" })}
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
              <div className="form-group checkbox-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={stallForm.isActive}
                    onChange={(e) => setStallForm({ ...stallForm, isActive: e.target.checked })}
                  />
                  Active Toggle (Visible to customers once approved)
                </label>
              </div>
              <div className="modal-actions full-width">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. STALL EDIT MODAL */}
      {activeModal === "stall_edit" && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>🏪 Edit Stall Details</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleEditStall(); }} className="modal-grid-form">
              <div className="form-group">
                <label>Stall Name *</label>
                <input
                  type="text"
                  required
                  value={stallForm.name}
                  onChange={(e) => setStallForm({ ...stallForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  required
                  value={stallForm.location}
                  onChange={(e) => setStallForm({ ...stallForm, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={stallForm.category}
                  onChange={(e) => setStallForm({ ...stallForm, category: e.target.value })}
                >
                  <option value="general">General</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name.toLowerCase()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={stallForm.section}
                  onChange={(e) => setStallForm({ ...stallForm, section: e.target.value })}
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={stallForm.description}
                  onChange={(e) => setStallForm({ ...stallForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Opening Hours</label>
                <input
                  type="text"
                  value={stallForm.openingHours}
                  onChange={(e) => setStallForm({ ...stallForm, openingHours: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Stall Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStallPhotoUploadChange}
                  style={{ padding: "8px 0" }}
                />
                {stallForm.photoUrl && (
                  <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
                    <img
                      src={stallForm.photoUrl}
                      alt="Preview"
                      style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "6px", border: "1px solid #ddd", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => setStallForm({ ...stallForm, photoUrl: "" })}
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
              <div className="form-group checkbox-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={stallForm.isActive}
                    onChange={(e) => setStallForm({ ...stallForm, isActive: e.target.checked })}
                  />
                  Active Toggle
                </label>
              </div>
              <div className="modal-actions full-width">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PRODUCT CREATE MODAL */}
      {activeModal === "product_create" && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>🍜 Add New Product</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleCreateProduct(); }} className="modal-grid-form">
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ marginBottom: 0 }}>Product Name *</label>
                  <button
                    type="button"
                    className="btn-ai-autofill"
                    onClick={handleAutofillNutrition}
                    disabled={isAutofilling}
                    style={{
                      padding: "2px 8px",
                      fontSize: "11px",
                      background: "#008080",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {isAutofilling ? "⏳ Autofilling..." : "✨ Autofill Description & Nutrition"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={menuItemForm.name}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                  placeholder="e.g. Spicy Ramen"
                />
              </div>
              <div className="form-group">
                <label>Stall *</label>
                <select
                  required
                  value={menuItemForm.stallId}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, stallId: e.target.value })}
                >
                  <option value="">-- Select Stall --</option>
                  {stalls.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  required
                  value={menuItemForm.category}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, category: e.target.value })}
                >
                  <option value="general">General</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name.toLowerCase()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Price (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={menuItemForm.price || ""}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, price: Number(e.target.value) })}
                  placeholder="e.g. 150"
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={menuItemForm.description}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                  placeholder="Describe details, sizing..."
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Product Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadChange}
                  style={{ padding: "8px 0" }}
                />
                {menuItemForm.photoUrl && (
                  <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
                    <img
                      src={menuItemForm.photoUrl}
                      alt="Preview"
                      style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "6px", border: "1px solid #ddd", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => setMenuItemForm({ ...menuItemForm, photoUrl: "" })}
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
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={menuItemForm.isAvailable}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, isAvailable: e.target.checked })}
                  />
                  Available Toggle
                </label>
              </div>
              <div className="form-group full-width">
                <label>Ingredients (comma separated)</label>
                <input
                  type="text"
                  value={menuItemForm.ingredients}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, ingredients: e.target.value })}
                  placeholder="e.g. flour, sugar, butter"
                />
              </div>
              <div className="form-group full-width">
                <label>Allergens (comma separated)</label>
                <input
                  type="text"
                  value={menuItemForm.allergens}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, allergens: e.target.value })}
                  placeholder="e.g. peanuts, gluten"
                />
              </div>

              <fieldset className="nutrition-fieldset full-width">
                <legend>🍎 Nutritional Facts (per serving)</legend>
                <div className="nutrition-grid">
                  <div className="form-group">
                    <label>Calories (kcal)</label>
                    <input
                      type="number"
                      value={menuItemForm.calories || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, calories: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input
                      type="number"
                      value={menuItemForm.proteinGrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, proteinGrams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input
                      type="number"
                      value={menuItemForm.carbsGrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, carbsGrams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input
                      type="number"
                      value={menuItemForm.fatGrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, fatGrams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sodium (mg)</label>
                    <input
                      type="number"
                      value={menuItemForm.sodiumMilligrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, sodiumMilligrams: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="modal-actions full-width">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PRODUCT EDIT MODAL */}
      {activeModal === "product_edit" && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>🍜 Edit Product Details</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleEditProduct(); }} className="modal-grid-form">
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ marginBottom: 0 }}>Product Name *</label>
                  <button
                    type="button"
                    className="btn-ai-autofill"
                    onClick={handleAutofillNutrition}
                    disabled={isAutofilling}
                    style={{
                      padding: "2px 8px",
                      fontSize: "11px",
                      background: "#008080",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {isAutofilling ? "⏳ Autofilling..." : "✨ Autofill Description & Nutrition"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={menuItemForm.name}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  required
                  value={menuItemForm.category}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, category: e.target.value })}
                >
                  <option value="general">General</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name.toLowerCase()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Price (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={menuItemForm.price || ""}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, price: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Product Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadChange}
                  style={{ padding: "8px 0" }}
                />
                {menuItemForm.photoUrl && (
                  <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
                    <img
                      src={menuItemForm.photoUrl}
                      alt="Preview"
                      style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "6px", border: "1px solid #ddd", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => setMenuItemForm({ ...menuItemForm, photoUrl: "" })}
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
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={menuItemForm.description}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group checkbox-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={menuItemForm.isAvailable}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, isAvailable: e.target.checked })}
                  />
                  Available Toggle
                </label>
              </div>
              <div className="form-group full-width">
                <label>Ingredients (comma separated)</label>
                <input
                  type="text"
                  value={menuItemForm.ingredients}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, ingredients: e.target.value })}
                />
              </div>
              <div className="form-group full-width">
                <label>Allergens (comma separated)</label>
                <input
                  type="text"
                  value={menuItemForm.allergens}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, allergens: e.target.value })}
                />
              </div>

              <fieldset className="nutrition-fieldset full-width">
                <legend>🍎 Nutritional Facts (per serving)</legend>
                <div className="nutrition-grid">
                  <div className="form-group">
                    <label>Calories (kcal)</label>
                    <input
                      type="number"
                      value={menuItemForm.calories || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, calories: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input
                      type="number"
                      value={menuItemForm.proteinGrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, proteinGrams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input
                      type="number"
                      value={menuItemForm.carbsGrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, carbsGrams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input
                      type="number"
                      value={menuItemForm.fatGrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, fatGrams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sodium (mg)</label>
                    <input
                      type="number"
                      value={menuItemForm.sodiumMilligrams || ""}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, sodiumMilligrams: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="modal-actions full-width">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {confirmDelete?.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-confirm">
            <div className="modal-header">
              <h3>⚠️ Confirm Delete</h3>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the {confirmDelete.type} <strong>{confirmDelete.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will permanently remove this item.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => void executeDelete()} disabled={isSaving}>
                {isSaving ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. REPORT STUDENT MODAL */}
      {activeModal === "student_report" && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="modal-header">
              <h3>⚠️ Report Student: {reportStudentName}</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleCreateReport(); }}>
              <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Reason for Report *</label>
                  <select
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", width: "100%" }}
                  >
                    <option value="">-- Select a reason --</option>
                    <option value="No-show / Unclaimed order">No-show / Unclaimed order</option>
                    <option value="Fake / Duplicate GCash payment">Fake / Duplicate GCash payment</option>
                    <option value="Abusive behavior / Language">Abusive behavior / Language</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Description / Additional Details *</label>
                  <textarea
                    required
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide details about the incident, e.g. amount, times attempted to contact..."
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "100px", resize: "vertical", fontSize: "14px", width: "100%" }}
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 20px", borderTop: "1px solid #eee" }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-danger" disabled={isSaving}>
                  {isSaving ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Pagination Component helper
function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="pagination-btn"
      >
        &larr; Prev
      </button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="pagination-btn"
      >
        Next &rarr;
      </button>
    </div>
  );
}
