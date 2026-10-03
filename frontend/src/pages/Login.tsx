import { useState } from "react";
import { Footer } from "../components/Footer";
import { loginUser, registerStudent, verifyEmail, resendVerification } from "../services/auth.service";
import tupLogo from "../../images/Logo.png";
import "../styles/Login.css";

// TUP Taguig courses - matching backend enum values
const TUP_COURSES = [
  "BSIT",
  "BSCS", 
  "BSIS",
  "BSBA",
  "BSHM",
  "BSEd",
  "BEED",
  "BSN",
  "BSPSYCH",
  "BSCRIM",
  "BSECE",
  "BSEE",
  "BSME",
  "BSCE",
  "BSIE",
  "BSArch",
  "BSA",
  "BSTM",
  "BSEntrep",
  "BSOA",
  "ACT",
  "AET",
  "AMT"
];

// Course name mapping for display
const COURSE_DISPLAY_NAMES: Record<string, string> = {
  "BSIT": "BS in Information Technology",
  "BSCS": "BS in Computer Science",
  "BSIS": "BS in Information Systems",
  "BSBA": "BS in Business Administration",
  "BSHM": "BS in Hospitality Management",
  "BSEd": "BS in Education",
  "BEED": "Bachelor of Elementary Education",
  "BSN": "BS in Nursing",
  "BSPSYCH": "BS in Psychology",
  "BSCRIM": "BS in Criminology",
  "BSECE": "BS in Electronics Engineering",
  "BSEE": "BS in Electrical Engineering",
  "BSME": "BS in Mechanical Engineering",
  "BSCE": "BS in Civil Engineering",
  "BSIE": "BS in Industrial Engineering",
  "BSArch": "BS in Architecture",
  "BSA": "BS in Accountancy",
  "BSTM": "BS in Tourism Management",
  "BSEntrep": "BS in Entrepreneurship",
  "BSOA": "BS in Office Administration",
  "ACT": "Associate in Computer Technology",
  "AET": "Associate in Electrical Technology",
  "AMT": "Associate in Mechanical Technology"
};

interface LoginProps {
  onLogin: (
    token: string,
    userId: string,
    role: string,
    name?: string,
    profilePictureUrl?: string | null,
    stallId?: string
  ) => void;
  onNavigate: (page: string) => void;
}

type AuthMode = "login" | "register";
type VerifyState = "idle" | "pending" | "verified";

export function Login({ onLogin, onNavigate }: LoginProps) {
  // ── mode ──
  const [mode, setMode] = useState<AuthMode>("login");

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

  // ── email verification ──
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyInput, setVerifyInput] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  function switchMode(m: AuthMode) {
    setMode(m);
    setError(null);
    setSuccessMsg(null);
    setVerifyState("idle");
    setVerifyInput("");
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
      const result = await loginUser(email, password);

      onLogin(
        result.accessToken,
        result.user.id,
        result.user.role,
        result.user.name,
        result.user.profilePictureUrl,
        result.user.stallId
      );
    } catch (err) {
      setError(err instanceof TypeError ? getNetworkError() : (err instanceof Error ? err.message : "Login failed"));
    } finally {
      setIsLoading(false);
    }
  }

  // ── REGISTER (student only) ──
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate TUPT-ID format only if the student chose to provide one
    const tuptPattern = /^TUPT-\d{2}-\d{4}$/i;
    if (tuptId && !tuptPattern.test(tuptId)) {
      setError("TUPT ID must follow the format TUPT-XX-XXXX (e.g. TUPT-21-1234).");
      setIsLoading(false);
      return;
    }

    try {
      await registerStudent({
        firstName,
        lastName,
        birthdate: birthday,
        email,
        tuptId: tuptId ? tuptId.toUpperCase() : undefined,
        course: course || undefined,
        section: section || undefined,
        contactNumber,
        password,
      });

      setRegisteredEmail(email);
      setVerifyState("pending");
      setSuccessMsg("Verification code sent to your email! Please check your inbox.");
      setError(null);

      if (import.meta.env.DEV) {
        console.log("📧 [DEV] Check your email for the verification code.");
      }
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
    setIsLoading(true);

    try {
      await verifyEmail(registeredEmail, verifyInput.trim());
      setVerifyState("verified");
      setSuccessMsg("Email verified! Your account is now active. Please log in.");
      setError(null);

      setTimeout(() => {
        switchMode("login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  }

  // ── RESEND VERIFICATION CODE ──
  async function handleResendVerification() {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setIsResending(true);

    try {
      await resendVerification(registeredEmail);
      setSuccessMsg("New verification code sent to your email!");
      setError(null);

      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (import.meta.env.DEV) {
        console.log("📧 [DEV] New verification code sent.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-content">
        <div className="auth-card">
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

          {error && (
            <div className="auth-alert error">
              <i className="fas fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="auth-alert success">
              <i className="fas fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "login" && (
            <form className="auth-form" onSubmit={handleLogin}>
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

          {mode === "register" && verifyState === "idle" && (
            <form className="auth-form" onSubmit={handleRegister}>
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
                <label>TUPT ID (optional)</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-id-card field-icon"></i>
                  <input
                    type="text"
                    placeholder="TUPT-21-1234"
                    value={tuptId}
                    onChange={(e) => setTuptId(e.target.value)}
                    disabled={isLoading}
                    pattern="TUPT-\d{2}-\d{4}"
                    title="Format: TUPT-XX-XXXX"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Course (optional)</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-book field-icon"></i>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select course…</option>
                    {TUP_COURSES.map((c) => (
                      <option key={c} value={c}>
                        {COURSE_DISPLAY_NAMES[c] || c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-field">
                <label>Section (optional)</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-users field-icon"></i>
                  <input
                    type="text"
                    placeholder="e.g. 3A"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    disabled={isLoading}
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

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? "Registering…" : "Create Account"}
              </button>
            </form>
          )}

          {mode === "register" && verifyState === "pending" && (
            <form className="auth-form" onSubmit={handleVerify}>
              <div className="auth-verify-notice">
                <i className="fas fa-envelope-open-text"></i>
                <p>
                  A 6-digit verification code has been sent to{" "}
                  <strong>{registeredEmail}</strong>. Enter it below to activate your account.
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
                    onChange={(e) => setVerifyInput(e.target.value.replace(/\s/g, ''))}
                    maxLength={6}
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? "Verifying…" : "Verify Email"}
              </button>

              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || isResending}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "#a6a6a6" : "#ff3131",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                    fontSize: 14,
                    fontWeight: 500,
                    padding: "8px 16px",
                  }}
                >
                  {isResending ? (
                    "Sending..."
                  ) : resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    "Didn't receive the code? Resend"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer-links">
            <button type="button" className="auth-text-btn guest" onClick={() => onNavigate("home")}>
              ← Browse as Guest
            </button>
            <p className="auth-support">Need help? Email admin@tup.edu.ph</p>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}