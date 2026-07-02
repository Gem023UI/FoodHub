"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStudent = registerStudent;
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
    let existing = await models_1.StudentModel.findOne({ email: data.email.toLowerCase().trim() });
    if (!existing) existing = await models_1.AdminModel.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) return { success: false, reason: "email_exists" };

    const existingStudent = await models_1.StudentModel.findOne({
        tuptId: data.tuptId.toUpperCase().trim()
    });
    if (existingStudent) return { success: false, reason: "tupt_id_exists" };

    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const student = await models_1.StudentModel.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: "student",
        status: "unverified",
        birthdate: data.birthdate || null,
        tuptId: data.tuptId.toUpperCase().trim(),
        course: data.course.trim(),
        section: data.section.trim(),
        contactNumber: data.contactNumber || null,
        profilePictureUrl: data.profilePictureUrl || null,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt,
        lastVerificationSentAt: new Date(),
        favorites: [],
        budgetCap: []
    });

    try {
        await (0, mailer_1.sendVerificationEmail)(data.email, verificationCode);
    } catch (error) {
        console.error("Failed to send verification email:", error);
    }

    return {
        success: true,
        data: { id: student._id.toString(), email: student.email, role: student.role }
    };
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
async function loginUser(email, password) {
    const config = (0, env_1.getConfig)();

    // Check all user types
    let user = await models_1.StudentModel.findOne({ email: email.toLowerCase().trim() })
        .select("+passwordHash +emailVerificationCode +emailVerificationExpires");
    let userType = "student";

   if (!user) {
        user = await models_1.AdminModel.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
        userType = "admin";
    }

    // If this account's email is also listed as a vendor on a stall, treat the login as a vendor login
    if (user && userType === "student") {
        const stall = await models_1.StallModel.findOne({ "vendors.email": email.toLowerCase().trim() });
        if (stall) {
            const vendorSub = stall.vendors.find(v => v.email === email.toLowerCase().trim());
            if (vendorSub) {
                userType = "vendor";
            }
        }
    }

    if (!user) return { success: false, reason: "invalid_credentials" };

    // Check password
    const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordMatches) return { success: false, reason: "invalid_credentials" };

    // Check if user is verified (except admin)
    if (userType !== "admin" && user.status !== "verified") {
        if (user.status === "unverified") return { success: false, reason: "unverified" };
        if (user.status === "deactivated") return { success: false, reason: "suspended" };
    }

    // Check admin status - only allow "verified"
    if (userType === "admin" && user.status !== "verified") {
        return { success: false, reason: "suspended" };
    }

    // Get vendor info if applicable
    let vendorInfo = null;
    if (userType === "vendor") {
        const stall = await models_1.StallModel.findOne({ "vendors.email": user.email });
        if (stall) {
            const vendorSub = stall.vendors.find(v => v.email === user.email);
            if (vendorSub) {
                vendorInfo = {
                    stallId: stall._id,
                    stallName: stall.stallName,
                    position: vendorSub.position,
                    status: vendorSub.status
                };
            }
        }
    }

    const accessToken = (0, jwt_1.signAccessToken)({
        userId: user._id.toString(),
        role: userType
    }, config.jwtSecret);

    const userData = {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: userType,
        profilePictureUrl: user.profilePictureUrl || null,
        isActive: user.status === "verified",
        status: user.status
    };

    if (userType === "vendor" && vendorInfo) {
        userData.stallId = vendorInfo.stallId;
        userData.stallName = vendorInfo.stallName;
        userData.position = vendorInfo.position;
    }

    return {
        success: true,
        data: {
            accessToken,
            user: userData
        }
    };
}

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────
async function verifyEmail(email, code) {
    const trimmedCode = code.trim();

    let user = await models_1.StudentModel.findOne({ email: email.toLowerCase().trim() })
        .select("+emailVerificationCode +emailVerificationExpires");

    if (!user) return { success: false, reason: "user_not_found" };

    if (user.status === "verified") {
        return { success: false, reason: "already_verified" };
    }

    if (String(user.emailVerificationCode).trim() !== String(trimmedCode).trim()) {
        return { success: false, reason: "invalid_code" };
    }
    if (user.emailVerificationExpires < new Date()) {
        return { success: false, reason: "code_expired" };
    }

    await models_1.StudentModel.findByIdAndUpdate(user._id, {
        $set: {
            status: "verified",
            emailVerificationCode: null,
            emailVerificationExpires: null,
            lastVerificationSentAt: null,
        },
    });

    return { success: true };
}

// ── RESEND VERIFICATION ──────────────────────────────────────────────────
async function resendVerification(email) {
    let user = await models_1.StudentModel.findOne({ email: email.toLowerCase().trim() })
        .select("+emailVerificationCode +emailVerificationExpires +lastVerificationSentAt");

    if (!user) return { success: false, reason: "user_not_found" };

    if (user.status === "verified") {
        return { success: false, reason: "already_verified" };
    }

    const lastSentAt = user.lastVerificationSentAt || new Date(0);
    const timeSinceLastSent = Date.now() - new Date(lastSentAt).getTime();
    const oneMinute = 60 * 1000;

    if (timeSinceLastSent < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeSinceLastSent) / 1000);
        return { success: false, reason: "cooldown", remainingSeconds };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await models_1.StudentModel.findByIdAndUpdate(user._id, {
        $set: {
            emailVerificationCode: verificationCode,
            emailVerificationExpires: expiresAt,
            lastVerificationSentAt: new Date(),
        }
    });

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