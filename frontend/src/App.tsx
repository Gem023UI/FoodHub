import { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { LandingPage } from "./pages/LandingPage";
import { Profile } from "./pages/Profile";
import { VendorStallPage } from "./pages/VendorStall";
import { Stalls } from "./pages/Stalls";
import Trends from "./pages/Trends";
import { AboutUs } from "./pages/AboutUs";
import { Cart } from "./pages/Cart";
import { Preorder } from "./pages/Preorder";
import { Product } from "./pages/Product";
import { VendorOrders } from "./pages/VendorOrders";
import { VendorRevenue } from "./pages/VendorRevenue";
import { VendorProfile } from "./pages/VendorProfile";
import { VendorProducts } from "./pages/VendorProducts";
import Loader from "./components/Loader";
import "./styles.css";

type AppView = 
  | "home" 
  | "login" 
  | "profile" 
  | "vendor-profile"
  | "vendor-stall"
  | "vendor-orders"
  | "vendor-revenue"
  | "stalls"
  | "trends"
  | "about"
  | "cart"
  | "preorder"
  | "product"
  | "stall"
  | `product/${string}`;

function App() {
  const [view, setView] = useState<AppView>("home");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const [vendorStallId, setVendorStallId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [preorderData, setPreorderData] = useState<any>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [stallId, setStallId] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("userName");
    const storedPic = localStorage.getItem("userProfilePic");
    const storedStallId = localStorage.getItem("vendorStallId");

    // Load cart count
    updateCartCount();

    if (storedToken && storedUserId && storedRole) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);
      setUserName(storedName);
      setUserProfilePic(storedPic);
      setVendorStallId(storedStallId);
      
      if (storedRole === "vendor") {
        setView("vendor-stall");
      } else {
        setView("home");
      }
    } else {
      setView("home");
    }
    setIsLoading(false);
  }, []);

  // Update cart count whenever localStorage changes
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const handleLogin = (
    newToken: string,
    newUserId: string,
    newRole: string,
    newName?: string,
    newProfilePic?: string | null,
    stallId?: string
  ) => {
    setToken(newToken);
    setUserId(newUserId);
    setRole(newRole);
    setUserName(newName ?? null);
    setUserProfilePic(newProfilePic ?? null);
    setVendorStallId(stallId ?? null);
    
    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("role", newRole);
    if (newName) localStorage.setItem("userName", newName);
    if (newProfilePic) localStorage.setItem("userProfilePic", newProfilePic);
    if (stallId) localStorage.setItem("vendorStallId", stallId);
    
    if (newRole === "vendor") {
      setView("vendor-stall");
    } else {
      setView("home");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userProfilePic");
    localStorage.removeItem("vendorStallId");
    setToken(null);
    setUserId(null);
    setRole(null);
    setUserName(null);
    setUserProfilePic(null);
    setVendorStallId(null);
    setView("home");
  };

  const handleProfileUpdate = (name: string, profilePicUrl: string | null) => {
    setUserName(name);
    setUserProfilePic(profilePicUrl);
    localStorage.setItem("userName", name);
    if (profilePicUrl) {
      localStorage.setItem("userProfilePic", profilePicUrl);
    } else {
      localStorage.removeItem("userProfilePic");
    }
  };

  const handleNavigate = (page: string, data?: any) => {
    // Handle product navigation with ID
    if (page.startsWith("product/")) {
      const id = page.split("/")[1];
      setProductId(id);
      setView("product");
      return;
    }
    
    // Handle stall navigation with ID
    if (page.startsWith("stall/")) {
      const id = page.split("/")[1];
      setStallId(id);
      setView("stalls");
      return;
    }
    
    if (page === "preorder" && data) {
      setPreorderData(data);
    }
    setView(page as AppView);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === "home" && (
        <LandingPage 
          onNavigate={handleNavigate} 
          token={token} 
          onLogout={handleLogout}
        />
      )}

      {view === "login" && (
        <Login
          onLogin={handleLogin}
          onNavigate={handleNavigate}
        />
      )}

      {view === "profile" && token && userId && role && (
        <Profile
          token={token}
          userId={userId}
          role={role}
          onNavigate={handleNavigate}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {view === "stalls" && (
        <Stalls 
          token={token ?? undefined} 
          onNavigate={handleNavigate}
          stallId={stallId || undefined}
        />
      )}

      {view === "trends" && (
        <Trends 
          token={token ?? undefined} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          onBack={() => handleNavigate("home")} 
        />
      )}

      {view === "about" && (
        <AboutUs 
          onNavigate={handleNavigate} 
          token={token} 
          onLogout={handleLogout}
        />
      )}

      {view === "cart" && token && (
        <Cart
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "preorder" && token && (
        <Preorder
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          preorderData={preorderData}
        />
      )}

      {view === "product" && token && productId && (
        <Product
          token={token}
          productId={productId}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "vendor-stall" && token && (
        <VendorStallPage
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "vendor-products" && token && (
        <VendorProducts
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "vendor-orders" && token && (
        <VendorOrders
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "vendor-revenue" && token && (
        <VendorRevenue
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "vendor-profile" && token && userId && (
        <VendorProfile
          token={token}
          userId={userId}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

export default App;