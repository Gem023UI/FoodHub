import { useState, useEffect } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Stalls } from "./pages/StallsMap";
import { Product } from "./pages/Product";
import { Cart } from "./pages/Cart";
import Preorder from "./pages/PreOrder";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminStalls } from "./pages/AdminStalls";
import { AdminVendors } from "./pages/AdminVendors";
import { AdminStudents } from "./pages/AdminStudents";
import { AdminProfile } from "./pages/AdminProfile";
import { VendorStallPage } from "./pages/VendorStall";
import { Stall } from "./pages/Stalls";
import { VendorProducts } from "./pages/VendorProducts";
import { VendorOrders } from "./pages/VendorOrders";
import { VendorRevenue } from "./pages/VendorRevenue";
import { VendorProfile } from "./pages/VendorProfile";
import { AboutUs } from "./pages/AboutUs";
import Trends from "./pages/Trends";
import { Header } from "./components/Header";
import { AdminHeader } from "./components/AdminHeader";
import { VendorHeader } from "./components/VendorHeader";

type UserRole = "student" | "vendor" | "admin" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePictureUrl?: string | null;
  stallId?: string;
  stallName?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageData, setPageData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken) {
      setToken(savedToken);
    }
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum: number, item: any) => sum + (item.isChecked !== false ? item.quantity : 0), 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    
    const interval = setInterval(updateCartCount, 2000);
    
    return () => {
      window.removeEventListener("storage", updateCartCount);
      clearInterval(interval);
    };
  }, []);

  // Handle login
  const handleLogin = (
    token: string,
    userId: string,
    role: string,
    name?: string,
    profilePictureUrl?: string | null,
    stallId?: string,
    stallName?: string
  ) => {
    localStorage.setItem("token", token);
    setToken(token);

    const userData: User = {
      id: userId,
      name: name || "User",
      email: "",
      role: role as UserRole,
      profilePictureUrl: profilePictureUrl || null,
      stallId: stallId,
      stallName: stallName,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    if (role === "admin") {
      navigateTo("admin");
    } else if (role === "vendor") {
      navigateTo("vendor-stall");
    } else {
      navigateTo("home");
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigateTo("home");
  };

  // Navigation function
  const navigateTo = (page: string, data?: any) => {
    setCurrentPage(page);
    setPageData(data || null);
    window.scrollTo(0, 0);
  };

  // Get the current user's role
  const getCurrentRole = (): UserRole => {
    return user?.role || null;
  };

  // Render the appropriate header based on role
  const renderHeader = () => {
    const role = getCurrentRole();
    const isAdminPage = currentPage.startsWith("admin");
    const isVendorPage = currentPage.startsWith("vendor");

    // If it's an admin page or user role is admin, use AdminHeader
    if (isAdminPage || role === "admin") {
      return (
        <AdminHeader
          onNavigate={navigateTo}
          token={token}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      );
    }

    // If it's a vendor page or user role is vendor, use VendorHeader
    if (isVendorPage || role === "vendor") {
      return (
        <VendorHeader
          onNavigate={navigateTo}
          token={token}
          stallName={user?.stallName}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      );
    }

    // Default to regular Header for students and guests
    return (
      <Header
        onNavigate={navigateTo}
        token={token}
        onLogout={handleLogout}
        cartCount={cartCount}
        currentPage={currentPage}
      />
    );
  };

  // Render the appropriate page (WITHOUT headers inside pages)
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <LandingPage onNavigate={navigateTo} token={token} onLogout={handleLogout} />;
      case "login":
        return <Login onLogin={handleLogin} onNavigate={navigateTo} />;
      case "stalls":
         return <Stalls token={token || undefined} onNavigate={navigateTo} stallId={pageData?.stallId} />;
       case "stall":
         return <Stall stallId={pageData} token={token || undefined} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "product":
        return <Product token={token || undefined} productId={pageData} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "cart":
        return <Cart token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "preorder":
        return <Preorder token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} preorderData={pageData} />;
      case "profile":
        return <Profile token={token || ""} userId={user?.id || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "about":
        return <AboutUs onNavigate={navigateTo} token={token} onLogout={handleLogout} />;
      case "trends":
        return <Trends token={token || undefined} onNavigate={navigateTo} onLogout={handleLogout} onBack={() => navigateTo("home")} />;
      
      // Admin Pages
      case "admin":
        return <AdminDashboard token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "admin-stalls":
        return <AdminStalls token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "admin-vendors":
        return <AdminVendors token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "admin-students":
        return <AdminStudents token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "admin-profile":
        return <AdminProfile token={token || ""} userId={user?.id || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      
      // Vendor Pages
      case "vendor-stall":
        return <VendorStallPage token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "vendor-products":
        return <VendorProducts token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "vendor-orders":
        return <VendorOrders token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "vendor-revenue":
        return <VendorRevenue token={token || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      case "vendor-profile":
        return <VendorProfile token={token || ""} userId={user?.id || ""} onNavigate={navigateTo} onLogout={handleLogout} />;
      
      default:
        return <LandingPage onNavigate={navigateTo} token={token} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="app">
      {/* Header rendered here ONCE based on role */}
      {renderHeader()}
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;