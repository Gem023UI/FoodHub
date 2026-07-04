"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;

const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");

const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;

// ── LOGIN ──────────────────────────────────────────────────────────────
authRouter.post("/login", async (request, response) => {
    const { email, password } = request.body;

    console.log(`📝 Login request for: ${email}`);

    if (!email || !password) {
        console.log("❌ Missing email or password");
        return response.status(400).json({
            message: "Email and password are required."
        });
    }

    try {
        const result = await (0, auth_controller_1.login)(email, password);

        if (!result.success) {
            const messages = {
                invalid_credentials: "Invalid email or password. Please try again.",
                account_deactivated: "Your account has been deactivated. Please contact support."
            };
            console.log(`❌ Login failed: ${result.reason}`);
            return response.status(401).json({
                message: messages[result.reason] || "Login failed. Please try again."
            });
        }

        console.log(`✅ Login successful for: ${email}`);
        response.json(result.data);
    } catch (error) {
        console.error("❌ Login error:", error);
        response.status(500).json({ 
            message: "Login failed. Please try again later.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

// ── REGISTER STUDENT ──────────────────────────────────────────────────
authRouter.post("/register/student", async (request, response) => {
    console.log("📝 Register student request");
    
    try {
        const result = await (0, auth_controller_1.registerStudent)(request.body);

        if (!result.success) {
            const messages = {
                email_exists: "Email already registered.",
                tupt_id_exists: "TUPT ID already registered."
            };
            console.log(`❌ Registration failed: ${result.reason}`);
            return response.status(400).json({
                message: messages[result.reason] || "Registration failed."
            });
        }

        console.log(`✅ Registration successful for: ${request.body.email}`);
        response.status(201).json({
            message: "Registration successful. Please check your email for verification."
        });
    } catch (error) {
        console.error("❌ Registration error:", error);
        response.status(500).json({ 
            message: "Registration failed. Please try again later.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

// ── VERIFY EMAIL ──────────────────────────────────────────────────────
authRouter.post("/verify-email", async (request, response) => {
    const { email, code } = request.body;

    if (!email || !code) {
        return response.status(400).json({
            message: "Email and verification code are required."
        });
    }

    try {
        const result = await (0, auth_controller_1.verifyEmail)(email, code);

        if (!result.success) {
            return response.status(400).json({
                message: result.reason === "invalid_or_expired_code"
                    ? "Invalid or expired verification code."
                    : "Verification failed."
            });
        }

        response.json({ message: result.message });
    } catch (error) {
        console.error("❌ Verification error:", error);
        response.status(500).json({ message: "Verification failed." });
    }
});

// ── RESEND VERIFICATION ──────────────────────────────────────────────
authRouter.post("/resend-verification", async (request, response) => {
    const { email } = request.body;

    if (!email) {
        return response.status(400).json({
            message: "Email is required."
        });
    }

    try {
        const result = await (0, auth_controller_1.resendVerification)(email);

        if (!result.success) {
            const messages = {
                student_not_found: "Student not found.",
                already_verified: "Email already verified.",
                cooldown: `Please wait ${result.remainingSeconds || 60} seconds before requesting again.`
            };
            return response.status(400).json({
                message: messages[result.reason] || "Failed to resend verification.",
                remainingSeconds: result.remainingSeconds
            });
        }

        response.json({ message: result.message });
    } catch (error) {
        console.error("❌ Resend verification error:", error);
        response.status(500).json({ message: "Failed to resend verification." });
    }
});