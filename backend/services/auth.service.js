"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStudent = registerStudent;
exports.registerVendor = registerVendor;
exports.loginUser = loginUser;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.isDuplicateEmailError = isDuplicateEmailError;

const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongo_1 = require("../utils/mongo");
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");
const mailer_1 = require("../utils/mailer");

// ── STUDENT REGISTRATION ──────────────────────────────────────────────────
async function registerStudent(data) {
    const config = (0, env_1.getConfig)();
    
    // Check if email exists
    let existing = await models_1.StudentModel.findOne({ email: data.email.toLowerCase().trim() });
    if (!existing) {
        existing = await models_1.VendorModel.findOne({ email: data.email.toLowerCase().trim() });
    }
    if (!existing) {
        existing = await models_1.AdminModel.findOne({ email: data.email.toLowerCase().trim() });
    }
    if (existing) {
        return { success: false, reason: "email_exists" };
    }

    // Check TUPT ID uniqueness
    const existingStudent = await models_1.StudentModel.findOne({ 
        tuptId: data.tuptId.toUpperCase().trim() 
    });
    if (existingStudent) {
        return { success: false, reason: "tupt_id_exists" };
    }

    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const student = await models_1.StudentModel.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: "student",
        status: "unverified",
        isActive: false,
        birthday: data.birthday || null,
        tuptId: data.tuptId.toUpperCase().trim(),
        course: data.course.trim(),
        section: data.section.trim(),
        contactNumber: data.contactNumber || null,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt,
        lastVerificationSentAt: new Date(),
    });

    // Send verification email
    try {
        await (0, mailer_1.sendVerificationEmail)(data.email, verificationCode);
    } catch (error) {
        console.error("Failed to send verification email:", error);
    }

    return {
        success: true,
        data: {
            id: student._id.toString(),
            email: student.email,
            role: student.role
        }
    };
}

// ── VENDOR REGISTRATION ──────────────────────────────────────────────────
async function registerVendor(data) {
    // Check if email exists
    let existing = await models_1.StudentModel.findOne({ email: data.email.toLowerCase().trim() });
    if (!existing) {
        existing = await models_1.VendorModel.findOne({ email: data.email.toLowerCase().trim() });
    }
    if (!existing) {
        existing = await models_1.AdminModel.findOne({ email: data.email.toLowerCase().trim() });
    }
    if (existing) {
        return { success: false, reason: "email_exists" };
    }

    // Validate stall exists and is available
    const stall = await models_1.StallModel.findById(data.stallId);
    if (!stall) {
        return { success: false, reason: "stall_not_found" };
    }

    // Check if stall already has vendor
    const existingVendor = await models_1.VendorModel.findOne({ stallId: data.stallId });
    if (existingVendor) {
        return { success: false, reason: "stall_taken" };
    }

    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Create vendor WITH stallId (required)
    const vendor = await models_1.VendorModel.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: "vendor",
        status: "unverified",
        isActive: false,
        contactNumber: data.contactNumber || null,
        proofOfLegitimacyUrl: data.proofOfLegitimacyUrl || null,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt,
        lastVerificationSentAt: new Date(),
        stallId: data.stallId, // ← REQUIRED
    });

    // Update stall with vendorId
    await models_1.StallModel.findByIdAndUpdate(data.stallId, {
        $addToSet: { vendorIds: vendor._id }
    });

    // Send verification email
    try {
        await (0, mailer_1.sendVerificationEmail)(data.email, verificationCode);
    } catch (error) {
        console.error("Failed to send verification email:", error);
    }

    return {
        success: true,
        data: {
            id: vendor._id.toString(),
            email: vendor.email,
            role: vendor.role,
            stallId: vendor.stallId
        }
    };
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
async function loginUser(email, password) {
    const config = (0, env_1.getConfig)();
    
    // Search all collections
    let user = await models_1.StudentModel.findOne({ 
        email: email.toLowerCase().trim() 
    }).select("+passwordHash +emailVerificationCode +emailVerificationExpires");
    
    let userType = "student";
    
    if (!user) {
        user = await models_1.VendorModel.findOne({ 
            email: email.toLowerCase().trim() 
        }).select("+passwordHash +emailVerificationCode +emailVerificationExpires");
        userType = "vendor";
    }
    
    if (!user) {
        user = await models_1.AdminModel.findOne({ 
            email: email.toLowerCase().trim() 
        }).select("+passwordHash");
        userType = "admin";
    }

    if (!user) {
        return { success: false, reason: "invalid_credentials" };
    }

    // Check if account is suspended
    if (user.status === "suspended" || !user.isActive) {
        return { success: false, reason: "suspended" };
    }

    // For students and vendors, check if email is verified
    if (user.role !== "admin") {
        if (user.status === "unverified") {
            return { success: false, reason: "unverified" };
        }
        if (user.role === "vendor" && user.status !== "verified") {
            return { success: false, reason: "pending_approval" };
        }
    }

    // Verify password
    const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordMatches) {
        return { success: false, reason: "invalid_credentials" };
    }

    // Generate token
    const accessToken = (0, jwt_1.signAccessToken)({ 
        userId: user._id.toString(), 
        role: user.role 
    }, config.jwtSecret);

    return {
        success: true,
        data: {
            accessToken,
            user: {
                id: user._id.toString(),
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                profilePictureUrl: user.profilePictureUrl || null,
                isActive: user.isActive,
                ...(userType === "vendor" && { stallId: user.stallId })
            }
        }
    };
}

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────
async function verifyEmail(email, code) {
    const trimmedCode = code.trim();

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
        return { success: false, reason: "user_not_found" };
    }

    if (user.status === "verified") {
        return { success: false, reason: "already_verified" };
    }

    if (String(user.emailVerificationCode).trim() !== String(trimmedCode).trim()) {
        return { success: false, reason: "invalid_code" };
    }

    if (user.emailVerificationExpires < new Date()) {
        return { success: false, reason: "code_expired" };
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

    return { success: true };
}

// ── RESEND VERIFICATION ──────────────────────────────────────────────────
async function resendVerification(email) {
    let user = await models_1.StudentModel.findOne({ 
        email: email.toLowerCase().trim() 
    }).select("+emailVerificationCode +emailVerificationExpires +lastVerificationSentAt");
    
    let userType = "Student";
    if (!user) {
        user = await models_1.VendorModel.findOne({ 
            email: email.toLowerCase().trim() 
        }).select("+emailVerificationCode +emailVerificationExpires +lastVerificationSentAt");
        userType = "Vendor";
    }

    if (!user) {
        return { success: false, reason: "user_not_found" };
    }

    if (user.status === "verified") {
        return { success: false, reason: "already_verified" };
    }

    // Check cooldown
    const lastSentAt = user.lastVerificationSentAt || new Date(0);
    const timeSinceLastSent = Date.now() - new Date(lastSentAt).getTime();
    const oneMinute = 60 * 1000;

    if (timeSinceLastSent < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeSinceLastSent) / 1000);
        return { success: false, reason: "cooldown", remainingSeconds };
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const updateData = {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt,
        lastVerificationSentAt: new Date(),
    };

    if (userType === "Student") {
        await models_1.StudentModel.findByIdAndUpdate(user._id, { $set: updateData });
    } else {
        await models_1.VendorModel.findByIdAndUpdate(user._id, { $set: updateData });
    }

    // Send email
    try {
        await (0, mailer_1.sendVerificationEmail)(email, verificationCode);
    } catch (error) {
        console.error("Failed to send verification email:", error);
    }

    return { success: true };
}

function isDuplicateEmailError(error) {
    return (0, mongo_1.isMongoServerError)(error) && error.code === 11000;
}