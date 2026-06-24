"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_service_1 = require("../services/auth.service");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;

authRouter.post("/login", async (request, response) => {
    const { email, password } = request.body;
    if (!email || !password) {
        response.status(400).json({ message: "email and password are required." });
        return;
    }
    try {
        const result = await (0, auth_service_1.loginUser)({ email, password });
        if (!result.success) {
            if (result.reason === "suspended") {
                response.status(403).json({ message: "Your account has been suspended by an administrator." });
            }
            else {
                response.status(401).json({ message: "Invalid email or password." });
            }
            return;
        }
        response.json(result.data);
    }
    catch {
        response.status(500).json({ message: "Failed to log in." });
    }
});

authRouter.get("/me", auth_1.authenticateRequest, (request, response) => {
    response.json({ userId: request.userId, role: request.role });
});

// POST /api/auth/register
authRouter.post("/register", async (request, response) => {
  const {
    firstName, lastName, birthday, email,
    tuptId, course, section, contactNumber,
    proofOfLegitimacyUrl, password, role,
  } = request.body;

  if (!firstName || !lastName || !email || !password || !role) {
    response.status(400).json({ message: "Required fields are missing." });
    return;
  }

  // Student-specific required fields
  if (role === "student" && (!tuptId || !course || !section)) {
    response.status(400).json({ message: "tuptId, course, and section are required for students." });
    return;
  }

  try {
    // Check TUPT ID uniqueness for students
    if (role === "student") {
      const existing = await UserModel.findOne({ tuptId: tuptId.toUpperCase() });
      if (existing) {
        response.status(409).json({ message: "A student with that TUPT ID already exists." });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit email verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role,
      status: "unverified",
      isActive: false,
      birthday: birthday ?? null,
      tuptId: role === "student" ? tuptId.toUpperCase() : null,
      course:  role === "student" ? course  : null,
      section: role === "student" ? section : null,
      contactNumber: contactNumber ?? null,
      proofOfLegitimacyUrl: role === "vendor" ? (proofOfLegitimacyUrl ?? null) : null,
      emailVerificationCode:    verificationCode,
      emailVerificationExpires: expiresAt,
    });

    // TODO: Send email via your mail transport (nodemailer / SendGrid / etc.)
    // await sendVerificationEmail(email, verificationCode);

    response.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    if (error && error.code === 11000) {
      response.status(409).json({ message: "An account with that email already exists." });
      return;
    }
    response.status(500).json({ message: "Registration failed." });
  }
});

authRouter.post("/verify-email", async (request, response) => {
  const { email, code } = request.body;
  if (!email || !code) {
    response.status(400).json({ message: "Email and code are required." });
    return;
  }

  try {
    const user = await UserModel
      .findOne({ email: email.toLowerCase() })
      .select("+emailVerificationCode +emailVerificationExpires");

    if (!user) {
      response.status(404).json({ message: "No account found with that email." });
      return;
    }
    if (user.status === "verified") {
      response.status(400).json({ message: "Email is already verified." });
      return;
    }
    if (user.emailVerificationCode !== code) {
      response.status(400).json({ message: "Incorrect verification code." });
      return;
    }
    if (user.emailVerificationExpires < new Date()) {
      response.status(400).json({ message: "Verification code has expired. Please register again." });
      return;
    }

    await UserModel.findByIdAndUpdate(user._id, {
      $set: {
        status: "verified",
        isActive: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    response.json({ message: "Email verified successfully. You can now log in." });
  } catch {
    response.status(500).json({ message: "Verification failed." });
  }
});

// Login — require status === "verified"
// In your existing login handler, add after finding the user:
// if (user.status !== "verified") {
//   return response.status(403).json({ message: "Please verify your email before logging in." });
// }