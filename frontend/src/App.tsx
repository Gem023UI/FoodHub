import { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { StallPicker } from "./pages/StallPicker";
import { Menu } from "./components/Menu";
import { Header } from "./components/Header";
import { HomePage } from "./pages/LandingPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { VendorDashboard } from "./pages/VendorDashboard";
import { Profile } from "./pages/Profile";
import { AboutUs } from "./pages/AboutUs";
import Trends from "./pages/Trends";
import { OrdersList } from "./pages/OrdersList";

import "./styles/LandingPage.css";

type AppView = "home" | "login" | "stall-picker" | "menu" | "admin" | "vendor" | "profile" | "about" | "trends" | "orders";

function App() {
const [view, setView] = useState<AppView>("home");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedStallName, setSelectedStallName] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<AppView>("stall-picker");

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("userName");
    const storedPic = localStorage.getItem("userProfilePic");

    if (storedToken && storedUserId && storedRole) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);
      setUserName(storedName);
      setUserProfilePic(storedPic);
      if (storedRole === "admin") {
        setView("admin");
      } else if (storedRole === "vendor") {
        setView("vendor");
      } else {
        setView("home");
      }
    }
  }, []);

  const handleLogin = (newToken: string, newUserId: string, newRole: string, newName?: string, newProfilePic?: string | null) => {
    setToken(newToken);
    setUserId(newUserId);
    setRole(newRole);
    setUserName(newName ?? null);
    setUserProfilePic(newProfilePic ?? null);
    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("role", newRole);
    if (newName) localStorage.setItem("userName", newName);
    if (newProfilePic) localStorage.setItem("userProfilePic", newProfilePic);
    if (newRole === "admin") {
      setView("admin");
    } else if (newRole === "vendor") {
      setView("vendor");
    } else {
      setView("home");
    }
  };

  const handleSelectStall = (stallId: string, stallName: string) => {
    setSelectedStallId(stallId);
    setSelectedStallName(stallName);
    setView("menu");
  };

  const handleBackToStallPicker = () => {
    setSelectedStallId(null);
    setSelectedStallName(null);
    setView("stall-picker");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userProfilePic");
    setToken(null);
    setUserId(null);
    setRole(null);
    setUserName(null);
    setUserProfilePic(null);
    setView("login");
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

  const handleNavigate = (newView: string) => {
    setPreviousView(view);
    if (newView === "stalls") {
      setView("stall-picker");
    } else {
      setView(newView as AppView);
    }
  };

  const handleBackToPrevious = () => {
    setView(previousView);
  };

  return (
    <div className="app-container">
      {view === "home" && (
        <HomePage onNavigate={(p) => handleNavigate(p as AppView)} token={token} />
      )}
      {view === "login" && (
        <Login
          onLogin={handleLogin}
          onNavigate={handleNavigate}
          onBackToHome={() => setView("home")}
        />
      )}


      {view === "stall-picker" && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <StallPicker token={token ?? undefined} onSelectStall={handleSelectStall} />
          </main>
        </div>
      )}

      {view === "menu" && selectedStallId && selectedStallName && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <Menu
              token={token ?? undefined}
              stallId={selectedStallId}
              stallName={selectedStallName}
              onBack={handleBackToStallPicker}
              onRequireLogin={() => setView("login")}
            />
          </main>
        </div>
      )}

      {view === "admin" && token && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <AdminDashboard token={token} />
          </main>
        </div>
      )}

      {view === "vendor" && token && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <VendorDashboard token={token} />
          </main>
        </div>
      )}

      {view === "profile" && token && userId && role && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <Profile token={token} userId={userId} role={role} onBack={handleBackToPrevious} onProfileUpdate={handleProfileUpdate} />
          </main>
        </div>
      )}

      {view === "orders" && token && userId && role && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <OrdersList token={token} userId={userId} role={role} onBack={handleBackToPrevious} />
          </main>
        </div>
      )}

      {view === "about" && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <AboutUs />
          </main>
        </div>
      )}

      {view === "trends" && (
        <div className="app-with-header">
          <Header onNavigate={handleNavigate} token={token} />
          <main className="app-main">
            <Trends token={token ?? undefined} onBack={handleBackToPrevious} />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;