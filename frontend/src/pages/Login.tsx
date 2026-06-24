import { useState } from "react";
import { Header } from "../components/Header";
import tupLogo from "../../images/Logo.png";
import "../styles/login.css";

// TUP Taguig courses
const TUP_COURSES = [
  "BS in Computer Science",
  "BS in Information Technology",
  "BS in Electronics Engineering",
  "BS in Electrical Engineering",
  "BS in Mechanical Engineering",
  "BS in Civil Engineering",
  "BS in Industrial Engineering",
  "BS in Architecture",
  "BS in Accountancy",
  "BS in Business Administration",
  "BS in Hospitality Management",
  "BS in Tourism Management",
  "BS in Entrepreneurship",
  "BS in Office Administration",
  "Associate in Computer Technology",
  "Associate in Electrical Technology",
  "Associate in Mechanical Technology",
];

interface LoginProps {
  onLogin: (
    token: string,
    userId: string,
    role: string,
    name?: string,
    profilePictureUrl?: string | null
  ) => void;
  onNavigate?: (page: string) => void;
  onBackToHome?: () => void;
}

type AuthMode = "login" | "register";
type RegisterRole = "student" | "vendor";
type VerifyState = "idle" | "pending" | "verified";

export function Login({ onLogin, onNavigate, onBackToHome }: LoginProps) {
  // ── mode ──
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerRole, setRegisterRole] = useState<RegisterRole>("student");

  // ── shared fields ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── login only ──
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── student fields ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [tuptId, setTuptId] = useState("");
  const [course, setCourse] = useState("");
  const [section, setSection] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // ── vendor fields ──
  const [vFirstName, setVFirstName] = useState("");
  const [vLastName, setVLastName] = useState("");
  const [vContactNumber, setVContactNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  // ── email verification ──
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyInput, setVerifyInput] = useState("");

  function resetForms() {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFirstName("");
    setLastName("");
    setBirthday("");
    setTuptId("");
    setCourse("");
    setSection("");
    setContactNumber("");
    setVFirstName("");
    setVLastName("");
    setVContactNumber("");
    setProofFile(null);
    setError(null);
    setSuccessMsg(null);
    setVerifyState("idle");
    setVerifyCode("");
    setVerifyInput("");
  }

  function switchMode(m: AuthMode) {
    resetForms();
    setMode(m);
  }

  function getNetworkError(): string {
    return "Cannot reach the server. Make sure the backend is running on port 3000.";
  }

  // ── LOGIN ──
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
      const data = await response.json() as {
        accessToken?: string;
        token?: string;
        message?: string;
        user?: {
          id?: string;
          _id?: string;
          role?: string;
          name?: string;
          profilePictureUrl?: string | null;
        };
      };
      if (!response.ok) throw new Error(data.message ?? "Login failed");
      const token = data.accessToken ?? data.token;
      const userId = data.user?.id ?? data.user?._id;
      const role = data.user?.role;
      if (!token || !userId || !role) throw new Error("Invalid response from server");
      onLogin(token, userId, role, data.user?.name, data.user?.profilePictureUrl);
    } catch (err) {
      setError(err instanceof TypeError ? getNetworkError() : (err instanceof Error ? err.message : "Login failed"));
    } finally {
      setIsLoading(false);
    }
  }

  // ── REGISTER — send OTP ──
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate TUPT-ID format for students
    if (registerRole === "student") {
      const tuptPattern = /^TUPT-\d{2}-\d{4}$/i;
      if (!tuptPattern.test(tuptId)) {
        setError("TUPT ID must follow the format TUPT-XX-XXXX (e.g. TUPT-21-1234).");
        setIsLoading(false);
        return;
      }
    }

    try {
      let profilePictureUrl: string | undefined;

      // Upload proof of legitimacy to Cloudinary for vendors
      if (registerRole === "vendor" && proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        formData.append("upload_preset", "foodhub_unsigned"); // adjust preset name
        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload proof of legitimacy.");
        const uploadData = await uploadRes.json() as { secure_url: string };
        profilePictureUrl = uploadData.secure_url;
      }

      const body = registerRole === "student"
        ? {
            firstName,
            lastName,
            birthday,
            email,
            tuptId: tuptId.toUpperCase(),
            course,
            section,
            contactNumber,
            password,
            role: "student",
          }
        : {
            firstName: vFirstName,
            lastName: vLastName,
            email,
            password,
            contactNumber: vContactNumber,
            proofOfLegitimacyUrl: profilePictureUrl,
            role: "vendor",
          };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Registration failed");

      // Simulate OTP generation (replace with real code from backend response)
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      setVerifyCode(mockCode);
      setVerifyState("pending");
    } catch (err) {
      setError(err instanceof TypeError ? getNetworkError() : (err instanceof Error ? err.message : "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  }

  // ── VERIFY EMAIL ──
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (verifyInput.trim() !== verifyCode) {
      setError("Incorrect verification code. Please check your email and try again.");
      return;
    }
    setIsLoading(true);
    try {
      // Call backend to mark email as verified
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyInput.trim() }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Verification failed");
      setVerifyState("verified");
      setSuccessMsg("Email verified! Your account is now active. Please log in.");
      setTimeout(() => switchMode("login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  }

  const handleNav = onNavigate ?? onBackToHome
    ? (page: string) => {
        if (page === "home" && onBackToHome) onBackToHome();
        else onNavigate?.(page);
      }
    : () => {};

  return (
    <div className="auth-page">
      {/* Shared header */}
      <Header onNavigate={handleNav} />

      <div className="auth-content">
        <div className="auth-card">
          {/* Brand */}
          <div className="auth-card-brand">
            <img src={tupLogo} alt="FoodHub" className="auth-card-logo" />
            <span className="auth-card-brand-name">FoodHub</span>
          </div>

          <h1 className="auth-title">
            {mode === "login" ? "Welcome back!" : "Create an account"}
          </h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in to order your favourite canteen meals."
              : "Join FoodHub and start ordering in minutes."}
          </p>

          {/* Login / Register tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>

          {/* ─── ALERTS ─── */}
          {error && (
            <div className="auth-alert error" style={{ marginBottom: 14 }}>
              <i className="fas fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="auth-alert success" style={{ marginBottom: 14 }}>
              <i className="fas fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════
              LOGIN FORM
          ══════════════════════════════════ */}
          {mode === "login" && (
            <form className="auth-form" onSubmit={handleLogin}>
              {/* Email */}
              <div className="auth-field">
                <label>Email address</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-envelope field-icon"></i>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-lock field-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? "Signing in…" : "Login"}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════
              REGISTER FORM
          ══════════════════════════════════ */}
          {mode === "register" && verifyState === "idle" && (
            <form className="auth-form" onSubmit={handleRegister}>
              {/* Role selector */}
              <div className="auth-role-selector">
                <button
                  type="button"
                  className={`auth-role-btn ${registerRole === "student" ? "selected" : ""}`}
                  onClick={() => setRegisterRole("student")}
                >
                  <i className="fas fa-graduation-cap"></i>
                  Student
                </button>
                <button
                  type="button"
                  className={`auth-role-btn ${registerRole === "vendor" ? "selected" : ""}`}
                  onClick={() => setRegisterRole("vendor")}
                >
                  <i className="fas fa-store"></i>
                  Vendor
                </button>
              </div>

              {/* ── STUDENT FIELDS ── */}
              {registerRole === "student" && (
                <>
                  <div className="auth-section-label">Personal info</div>

                  <div className="auth-field-row">
                    <div className="auth-field">
                      <label>First name</label>
                      <div className="auth-input-wrap">
                        <i className="fas fa-user field-icon"></i>
                        <input
                          type="text"
                          placeholder="Juan"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="auth-field">
                      <label>Last name</label>
                      <div className="auth-input-wrap">
                        <i className="fas fa-user field-icon"></i>
                        <input
                          type="text"
                          placeholder="dela Cruz"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Birthday</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-calendar field-icon"></i>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-section-label">Academic info</div>

                  <div className="auth-field">
                    <label>TUPT ID</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-id-card field-icon"></i>
                      <input
                        type="text"
                        placeholder="TUPT-21-1234"
                        value={tuptId}
                        onChange={(e) => setTuptId(e.target.value)}
                        disabled={isLoading}
                        required
                        pattern="TUPT-\d{2}-\d{4}"
                        title="Format: TUPT-XX-XXXX"
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Course</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-book field-icon"></i>
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        disabled={isLoading}
                        required
                      >
                        <option value="">Select course…</option>
                        {TUP_COURSES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Section</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-users field-icon"></i>
                      <input
                        type="text"
                        placeholder="e.g. 3A"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-section-label">Contact & access</div>

                  <div className="auth-field">
                    <label>Contact number</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-phone field-icon"></i>
                      <input
                        type="tel"
                        placeholder="09XXXXXXXXX"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Email address</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-envelope field-icon"></i>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Password</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-lock field-icon"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── VENDOR FIELDS ── */}
              {registerRole === "vendor" && (
                <>
                  <div className="auth-section-label">Personal info</div>

                  <div className="auth-field-row">
                    <div className="auth-field">
                      <label>First name</label>
                      <div className="auth-input-wrap">
                        <i className="fas fa-user field-icon"></i>
                        <input
                          type="text"
                          placeholder="Maria"
                          value={vFirstName}
                          onChange={(e) => setVFirstName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="auth-field">
                      <label>Last name</label>
                      <div className="auth-input-wrap">
                        <i className="fas fa-user field-icon"></i>
                        <input
                          type="text"
                          placeholder="Santos"
                          value={vLastName}
                          onChange={(e) => setVLastName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Contact number</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-phone field-icon"></i>
                      <input
                        type="tel"
                        placeholder="09XXXXXXXXX"
                        value={vContactNumber}
                        onChange={(e) => setVContactNumber(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-section-label">Business verification</div>

                  <div className="auth-field">
                    <label>Proof of legitimacy (photo)</label>
                    <label className="auth-file-label">
                      <i className="fas fa-cloud-arrow-up"></i>
                      <span>{proofFile ? "Change photo" : "Upload business permit / ID"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                        disabled={isLoading}
                        required
                      />
                    </label>
                    {proofFile && (
                      <span className="auth-file-name">
                        <i className="fas fa-image" style={{ marginRight: 4 }}></i>
                        {proofFile.name}
                      </span>
                    )}
                  </div>

                  <div className="auth-section-label">Contact & access</div>

                  <div className="auth-field">
                    <label>Email address</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-envelope field-icon"></i>
                      <input
                        type="email"
                        placeholder="stall@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Password</label>
                    <div className="auth-input-wrap">
                      <i className="fas fa-lock field-icon"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? "Registering…" : "Create Account"}
              </button>
            </form>
          )}

          {/* ── EMAIL VERIFICATION ── */}
          {mode === "register" && verifyState === "pending" && (
            <form className="auth-form" onSubmit={handleVerify}>
              <div className="auth-verify-notice">
                <i className="fas fa-envelope-open-text"></i>
                <p>
                  A 6-digit verification code has been sent to{" "}
                  <strong>{email}</strong>. Enter it below to activate your account.
                </p>
              </div>

              <div className="auth-field">
                <label>Verification code</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-key field-icon"></i>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    maxLength={6}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* DEV ONLY: show mock code for testing. Remove in production. */}
              {import.meta.env.DEV && (
                <p style={{ fontSize: 11, color: "#a6a6a6", textAlign: "center" }}>
                  [DEV] Mock code: <strong>{verifyCode}</strong>
                </p>
              )}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? "Verifying…" : "Verify Email"}
              </button>
            </form>
          )}

          {/* ── FOOTER ── */}
          <div className="auth-footer-links">
            {onBackToHome && (
              <button type="button" className="auth-text-btn guest" onClick={onBackToHome}>
                ← Browse as Guest
              </button>
            )}
            <p className="auth-support">Need help? Email admin@tup.edu.ph</p>
          </div>
        </div>
      </div>
    </div>
  );
}