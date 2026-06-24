import { useEffect, useState, useMemo } from "react";
import {
  type AdminCategoryItem,
  type AdminStallItem,
  type AdminUserItem,
  type AdminMenuItem,
  type AdminAnalyticsStallItem,
  createAdminCategory,
  createAdminMenuItem,
  createAdminStall,
  deleteAdminCategory,
  deleteAdminStall,
  fetchAdminCategories,
  fetchAdminStalls,
  fetchAdminUsers,
  updateAdminCategory,
  updateAdminMenuItem,
  updateAdminStall,
  updateAdminUser,
  createAdminUser,
  deleteAdminUser,
  fetchAdminMenuItemsAll,
  deleteAdminMenuItem,
  fetchTopRatedStalls,
  fetchMostFavoritedStalls,
  generateNutritionInfo
} from "../lib/adminApi";
import { fetchReports, updateReport, type ReportSummary } from "../lib/api";

interface AdminDashboardProps {
  token: string;
}

const emptyUser: Partial<AdminUserItem> = {
  name: "",
  email: "",
  password: "",
  role: "user",
  isActive: true,
  status: "Active"
};

const emptyStall = {
  name: "",
  location: "",
  category: "general",
  description: "",
  section: "",
  openingHours: "",
  photoUrl: "",
  isActive: true,
  status: "approved" as "approved" | "pending" | "rejected"
};

