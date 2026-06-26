"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const bcryptjs_1 = require("bcryptjs");

const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;

// ─── LOGIN ──────────────────────────────────────────────────────────────
authRouter.post("/login", async (request, response) => {
    const { email, password } = request.body;
    
    console.log("🔐 Login attempt:", { email }); // Debug log

    if (!email || !password) {
        response.status(400).json({ message: "Email and password are required." });
        return;
    }

    try {
        // Try Student collection first
        let user = await models_1.StudentModel.findOne({ 
            email: email.toLowerCase().trim() 
        }).select("+passwordHash +emailVerificationCode +emailVerificationExpires");
        
        // If not found, try Vendor
        if (!user) {
            user = await models_1.VendorModel.findOne({ 
                email: email.toLowerCase().trim() 
            }).select("+passwordHash +emailVerificationCode +emailVerificationExpires");
        }
        
        // If still not found, try Admin
        if (!user) {
            user = await models_1.AdminModel.findOne({ 
                email: email.toLowerCase().trim() 
            }).select("+passwordHash");
        }

        if (!user) {
            response.status(401).json({ message: "Invalid email or password." });
            return;
        }

        // Check if account is suspended
        if (user.status === "suspended") {
            response.status(403).json({ message: "Your account has been suspended by an administrator." });
            return;
        }

        // For students and vendors, check if email is verified
        if (user.role !== "admin" && user.status !== "verified") {
            response.status(403).json({ 
                message: "Please verify your email before logging in. Check your inbox for the verification code." 
            });
            return;
        }

        // Verify password
        const passwordMatches = await bcryptjs_1.compare(password, user.passwordHash);
        if (!passwordMatches) {
            response.status(401).json({ message: "Invalid email or password." });
            return;
        }

        // Generate JWT token
        const { signAccessToken } = require("../utils/jwt");
        const { getConfig } = require("../config/env");
        const config = getConfig();
        const accessToken = signAccessToken(
            { userId: user._id.toString(), role: user.role }, 
            config.jwtSecret
        );

        // Remove sensitive fields
        const userObj = user.toObject();
        delete userObj.passwordHash;
        delete userObj.emailVerificationCode;
        delete userObj.emailVerificationExpires;

        response.json({
            accessToken,
            user: {
                id: user._id.toString(),
                name: `${user.firstName} ${user.lastName}`,
                role: user.role,
                profilePictureUrl: user.profilePictureUrl || null,
            }
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        response.status(500).json({ message: "Failed to log in. Please try again." });
    }
});

// ─── GET CURRENT USER ──────────────────────────────────────────────────
authRouter.get("/me", auth_1.authenticateRequest, (request, response) => {
    response.json({ userId: request.userId, role: request.role });
});

// ─── REGISTER ────────────────────────────────────────────────────────────
authRouter.post("/register", async (request, response) => {
    const {
        firstName, lastName, birthday, email,
        tuptId, course, section, contactNumber,
        proofOfLegitimacyUrl, password, role,
    } = request.body;

    console.log("📝 Registration attempt:", { firstName, lastName, email, role });

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
        response.status(400).json({ message: "Required fields are missing." });
        return;
    }

    // Student-specific required fields
    if (role === "student" && (!tuptId || !course || !section)) {
        response.status(400).json({ 
            message: "TUPT ID, course, and section are required for students." 
        });
        return;
    }

    try {
        // Check if email already exists in ANY collection
        let existingUser = await models_1.StudentModel.findOne({ 
            email: email.toLowerCase().trim() 
        });
        if (!existingUser) {
            existingUser = await models_1.VendorModel.findOne({ 
                email: email.toLowerCase().trim() 
            });
        }
        if (!existingUser) {
            existingUser = await models_1.AdminModel.findOne({ 
                email: email.toLowerCase().trim() 
            });
        }
        if (existingUser) {
            response.status(409).json({ 
                message: "An account with that email already exists." 
            });
            return;
        }

        // Check TUPT ID uniqueness for students
        if (role === "student") {
            const existingStudent = await models_1.StudentModel.findOne({ 
                tuptId: tuptId.toUpperCase().trim() 
            });
            if (existingStudent) {
                response.status(409).json({ 
                    message: "A student with that TUPT ID already exists." 
                });
                return;
            }
        }

        // Hash password
        const passwordHash = await bcryptjs_1.hash(password, 10);

        // Generate 6-digit email verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        let user;
        if (role === "student") {
            user = await models_1.StudentModel.create({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                role: "student",
                status: "unverified",
                isActive: false,
                birthday: birthday || null,
                tuptId: tuptId.toUpperCase().trim(),
                course: course.trim(),
                section: section.trim(),
                contactNumber: contactNumber || null,
                emailVerificationCode: verificationCode,
                emailVerificationExpires: expiresAt,
                lastVerificationSentAt: new Date(),
            });
        } else if (role === "vendor") {
            user = await models_1.VendorModel.create({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                role: "vendor",
                status: "unverified",
                isActive: false,
                contactNumber: contactNumber || null,
                proofOfLegitimacyUrl: proofOfLegitimacyUrl || null,
                emailVerificationCode: verificationCode,
                emailVerificationExpires: expiresAt,
                lastVerificationSentAt: new Date(),
            });
        } else {
            response.status(400).json({ message: "Invalid role specified." });
            return;
        }

        // Send verification email (if email is configured)
        try {
            const { sendVerificationEmail } = require("../utils/mailer");
            await sendVerificationEmail(email, verificationCode);
            console.log(`✅ Verification email sent to ${email}`);
        } catch (emailError) {
            console.error("❌ Failed to send verification email:", emailError);
            // Don't fail registration if email fails, just log it
        }

        response.status(201).json({
            message: "Registration successful! Please check your email for the verification code.",
        });
    } catch (error) {
        console.error("❌ Registration error:", error);
        if (error && error.code === 11000) {
            response.status(409).json({ 
                message: "An account with that email already exists." 
            });
            return;
        }
        response.status(500).json({ 
            message: "Registration failed. Please try again later." 
        });
    }
});

// ─── VERIFY EMAIL ──────────────────────────────────────────────────────────

authRouter.post("/verify-email", async (request, response) => {
    const { email, code } = request.body;
    
    console.log("🔑 Verification attempt:", { email, code: code?.trim() });

    if (!email || !code) {
        response.status(400).json({ message: "Email and code are required." });
        return;
    }

    // Trim the code to remove any whitespace
    const trimmedCode = code.trim();

    try {
        // Find user in Student or Vendor collections
        let user = await models_1.StudentModel.findOne({ 
            email: email.toLowerCase().trim() 
        }).select("+emailVerificationCode +emailVerificationExpires");
        
        let userType = "Student";
        if (!user) {
            user = await models_1.VendorModel.findOne({ 
                email: email.toLowerCase().trim() 
            }).select("+emailVerificationCode +emailVerificationExpires");
            userType = "Vendor";
        }

        if (!user) {
            response.status(404).json({ 
                message: "No account found with that email." 
            });
            return;
        }

        if (user.status === "verified") {
            response.status(400).json({ 
                message: "Email is already verified." 
            });
            return;
        }

        // Debug logging
        console.log("📝 Stored code:", user.emailVerificationCode);
        console.log("📝 Provided code:", trimmedCode);
        console.log("📝 Code match:", user.emailVerificationCode === trimmedCode);
        console.log("📝 Code expires:", user.emailVerificationExpires);
        console.log("📝 Current time:", new Date());

        // Check if code matches (as string)
        if (String(user.emailVerificationCode).trim() !== String(trimmedCode).trim()) {
            response.status(400).json({ 
                message: "Incorrect verification code. Please check your email and try again." 
            });
            return;
        }

        // Check if code has expired
        if (user.emailVerificationExpires < new Date()) {
            response.status(400).json({ 
                message: "Verification code has expired. Please request a new code." 
            });
            return;
        }

        // Update user
        let updatedUser;
        if (userType === "Student") {
            updatedUser = await models_1.StudentModel.findByIdAndUpdate(user._id, {
                $set: {
                    status: "verified",
                    isActive: true,
                    emailVerificationCode: null,
                    emailVerificationExpires: null,
                    lastVerificationSentAt: null,
                },
            }, { new: true });
        } else {
            updatedUser = await models_1.VendorModel.findByIdAndUpdate(user._id, {
                $set: {
                    status: "verified",
                    isActive: true,
                    emailVerificationCode: null,
                    emailVerificationExpires: null,
                    lastVerificationSentAt: null,
                },
            }, { new: true });
        }

        console.log(`✅ Email verified for: ${email}`);
        response.json({ 
            message: "Email verified successfully! You can now log in." 
        });
    } catch (error) {
        console.error("❌ Verification error:", error);
        response.status(500).json({ 
            message: "Verification failed. Please try again." 
        });
    }
});

// ─── RESEND VERIFICATION CODE ──────────────────────────────────────────────
authRouter.post("/resend-verification", async (request, response) => {
    const { email } = request.body;
    
    console.log("🔄 Resend verification attempt:", { email });

    if (!email) {
        response.status(400).json({ message: "Email is required." });
        return;
    }

    try {
        // Find user in Student or Vendor collections
        let user = await models_1.StudentModel.findOne({ 
            email: email.toLowerCase().trim() 
        }).select("+emailVerificationCode +emailVerificationExpires");
        
        let userType = "Student";
        if (!user) {
            user = await models_1.VendorModel.findOne({ 
                email: email.toLowerCase().trim() 
            }).select("+emailVerificationCode +emailVerificationExpires");
            userType = "Vendor";
        }

        if (!user) {
            response.status(404).json({ 
                message: "No account found with that email." 
            });
            return;
        }

        if (user.status === "verified") {
            response.status(400).json({ 
                message: "Email is already verified." 
            });
            return;
        }

        // Check if last code was sent less than 1 minute ago
        const lastSentAt = user.lastVerificationSentAt || new Date(0);
        const timeSinceLastSent = Date.now() - new Date(lastSentAt).getTime();
        const oneMinute = 60 * 1000;

        if (timeSinceLastSent < oneMinute) {
            const remainingSeconds = Math.ceil((oneMinute - timeSinceLastSent) / 1000);
            response.status(429).json({ 
                message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
                remainingSeconds
            });
            return;
        }

        // Generate new 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Update user with new code
        const updateData = {
            emailVerificationCode: verificationCode,
            emailVerificationExpires: expiresAt,
            lastVerificationSentAt: new Date(),
        };

        let updatedUser;
        if (userType === "Student") {
            updatedUser = await models_1.StudentModel.findByIdAndUpdate(user._id, {
                $set: updateData,
            }, { new: true });
        } else {
            updatedUser = await models_1.VendorModel.findByIdAndUpdate(user._id, {
                $set: updateData,
            }, { new: true });
        }

        // Send verification email
        try {
            const { sendVerificationEmail } = require("../utils/mailer");
            await sendVerificationEmail(email, verificationCode);
            console.log(`✅ New verification email sent to ${email}`);
        } catch (emailError) {
            console.error("❌ Failed to send verification email:", emailError);
            // Don't fail if email fails, but log it
        }

        // In development, log the code for testing
        if (process.env.NODE_ENV === "development") {
            console.log(`📧 [DEV] New verification code for ${email}: ${verificationCode}`);
        }

        response.json({ 
            message: "New verification code sent to your email.",
            codeSent: true
        });
    } catch (error) {
        console.error("❌ Resend verification error:", error);
        response.status(500).json({ 
            message: "Failed to resend verification code. Please try again." 
        });
    }
});