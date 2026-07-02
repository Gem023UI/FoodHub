"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_controller_1 = require("../controllers/auth.controller");

const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;

// ─── STUDENT REGISTER ────────────────────────────────────────────────────
authRouter.post("/register/student", async (request, response) => {
    const {
        firstName, lastName, birthdate, email,
        tuptId, course, section, contactNumber, password, profilePictureUrl
    } = request.body;

    if (!firstName || !lastName || !email || !password || !tuptId || !course || !section) {
        response.status(400).json({ 
            message: "All required fields must be provided." 
        });
        return;
    }

    // Validate TUPT-ID format
    const tuptPattern = /^TUPT-\d{2}-\d{4}$/i;
    if (!tuptPattern.test(tuptId)) {
        response.status(400).json({ 
            message: "TUPT ID must follow the format TUPT-XX-XXXX (e.g. TUPT-21-1234)." 
        });
        return;
    }

    const result = await (0, auth_controller_1.registerStudent)({
        firstName, lastName, birthdate, email,
        tuptId, course, section, contactNumber, password, profilePictureUrl
    });

    if (!result.success) {
        const messages = {
            email_exists: "An account with that email already exists.",
            tupt_id_exists: "A student with that TUPT ID already exists."
        };
        response.status(400).json({ 
            message: messages[result.reason] || "Registration failed." 
        });
        return;
    }

    response.status(201).json({ 
        message: "Registration successful! Please check your email for the verification code." 
    });
});

// ─── LOGIN ──────────────────────────────────────────────────────────────
authRouter.post("/login", async (request, response) => {
    const { email, password } = request.body;

    if (!email || !password) {
        response.status(400).json({ message: "Email and password are required." });
        return;
    }

    const result = await (0, auth_controller_1.loginUser)(email, password);

    if (!result.success) {
        const messages = {
            invalid_credentials: "Invalid email or password.",
            suspended: "Your account has been suspended by an administrator.",
            unverified: "Please verify your email before logging in. Check your inbox for the verification code.",
            pending_approval: "Your vendor account is pending admin approval."
        };
        response.status(401).json({ message: messages[result.reason] || "Login failed." });
        return;
    }

    response.json(result.data);
});

// ─── VERIFY EMAIL ──────────────────────────────────────────────────────
authRouter.post("/verify-email", async (request, response) => {
    const { email, code } = request.body;

    if (!email || !code) {
        response.status(400).json({ message: "Email and code are required." });
        return;
    }

    const result = await (0, auth_controller_1.verifyEmail)(email, code);

    if (!result.success) {
        const messages = {
            user_not_found: "No account found with that email.",
            already_verified: "Email is already verified.",
            invalid_code: "Invalid verification code.",
            code_expired: "Verification code has expired. Please request a new code."
        };
        response.status(400).json({ message: messages[result.reason] || "Verification failed." });
        return;
    }

    response.json({ message: "Email verified successfully! You can now log in." });
});

// ─── RESEND VERIFICATION ──────────────────────────────────────────────
authRouter.post("/resend-verification", async (request, response) => {
    const { email } = request.body;

    if (!email) {
        response.status(400).json({ message: "Email is required." });
        return;
    }

    const result = await (0, auth_controller_1.resendVerification)(email);

    if (!result.success) {
        const messages = {
            user_not_found: "No account found with that email.",
            already_verified: "Email is already verified.",
            cooldown: "Please wait before requesting a new code."
        };
        const status = result.reason === "cooldown" ? 429 : 400;
        response.status(status).json({ 
            message: messages[result.reason] || "Failed to resend code.",
            ...(result.remainingSeconds && { remainingSeconds: result.remainingSeconds })
        });
        return;
    }

    response.json({ message: "New verification code sent to your email." });
});

// ─── GET CURRENT USER ──────────────────────────────────────────────────
authRouter.get("/me", auth_1.authenticateRequest, (request, response) => {
    response.json({ userId: request.userId, role: request.role });
});