const emptyCategory = {
  name: "",
  description: ""
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

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "stalls" | "categories" | "products" | "analytics" | "reports">("users");
  
  // Data States
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stalls, setStalls] = useState<AdminStallItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [products, setProducts] = useState<AdminMenuItem[]>([]);
  const [topRatedStalls, setTopRatedStalls] = useState<AdminAnalyticsStallItem[]>([]);
  const [mostFavoritedStalls, setMostFavoritedStalls] = useState<AdminAnalyticsStallItem[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);

  // Search/Filter/Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [stallCategoryFilter, setStallCategoryFilter] = useState("all");
  const [stallStatusFilter, setStallStatusFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStallFilter, setProductStallFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [activeModal, setActiveModal] = useState<
    "none" | "user_create" | "user_edit" | "stall_create" | "stall_edit" | "category_create" | "category_edit" | "product_create" | "product_edit" | "report_review"
  >("none");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Form States
  const [userForm, setUserForm] = useState<Partial<AdminUserItem>>({ ...emptyUser });
  const [stallForm, setStallForm] = useState(() => ({ ...emptyStall }));
  const [categoryForm, setCategoryForm] = useState(() => ({ ...emptyCategory }));
  const [menuItemForm, setMenuItemForm] = useState(() => ({ ...emptyMenuItem }));

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: "user" | "stall" | "category" | "product";
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
      const [userData, stallData, categoryData, productData, topStalls, favStalls, reportData] = await Promise.all([
        fetchAdminUsers(token),
        fetchAdminStalls(token),
        fetchAdminCategories(token),
        fetchAdminMenuItemsAll(token),
        fetchTopRatedStalls(token).catch(() => []),
        fetchMostFavoritedStalls(token).catch(() => []),
        fetchReports(token).catch(() => [])
      ]);
      setUsers(userData);
      setStalls(stallData);
      setCategories(categoryData);
      setProducts(productData);
      setTopRatedStalls(topStalls);
      setMostFavoritedStalls(favStalls);
      setReports(reportData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
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

  // --- Users Actions ---
  const handleCreateUser = async () => {
    setIsSaving(true);
    try {
      const result = await createAdminUser(token, userForm);
      setUsers((prev) => [result.user, ...prev]);
      setActiveModal("none");
      setUserForm({ ...emptyUser });
      showSuccess("User created successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const result = await updateAdminUser(token, selectedUserId, {
        role: userForm.role,
        status: userForm.status
      });
      setUsers((prev) => prev.map((u) => (u._id === selectedUserId ? result.user : u)));
      setActiveModal("none");
      setSelectedUserId(null);
      setUserForm({ ...emptyUser });
      showSuccess("User updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSuspendUser = async (user: AdminUserItem) => {
    try {
      const currentStatus = user.status || (user.isActive ? "Active" : "Suspended");
      const newStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
      const result = await updateAdminUser(token, user._id, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? result.user : u)));
      showSuccess(`User ${newStatus === "Suspended" ? "suspended" : "activated"} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status.");
    }
  };

  // --- Stalls Actions ---
  const handleCreateStall = async () => {
    setIsSaving(true);
    try {
      const result = await createAdminStall(token, stallForm);
      setStalls((prev) => [result.stall, ...prev]);
      setActiveModal("none");
      setStallForm({ ...emptyStall });
      showSuccess("Stall created successfully");
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

  const handleApproveStall = async (stallId: string) => {
    try {
      const result = await updateAdminStall(token, stallId, { status: "approved", isActive: true });
      setStalls((prev) => prev.map((s) => (s._id === stallId ? result.stall : s)));
      showSuccess("Stall approved and activated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve stall.");
    }
  };

  const handleRejectStall = async (stallId: string) => {
    try {
      const result = await updateAdminStall(token, stallId, { status: "rejected", isActive: false });
      setStalls((prev) => prev.map((s) => (s._id === stallId ? result.stall : s)));
      showSuccess("Stall request rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject stall.");
    }
  };

  // --- Reports Actions ---
  const handleOpenReportReview = (report: ReportSummary) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || "");
    setError(null);
    setActiveModal("report_review");
  };

  const handleResolveReport = async (status: "Resolved" | "Dismissed", suspend: boolean) => {
    if (!selectedReport) return;
    setIsSaving(true);
    setError(null);
    try {
      const result = await updateReport(token, selectedReport._id, {
        status,
        adminNotes,
        suspendUser: suspend
      });
      setReports((prev) => prev.map((r) => r._id === selectedReport._id ? result.report : r));
      void loadData();
      setActiveModal("none");
      setSelectedReport(null);
      showSuccess(`Report resolved as ${status}${suspend ? " with user suspension" : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivateReportUser = async (userId: string) => {
    if (!selectedReport) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateAdminUser(token, userId, { status: "Active" });
      showSuccess("User reactivated successfully");
      void loadData();
      setActiveModal("none");
      setSelectedReport(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate user.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Categories Actions ---
  const handleCreateCategory = async () => {
    setIsSaving(true);
    try {
      const result = await createAdminCategory(token, categoryForm);
      setCategories((prev) => [result.category, ...prev]);
      setActiveModal("none");
      setCategoryForm({ ...emptyCategory });
      showSuccess("Category created successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategoryId) return;
    setIsSaving(true);
    try {
      const result = await updateAdminCategory(token, selectedCategoryId, categoryForm);
      setCategories((prev) => prev.map((c) => (c._id === selectedCategoryId ? result.category : c)));
      setActiveModal("none");
      setSelectedCategoryId(null);
      setCategoryForm({ ...emptyCategory });
      showSuccess("Category updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category.");
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

  // --- Global Delete Confirmation ---
  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsSaving(true);
    const { type, id } = confirmDelete;
    try {
      if (type === "user") {
        await deleteAdminUser(token, id);
        setUsers((prev) => prev.filter((u) => u._id !== id));
        showSuccess("User deleted successfully");
      } else if (type === "stall") {
        await deleteAdminStall(token, id);
        setStalls((prev) => prev.filter((s) => s._id !== id));
        showSuccess("Stall deleted successfully");
      } else if (type === "category") {
        await deleteAdminCategory(token, id);
        setCategories((prev) => prev.filter((c) => c._id !== id));
        showSuccess("Category deleted successfully");
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

  // --- Filtering & Searching Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === "all" ||
        (u.status || (u.isActive ? "Active" : "Suspended")) === userStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, userRoleFilter, userStatusFilter]);

  const filteredStalls = useMemo(() => {
    return stalls.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.section.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = stallCategoryFilter === "all" || s.category === stallCategoryFilter;
      const matchesStatus =
        stallStatusFilter === "all" ||
        (s.status || (s.isActive ? "approved" : "rejected")) === stallStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stalls, searchTerm, stallCategoryFilter, stallStatusFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [categories, searchTerm]);

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

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const reporterName = r.reporterId?.name || "";
      const reportedName = r.reportedUserId?.name || "";
      const matchesSearch =
        reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reportedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = reportStatusFilter === "all" || r.status === reportStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, reportStatusFilter]);

  // --- Pagination Slice ---
  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const currentStalls = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStalls.slice(start, start + itemsPerPage);
  }, [filteredStalls, currentPage]);

  const currentCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage]);

  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const currentReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage]);

  const totalPages = useMemo(() => {
    let count = 0;
    if (activeTab === "users") count = filteredUsers.length;
    else if (activeTab === "stalls") count = filteredStalls.length;
    else if (activeTab === "categories") count = filteredCategories.length;
    else if (activeTab === "products") count = filteredProducts.length;
    else if (activeTab === "reports") count = filteredReports.length;
    return Math.ceil(count / itemsPerPage);
  }, [activeTab, filteredUsers, filteredStalls, filteredCategories, filteredProducts, filteredReports]);

  // Retrieve vendor name helper
  const getVendorName = (stall: AdminStallItem) => {
    if (stall.vendorId && typeof stall.vendorId === "object") {
      return stall.vendorId.name;
    }
    return "Admin";
  };

  // Get stall name helper
  const getStallName = (menuItem: AdminMenuItem) => {
    if (menuItem.stallId && typeof menuItem.stallId === "object") {
      return menuItem.stallId.name;
    }
    const found = stalls.find((s) => s._id === menuItem.stallId);
    return found ? found.name : "Unknown Stall";
  };

  // Category Item Count Helper
  const getCategoryItemCount = (categoryName: string) => {
    return products.filter((p) => p.category === categoryName).length;
  };

  const triggerDeleteConfirm = (type: "user" | "stall" | "category" | "product", id: string, name: string) => {
    setConfirmDelete({ isOpen: true, type, id, name });
  };

  // --- SVG Charts Computations ---
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stalls.forEach((s) => {
      const cat = s.category || "general";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [stalls]);

  const donutData = useMemo(() => {
    const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    let currentOffset = 0;
    const colors = ["#008080", "#8B0000", "#FF8C00", "#4682B4", "#9ACD32", "#8A2BE2", "#FF1493"];
    
    return Object.entries(categoryCounts).map(([name, count], index) => {
      const percentage = count / total;
      const strokeLength = percentage * 314.16; // Circumference (2 * Math.PI * 50)
      const strokeOffset = 314.16 - currentOffset;
      currentOffset += strokeLength;
      
      return {
        name,
        count,
        percentage: Math.round(percentage * 100),
        strokeLength,
        strokeOffset,
        color: colors[index % colors.length]
      };
    });
  }, [categoryCounts]);

  const barChartData = useMemo(() => {
    const items = topRatedStalls.length > 0 ? topRatedStalls.slice(0, 5) : [];
    const maxVal = 5;
    const colors = ["#008080", "#8B0000", "#FF8C00", "#4682B4", "#9ACD32"];
    
    return items.map((stall, index) => {
      const ratingVal = stall.averageRating ?? stall.rating ?? 0;
      const height = (ratingVal / maxVal) * 150;
      return {
        name: stall.name,
        rating: ratingVal,
        height,
        color: colors[index % colors.length]
      };
    });
  }, [topRatedStalls]);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Admin Panel</h1>
            <p>Full control over users, stalls, menu items and categories</p>
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
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          <span>👥</span> Users
        </button>
        <button className={`tab-btn ${activeTab === "stalls" ? "active" : ""}`} onClick={() => setActiveTab("stalls")}>
          <span>🏪</span> Stalls
        </button>
        <button className={`tab-btn ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
          <span>🏷️</span> Categories
        </button>
        <button className={`tab-btn ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
          <span>🍜</span> Products
        </button>
        <button className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          <span>📈</span> Analytics
        </button>
        <button className={`tab-btn ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
          <span>⚠️</span> Reports
        </button>
      </div>

      <div className="admin-content-full">
        {/* TOP CONTROLS & FILTER BAR (Hidden on Analytics tab) */}
        {activeTab !== "analytics" && (
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
              {activeTab === "users" && (
                <>
                  <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="all">All Roles</option>
                    <option value="user">Student (User)</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={userStatusFilter} onChange={(e) => { setUserStatusFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending</option>
                  </select>
                </>
              )}

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
                    <option value="rejected">Rejected / Disabled</option>
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

              {activeTab === "reports" && (
                <select value={reportStatusFilter} onChange={(e) => { setReportStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              )}
            </div>

            <div className="add-btn-container">
              {activeTab === "users" && (
                <button className="btn-teal" onClick={() => { setUserForm({ ...emptyUser }); setActiveModal("user_create"); }}>
                  + Add User
                </button>
              )}
              {activeTab === "stalls" && (
                <button className="btn-teal" onClick={() => { setStallForm({ ...emptyStall }); setActiveModal("stall_create"); }}>
                  + Add Stall
                </button>
              )}
              {activeTab === "categories" && (
                <button className="btn-teal" onClick={() => { setCategoryForm({ ...emptyCategory }); setActiveModal("category_create"); }}>
                  + Add Category
                </button>
              )}
              {activeTab === "products" && (
                <button className="btn-teal" onClick={() => { setMenuItemForm({ ...emptyMenuItem }); setActiveModal("product_create"); }}>
                  + Add Product
                </button>
              )}
            </div>
          </div>
        )}

        {/* PENDING STALLS ALERT NOTIFICATION PANEL */}
        {activeTab === "stalls" && stalls.some((s) => s.status === "pending") && (
          <div className="pending-stalls-panel">
            <h4>🏪 Stalls Awaiting Approval</h4>
            <div className="pending-stalls-list">
              {stalls.filter((s) => s.status === "pending").map((stall) => (
                <div key={stall._id} className="pending-stall-card">
                  <div className="pending-stall-info">
                    <strong>{stall.name}</strong> - <span>Vendor: {getVendorName(stall)}</span>
                    <p className="meta">{stall.location} | {stall.category}</p>
                  </div>
                  <div className="pending-stall-actions">
                    <button className="btn-sm btn-approve" onClick={() => void handleApproveStall(stall._id)}>Approve</button>
                    <button className="btn-sm btn-reject" onClick={() => void handleRejectStall(stall._id)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATA TABLES / ANALYTICS TAB */}
        {activeTab === "analytics" ? (
          <div className="analytics-view">
            {/* KPI STAT CARDS */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">🏪</div>
                <div className="kpi-info">
                  <h3>Total Stalls</h3>
                  <h2>{stalls.length}</h2>
                  <p>{stalls.filter((s) => s.status === "approved" || s.isActive).length} Active | {stalls.filter((s) => s.status === "pending").length} Pending</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-info">
                  <h3>Total Users</h3>
                  <h2>{users.length}</h2>
                  <p>{users.filter((u) => u.role === "user").length} Students | {users.filter((u) => u.role === "vendor").length} Vendors</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">🍜</div>
                <div className="kpi-info">
                  <h3>Total Products</h3>
                  <h2>{products.length}</h2>
                  <p>{products.filter((p) => p.isAvailable).length} Available | {products.filter((p) => p.isFeatured).length} Featured</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">🏷️</div>
                <div className="kpi-info">
                  <h3>Categories</h3>
                  <h2>{categories.length}</h2>
                  <p>Configured Stall Types</p>
                </div>
              </div>
            </div>

            {/* GRAPHS GRID */}
            <div className="graphs-grid">
              {/* TOP RATED STALLS BAR CHART */}
              <div className="chart-card">
                <h3>⭐ Top Rated Stalls (Database Statistics)</h3>
                {barChartData.length === 0 ? (
                  <div className="chart-empty">No rating statistics found in the database.</div>
                ) : (
                  <div className="chart-container">
                    <svg viewBox="0 0 500 240" className="bar-chart-svg">
                      {/* Grid Lines */}
                      {[0, 1, 2, 3, 4, 5].map((val) => {
                        const y = 200 - (val / 5) * 150;
                        return (
                          <g key={val}>
                            <line x1="40" y1={y} x2="480" y2={y} stroke="#f0f0f0" strokeDasharray="4 4" />
                            <text x="15" y={y + 4} className="chart-axis-text" textAnchor="middle">{val}</text>
                          </g>
                        );
                      })}
                      {/* Bars */}
                      {barChartData.map((bar, idx) => {
                        const x = 70 + idx * 80;
                        const y = 200 - bar.height;
                        return (
                          <g key={idx}>
                            <rect x={x} y="50" width="36" height="150" fill="#fdfdfd" rx="4" />
                            <rect x={x} y={y} width="36" height={bar.height} fill={bar.color} rx="4" className="chart-bar" />
                            <text x={x + 18} y={y - 8} className="bar-value-text" textAnchor="middle">{bar.rating.toFixed(1)} ★</text>
                            <text x={x + 18} y="220" className="bar-label-text" textAnchor="middle">
                              {bar.name.length > 8 ? `${bar.name.substring(0, 8)}...` : bar.name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              {/* STALLS BY CATEGORY DONUT CHART */}
              <div className="chart-card">
                <h3>🏷️ Stall Types Distribution</h3>
                {donutData.length === 0 ? (
                  <div className="chart-empty">No stalls registered to map categories.</div>
                ) : (
                  <div className="donut-chart-container">
                    <div className="donut-svg-wrapper">
                      <svg viewBox="0 0 200 200" className="donut-chart-svg">
                        <circle cx="100" cy="100" r="50" fill="transparent" stroke="#f5f5f5" strokeWidth="16" />
                        {donutData.map((seg, idx) => (
                          <circle
                            key={idx}
                            cx="100"
                            cy="100"
                            r="50"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="16"
                            strokeDasharray="314.16"
                            strokeDashoffset={seg.strokeOffset}
                            transform="rotate(-90 100 100)"
                            className="donut-segment"
                          />
                        ))}
                        <circle cx="100" cy="100" r="40" fill="white" />
                        <text x="100" y="105" textAnchor="middle" className="donut-center-title">{stalls.length}</text>
                        <text x="100" y="120" textAnchor="middle" className="donut-center-sub">Stalls</text>
                      </svg>
                    </div>
                    <div className="donut-legend">
                      {donutData.map((seg, idx) => (
                        <div key={idx} className="legend-item">
                          <span className="legend-dot" style={{ backgroundColor: seg.color }} />
                          <span className="legend-name">{seg.name}</span>
                          <span className="legend-value">{seg.count} ({seg.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* POPULAR ITEMS / FAVORITED LIST */}
            <div className="favorites-analytics-card">
              <h3>❤️ Most Favorited Stalls (Real-time Database Likes)</h3>
              {mostFavoritedStalls.length === 0 ? (
                <div className="empty-state">No favorite records found in database.</div>
              ) : (
                <div className="fav-stalls-grid">
                  {mostFavoritedStalls.map((stall, idx) => (
                    <div key={stall._id} className="fav-stall-item">
                      <span className="fav-rank">#{idx + 1}</span>
                      <div className="fav-info">
                        <strong>{stall.name}</strong>
                        <p className="meta">{stall.location} | {stall.category}</p>
                      </div>
                      <div className="fav-likes-badge">
                        <span>❤️</span> {stall.favoriteCount ?? 0} Likes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            {activeTab === "users" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr><td colSpan={5} className="empty-row">No users found.</td></tr>
                  ) : (
                    currentUsers.map((user) => {
                      const status = user.status || (user.isActive ? "Active" : "Suspended");
                      return (
                        <tr key={user._id}>
                          <td><strong>{user.name}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge badge-role-${user.role}`}>
                              {user.role === "user" ? "Student" : user.role === "vendor" ? "Vendor" : "Admin"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-status-${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-sm btn-edit"
                                onClick={() => {
                                  setSelectedUserId(user._id);
                                  setUserForm({
                                    role: user.role,
                                    status: status as any
                                  });
                                  setActiveModal("user_edit");
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className={`btn-sm ${status === "Suspended" ? "btn-approve" : "btn-warning"}`}
                                onClick={() => void toggleSuspendUser(user)}
                              >
                                {status === "Suspended" ? "Activate" : "Suspend"}
                              </button>
                              <button
                                className="btn-sm btn-danger"
                                onClick={() => triggerDeleteConfirm("user", user._id, user.name)}
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

            {activeTab === "stalls" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Stall Name</th>
                    <th>Vendor</th>
                    <th>Location</th>
                    <th>Section</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStalls.length === 0 ? (
                    <tr><td colSpan={7} className="empty-row">No stalls found.</td></tr>
                  ) : (
                    currentStalls.map((stall) => {
                      const status = stall.status || (stall.isActive ? "approved" : "rejected");
                      return (
                        <tr key={stall._id}>
                          <td><strong>{stall.name}</strong></td>
                          <td>{getVendorName(stall)}</td>
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
                              {status === "pending" && (
                                <>
                                  <button className="btn-sm btn-approve" onClick={() => void handleApproveStall(stall._id)}>Approve</button>
                                  <button className="btn-sm btn-reject" onClick={() => void handleRejectStall(stall._id)}>Reject</button>
                                </>
                              )}
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

            {activeTab === "categories" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Item Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCategories.length === 0 ? (
                    <tr><td colSpan={4} className="empty-row">No categories found.</td></tr>
                  ) : (
                    currentCategories.map((cat) => (
                      <tr key={cat._id}>
                        <td><strong>{cat.name}</strong></td>
                        <td>{cat.description || "-"}</td>
                        <td>
                          <span className="item-count-badge">{getCategoryItemCount(cat.name)} items</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn-sm btn-edit"
                              onClick={() => {
                                  setSelectedCategoryId(cat._id);
                                  setCategoryForm({
                                    name: cat.name,
                                    description: cat.description
                                  });
                                  setActiveModal("category_edit");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-sm btn-danger"
                              onClick={() => triggerDeleteConfirm("category", cat._id, cat.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                    <tr><td colSpan={6} className="empty-row">No products found.</td></tr>
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

            {activeTab === "reports" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Report Info</th>
                    <th>Reporter (Vendor)</th>
                    <th>Reported Student</th>
                    <th>Reason & Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReports.length === 0 ? (
                    <tr><td colSpan={6} className="empty-row">No reports found.</td></tr>
                  ) : (
                    currentReports.map((r) => {
                      const reporterName = r.reporterId?.name || "Unknown Vendor";
                      const studentName = r.reportedUserId?.name || "Unknown Student";
                      const studentEmail = r.reportedUserId?.email || "";
                      const userIsActive = r.reportedUserId?.isActive;
                      const userStatus = r.reportedUserId?.status || (userIsActive ? "Active" : "Suspended");

                      const getReportStatusBadgeClass = (status: string) => {
                        if (status === "Pending") return "badge badge-status-pending";
                        if (status === "Resolved") return "badge badge-status-active";
                        return "badge badge-status-suspended"; // Dismissed
                      };

                      return (
                        <tr key={r._id}>
                          <td>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              <strong>ID:</strong> <span style={{ fontFamily: "monospace" }}>{r._id.substring(r._id.length - 6)}</span>
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#888", marginTop: "4px" }}>
                              {new Date(r.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <strong>{reporterName}</strong>
                            <div style={{ fontSize: "11px", color: "#666" }}>{r.reporterId?.email}</div>
                          </td>
                          <td>
                            <strong>{studentName}</strong>
                            <div style={{ fontSize: "11px", color: "#666" }}>{studentEmail}</div>
                            <div style={{ marginTop: "4px" }}>
                              <span className={`badge badge-status-${userStatus.toLowerCase()}`}>
                                {userStatus}
                              </span>
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: "#d9363e", fontSize: "13px" }}>{r.reason}</strong>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#555", lineBreak: "anywhere" }}>
                              {r.description}
                            </p>
                          </td>
                          <td>
                            <span className={getReportStatusBadgeClass(r.status)}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-sm btn-edit"
                              onClick={() => handleOpenReportReview(r)}
                              style={{ display: "flex", alignItems: "center", gap: "4px" }}
                            >
                              🔍 Review
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {activeTab !== "analytics" && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. USER CREATE MODAL */}
      {activeModal === "user_create" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>👥 Create New User</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleCreateUser(); }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.name ?? ""}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  value={userForm.email ?? ""}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  value={userForm.password ?? ""}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={userForm.role ?? "user"}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                >
                  <option value="user">Student (User)</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={userForm.status ?? "Active"}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. USER EDIT MODAL */}
      {activeModal === "user_edit" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>👥 Edit User Context</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleEditUser(); }}>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={userForm.role ?? "user"}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                >
                  <option value="user">Student (User)</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={userForm.status ?? "Active"}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. STALL CREATE MODAL */}
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
                <label>Category (Category tag) *</label>
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
                  placeholder="Describe your stall and items..."
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
                  Active Toggle
                </label>
              </div>
              <div className="modal-actions full-width">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Create Stall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. STALL EDIT MODAL */}
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

      {/* 5. CATEGORY CREATE MODAL */}
      {activeModal === "category_create" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🏷️ Create New Category</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleCreateCategory(); }}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Beverages"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Describe items in this category..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CATEGORY EDIT MODAL */}
      {activeModal === "category_edit" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🏷️ Edit Category Details</h3>
              <button className="close-btn" onClick={() => setActiveModal("none")}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleEditCategory(); }}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal("none")}>Cancel</button>
                <button type="submit" className="btn-teal" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PRODUCT CREATE MODAL */}
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
                <label>Stall Owner *</label>
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
                  placeholder="Describe taste, sizes..."
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
                  placeholder="e.g. rice, egg, soy sauce"
                />
              </div>
              <div className="form-group full-width">
                <label>Allergens (comma separated)</label>
                <input
                  type="text"
                  value={menuItemForm.allergens}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, allergens: e.target.value })}
                  placeholder="e.g. eggs, soy"
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

      {/* 8. PRODUCT EDIT MODAL */}
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

      {/* 9. DELETE CONFIRMATION MODAL */}
      {confirmDelete?.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-confirm">
            <div className="modal-header">
              <h3>⚠️ Confirm Delete</h3>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the {confirmDelete.type} <strong>{confirmDelete.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone and may affect related database tables.</p>
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

      {/* 10. REPORT REVIEW & ACTION MODAL */}
      {activeModal === "report_review" && selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px", width: "100%" }}>
            <div className="modal-header">
              <h3>🔍 Review Report Details</h3>
              <button className="close-btn" onClick={() => { setActiveModal("none"); setSelectedReport(null); }}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Report Information card */}
              <div style={{ background: "#f9f9f9", padding: "14px", borderRadius: "8px", border: "1px solid #eee" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#333", borderBottom: "1px solid #e0e0e0", paddingBottom: "6px" }}>
                  ⚠️ Infraction Details
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><strong>Reason:</strong> <span style={{ color: "#d9363e", fontWeight: "600" }}>{selectedReport.reason}</span></div>
                  <div><strong>Date Filed:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</div>
                  {selectedReport.orderId && (
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Order Reference:</strong> <span style={{ fontFamily: "monospace" }}>{selectedReport.orderId._id}</span>
                      {` (Total: Rs. ${selectedReport.orderId.totalAmount} | Method: ${selectedReport.orderId.paymentMethod})`}
                    </div>
                  )}
                  <div style={{ gridColumn: "span 2", marginTop: "6px" }}>
                    <strong>Description:</strong>
                    <p style={{ margin: "4px 0 0 0", padding: "8px", background: "#fff", border: "1px solid #ddd", borderRadius: "4px", minHeight: "40px", whiteSpace: "pre-wrap" }}>
                      {selectedReport.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Users Information grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Reporter */}
                <div style={{ background: "#e6f7ff", padding: "14px", borderRadius: "8px", border: "1px solid #bae7ff" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "13.5px", color: "#0050b3" }}>🏪 Reporter (Vendor)</h4>
                  <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
                    <div><strong>Name:</strong> {selectedReport.reporterId?.name || "Unknown Vendor"}</div>
                    <div><strong>Email:</strong> {selectedReport.reporterId?.email}</div>
                  </div>
                </div>

                {/* Reported User */}
                <div style={{ background: "#fff1f0", padding: "14px", borderRadius: "8px", border: "1px solid #ffa39e" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "13.5px", color: "#cf1322" }}>👤 Reported Student</h4>
                  <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
                    <div><strong>Name:</strong> {selectedReport.reportedUserId?.name || "Unknown Student"}</div>
                    <div><strong>Email:</strong> {selectedReport.reportedUserId?.email}</div>
                    <div><strong>Student ID:</strong> {selectedReport.reportedUserId?.studentId || "N/A"}</div>
                    <div><strong>Section:</strong> {selectedReport.reportedUserId?.courseSection || "N/A"}</div>
                    <div><strong>Phone:</strong> {selectedReport.reportedUserId?.contactNumber || "N/A"}</div>
                    <div style={{ marginTop: "6px" }}>
                      <strong>Status: </strong>
                      <span className={`badge badge-status-${(selectedReport.reportedUserId?.status || (selectedReport.reportedUserId?.isActive ? "Active" : "Suspended")).toLowerCase()}`}>
                        {selectedReport.reportedUserId?.status || (selectedReport.reportedUserId?.isActive ? "Active" : "Suspended")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin decision area */}
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Admin Resolution Notes *</label>
                <textarea
                  required
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Provide brief notes explaining the resolution, review findings, or reason for suspension/dismissal..."
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "80px", resize: "vertical", fontSize: "14px" }}
                />
              </div>

            </div>

            {/* Actions Footer */}
            <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", padding: "16px 20px", borderTop: "1px solid #eee" }}>
              <div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setActiveModal("none"); setSelectedReport(null); }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {selectedReport.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => void handleResolveReport("Dismissed", false)}
                      disabled={isSaving || !adminNotes.trim()}
                      title={!adminNotes.trim() ? "Admin notes are required to resolve a report" : ""}
                    >
                      Dismiss Report
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => void handleResolveReport("Resolved", false)}
                      disabled={isSaving || !adminNotes.trim()}
                      style={{ background: "#f0f0f0", color: "#333", border: "1px solid #ccc" }}
                      title={!adminNotes.trim() ? "Admin notes are required to resolve a report" : ""}
                    >
                      Resolve (Keep Active)
                    </button>
                    {(selectedReport.reportedUserId?.isActive || selectedReport.reportedUserId?.status !== "Suspended") && (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => void handleResolveReport("Resolved", true)}
                        disabled={isSaving || !adminNotes.trim()}
                        title={!adminNotes.trim() ? "Admin notes are required to resolve a report" : ""}
                      >
                        🚫 Resolve & Suspend Student
                      </button>
                    )}
                  </>
                )}
                {/* Reactivation Button: if student status is currently Suspended or isActive is false */}
                {(!selectedReport.reportedUserId?.isActive || selectedReport.reportedUserId?.status === "Suspended") && (
                  <button
                    type="button"
                    onClick={() => void handleReactivateReportUser(selectedReport.reportedUserId?._id)}
                    disabled={isSaving}
                    style={{
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      border: "1px solid #a5d6a7",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    ✅ Reactivate Student Account
                  </button>
                )}
              </div>
            </div>
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
