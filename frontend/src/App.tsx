import { useState, useEffect } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Stalls } from "./pages/Stalls";
import { Product } from "./pages/Product";
import { Cart } from "./pages/Cart";
import { Preorder } from "./pages/PreOrder";
import { Profile } from "./pages/Profile";
import { AboutUs } from "./pages/AboutUs";
import Trends from "./pages/Trends";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminStalls } from "./pages/AdminStalls";
import { AdminVendors } from "./pages/AdminVendors";
import { AdminStudents } from "./pages/AdminStudents";
import { VendorStallPage } from "./pages/VendorStall";
import { VendorProducts } from "./pages/VendorProducts";
import { VendorOrders } from "./pages/VendorOrders";
import { VendorRevenue } from "./pages/VendorRevenue";
import { VendorProfile } from "./pages/VendorProfile";
import "./styles.css";

type Page = 
  | "home" 
  | "login" 
  | "stalls" 
  | `stall/${string}` 
  | `product/${string}` 
  | "cart" 
  | "preorder" 
  | "profile" 
  | "about" 
  | "trends"
  | "admin" 
  | "admin-stalls" 
  | "admin-vendors" 
  | "admin-students"
  | "vendor-stall" 
  | "vendor-products" 
  | "vendor-orders" 
  | "vendor-revenue" 
  | "vendor-profile";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [pageParams, setPageParams] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserId = localStorage.getItem("userId");
    const savedRole = localStorage.getItem("userRole");

    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      setUserRole(savedRole);
    }

    updateCartCount();
  }, []);

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
      // Store cart count for header
      localStorage.setItem("cartCount", String(count));
    } catch {
      localStorage.setItem("cartCount", "0");
    }
  };

  const handleLogin = (
    token: string,
    userId: string,
    role: string,
    name?: string,
    profilePictureUrl?: string | null,
    stallId?: string
  ) => {
    setToken(token);
    setUserId(userId);
    setUserRole(role);

    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userRole", role);
    if (name) localStorage.setItem("userName", name);
    if (profilePictureUrl) localStorage.setItem("userProfilePic", profilePictureUrl);
    if (stallId) localStorage.setItem("userStallId", stallId);

    if (role === "admin") {
      setCurrentPage("admin");
    } else if (role === "vendor") {
      setCurrentPage("vendor-stall");
    } else {
      setCurrentPage("home");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setUserRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userProfilePic");
    localStorage.removeItem("userStallId");
    localStorage.removeItem("cartCount");
    setCurrentPage("home");
  };

  const navigate = (page: string, params?: any) => {
    if (page === "login" && token) {
      if (userRole === "admin") {
        setCurrentPage("admin");
      } else if (userRole === "vendor") {
        setCurrentPage("vendor-stall");
      } else {
        setCurrentPage("home");
      }
      return;
    }

    setCurrentPage(page as Page);
    setPageParams(params || null);
    
    if (page === "cart" || page === "preorder") {
      updateCartCount();
    }
  };

  // Helper to ensure token is defined for protected routes
  const getToken = (): string | undefined => token || undefined;
  const getUserId = (): string | undefined => userId || undefined;

  const renderPage = () => {
    const commonProps = {
      token: getToken(),
      onNavigate: navigate,
      onLogout: handleLogout,
    };

    // Protected routes that require token
    if (currentPage === "cart" || currentPage === "preorder" || currentPage === "profile") {
      if (!token) return <Login onLogin={handleLogin} onNavigate={navigate} />;
    }

    // Admin routes
    if (["admin", "admin-stalls", "admin-vendors", "admin-students"].includes(currentPage)) {
      if (!token || userRole !== "admin") return <Login onLogin={handleLogin} onNavigate={navigate} />;
    }

    // Vendor routes
    if (["vendor-stall", "vendor-products", "vendor-orders", "vendor-revenue", "vendor-profile"].includes(currentPage)) {
      if (!token || userRole !== "vendor") return <Login onLogin={handleLogin} onNavigate={navigate} />;
    }

    switch (currentPage) {
      case "home":
        return <LandingPage {...commonProps} />;
      case "login":
        return <Login onLogin={handleLogin} onNavigate={navigate} />;
      case "stalls":
        return <Stalls {...commonProps} />;
      case "cart":
        return <Cart {...commonProps} token={token!} />;
      case "preorder":
        return <Preorder {...commonProps} token={token!} preorderData={pageParams} />;
      case "profile":
        return <Profile {...commonProps} token={token!} userId={userId!} />;
      case "about":
        return <AboutUs {...commonProps} />;
      case "trends":
        return <Trends {...commonProps} onBack={() => navigate("home")} />;
      case "admin":
        return <AdminDashboard {...commonProps} token={token!} />;
      case "admin-stalls":
        return <AdminStalls {...commonProps} token={token!} />;
      case "admin-vendors":
        return <AdminVendors {...commonProps} token={token!} />;
      case "admin-students":
        return <AdminStudents {...commonProps} token={token!} />;
      case "vendor-stall":
        return <VendorStallPage {...commonProps} token={token!} />;
      case "vendor-products":
        return <VendorProducts {...commonProps} token={token!} />;
      case "vendor-orders":
        return <VendorOrders {...commonProps} token={token!} />;
      case "vendor-revenue":
        return <VendorRevenue {...commonProps} token={token!} />;
      case "vendor-profile":
        return <VendorProfile {...commonProps} token={token!} userId={userId!} />;
      default:
        if (currentPage.startsWith("product/")) {
          const productId = currentPage.split("/")[1];
          return <Product {...commonProps} productId={productId} />;
        }
        if (currentPage.startsWith("stall/")) {
          const stallId = currentPage.split("/")[1];
          return <Stalls {...commonProps} stallId={stallId} />;
        }
        return <LandingPage {...commonProps} />;
    }
  };

  return renderPage();
}