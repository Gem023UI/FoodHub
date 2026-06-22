import { useState } from "react";

interface LoginProps {
  onLogin: (token: string, userId: string, role: string, name?: string, profilePictureUrl?: string | null) => void;
  onBackToHome?: () => void;
}

export function Login({ onLogin, onBackToHome }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"user" | "vendor">("user");
  const [studentId, setStudentId] = useState("");
  const [courseSection, setCourseSection] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  function getNetworkErrorMessage(): string {
    return "Cannot reach the server. Start the backend with npm run dev in the project root (port 3000).";
  }

  async function parseAuthResponse(response: Response): Promise<{ token: string; userId: string; role: string; name?: string; profilePictureUrl?: string | null }> {
    const data = await response.json() as {
      accessToken?: string;
      token?: string;
      message?: string;
      user?: { id?: string; _id?: string; role?: string; name?: string; profilePictureUrl?: string | null };
    };

    if (!response.ok) {
      throw new Error(data.message ?? "Request failed");
    }

    const token = data.accessToken ?? data.token;
    const userId = data.user?.id ?? data.user?._id;
    const role = data.user?.role;

    if (!token || !userId || !role) {
      throw new Error("Invalid response from server");
    }

    return { token, userId, role, name: data.user?.name, profilePictureUrl: data.user?.profilePictureUrl };
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const { token, userId, role, name, profilePictureUrl } = await parseAuthResponse(response);
      onLogin(token, userId, role, name, profilePictureUrl);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(getNetworkErrorMessage());
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: userType,
          studentId: userType === "user" ? studentId : undefined,
          courseSection: userType === "user" ? courseSection : undefined,
          schoolEmail: userType === "user" ? schoolEmail : undefined,
          contactNumber: contactNumber || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message ?? "Registration failed");
      }

      setSuccessMsg("Registration successful! Please log in below.");
      setShowRegister(false);
      setPassword("");
      setName("");
      setStudentId("");
      setCourseSection("");
      setSchoolEmail("");
      setContactNumber("");
    } catch (err) {
      if (err instanceof TypeError) {
        setError(getNetworkErrorMessage());
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/images/TUP logo.png" alt="TUP Logo" className="logo-img" />
        </div>

        <h1 className="login-title">{showRegister ? "Create Account" : "Welcome!"}</h1>

        <form onSubmit={showRegister ? handleRegister : handleLogin} className="login-form">
          {showRegister && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {showRegister && (
            <div className="form-group register-type">
              <label>Account Type:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="userType"
                    value="user"
                    checked={userType === "user"}
                    onChange={(e) => setUserType(e.target.value as "user")}
                    disabled={isLoading}
                  />
                  <span>User (Food Buyer)</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="userType"
                    value="vendor"
                    checked={userType === "vendor"}
                    onChange={(e) => setUserType(e.target.value as "vendor")}
                    disabled={isLoading}
                  />
                  <span>Vendor (Food Stall)</span>
                </label>
              </div>
            </div>
          )}

          {showRegister && userType === "user" && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Student ID (e.g. TUPM-21-1234)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Course & Section (e.g. BSCS-3A)"
                  value={courseSection}
                  onChange={(e) => setCourseSection(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="School Email (e.g. student@tup.edu.ph)"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Contact Number (e.g. 09123456789)"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </>
          )}

          {showRegister && userType === "vendor" && (
            <div className="form-group">
              <input
                type="tel"
                placeholder="Contact Number (e.g. 09123456789)"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success" style={{ margin: "0 0 16px 0", width: "100%", boxSizing: "border-box" }}>
              {successMsg}
            </div>
          )}
          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Loading..." : showRegister ? "Register" : "Login"}
          </button>
        </form>

        <div className="login-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setShowRegister(!showRegister);
              setError(null);
              setSuccessMsg(null);
            }}
          >
            {showRegister ? "Already have an account? Login" : "Need an account? Register"}
          </button>
          
          {onBackToHome && (
            <button
              type="button"
              className="link-button"
              onClick={onBackToHome}
              style={{ color: "#008080", fontWeight: "bold", marginTop: "4px" }}
            >
              ← Browse as Guest
            </button>
          )}
        </div>

        <p className="support-text">For support email to admin@tup.edu.np</p>
      </div>
    </div>
  );
}
