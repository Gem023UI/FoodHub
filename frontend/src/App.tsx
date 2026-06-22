import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { StallPicker } from "./components/StallPicker";
import { Menu } from "./components/Menu";
import { AdminDashboard } from "./components/AdminDashboard";
import { VendorDashboard } from "./components/VendorDashboard";
import { Profile } from "./components/Profile";
import { AboutUs } from "./components/AboutUs";
import Trends from "./components/Trends";
import { OrdersList } from "./components/OrdersList";

type AppView = "login" | "stall-picker" | "menu" | "admin" | "vendor" | "profile" | "about" | "trends" | "orders";

function App() {
  const [view, setView] = useState<AppView>("stall-picker");
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
        setView("stall-picker");
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
      setView("stall-picker");
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

  const handleNavigate = (newView: AppView) => {
    setPreviousView(view);
    setView(newView);
  };

  const handleBackToPrevious = () => {
    setView(previousView);
  };

  const appHeader = (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <img src="/images/TUP logo.png" alt="TUP Logo" className="brand-logo" />
          <div className="brand-title">
            <span className="brand-subtitle">TUP</span>
            <h2>FoodHub</h2>
          </div>
        </div>

        <nav className="app-nav" aria-label="Primary navigation">
          <button className="nav-link" onClick={() => handleNavigate("stall-picker")}>
            Home
          </button>
          <button className="nav-link" onClick={() => handleNavigate("trends")}>
            Trends
          </button>
          {token && role === "user" && (
            <button className="nav-link" onClick={() => handleNavigate("orders")}>
              My Orders
            </button>
          )}
          <button className="nav-link" onClick={() => handleNavigate("about")}>
            About
          </button>
        </nav>

        <div className="header-actions">
          {token ? (
            <>
              <button className="header-profile-trigger" type="button" onClick={() => handleNavigate("profile")}>
                <div
                  className="header-avatar"
                  style={{
                    backgroundImage: userProfilePic
                      ? `url(${userProfilePic})`
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  {!userProfilePic && (
                    <span>{(userName ?? "U").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="header-user-name">{userName ?? "Profile"}</span>
              </button>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="logout-button" onClick={() => handleNavigate("login")} style={{ background: "#008080" }}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <div className="app-container">
      {view === "login" && (
          <Login 
            onLogin={handleLogin} 
            onBackToHome={() => setView("stall-picker")} 
          />
      )}


      {view === "stall-picker" && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <StallPicker token={token ?? undefined} onSelectStall={handleSelectStall} />
          </main>
        </div>
      )}

      {view === "menu" && selectedStallId && selectedStallName && (
        <div className="app-with-header">
          {appHeader}
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
          {appHeader}
          <main className="app-main">
            <AdminDashboard token={token} />
          </main>
        </div>
      )}

      {view === "vendor" && token && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <VendorDashboard token={token} />
          </main>
        </div>
      )}

      {view === "profile" && token && userId && role && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <Profile token={token} userId={userId} role={role} onBack={handleBackToPrevious} onProfileUpdate={handleProfileUpdate} />
          </main>
        </div>
      )}

      {view === "orders" && token && userId && role && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <OrdersList token={token} userId={userId} role={role} onBack={handleBackToPrevious} />
          </main>
        </div>
      )}

      {view === "about" && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <AboutUs />
          </main>
        </div>
      )}

      {view === "trends" && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <Trends token={token ?? undefined} onBack={handleBackToPrevious} />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;