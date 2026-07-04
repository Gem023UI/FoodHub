"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.registerStudent = registerStudent;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.logout = logout;

const models_1 = require("../models");
const bcryptjs_1 = require("bcryptjs");
const jwt_1 = require("../utils/jwt");
const mailer_1 = require("../utils/mailer");
const ids_1 = require("../utils/ids");

// ── LOGIN ──────────────────────────────────────────────────────────────
async function login(email, password) {
    console.log(`🔐 Login attempt for: ${email}`);
    
    let user = null;
    let role = "student";
    let stallId = null;
    let stallName = null;
    let position = null;
    let userModel = null;

    // ── 1. Check Student Model ──────────────────────────────────────────
    let student = await models_1.StudentModel.findOne({ email })
        .select("+passwordHash")
        .lean();
    
    if (student) {
        console.log(`✅ Found student: ${email}`);
        user = student;
        role = "student";
        userModel = "Student";
    }

    // ── 2. Check Vendor Model ──────────────────────────────────────────
    if (!user) {
        const vendor = await models_1.VendorModel.findOne({ email })
            .select("+passwordHash")
            .lean();
        
        if (vendor) {
            console.log(`✅ Found vendor: ${email}`);
            role = "vendor";
            stallId = vendor.stallId || null;
            position = vendor.position || null;
            user = {
                _id: vendor._id,
                firstName: vendor.firstName,
                lastName: vendor.lastName,
                email: vendor.email,
                passwordHash: vendor.passwordHash,
                profilePictureUrl: vendor.profilePictureUrl || null,
                status: vendor.status || "verified",
                role: "vendor",
            };
            userModel = "Vendor";
            
            if (stallId) {
                const stall = await models_1.StallModel.findById(stallId).select("stallName").lean();
                if (stall) {
                    stallName = stall.stallName;
                }
            }
        }
    }

    // ── 3. Check Admin Model ──────────────────────────────────────────
    if (!user) {
        const admin = await models_1.AdminModel.findOne({ email })
            .select("+passwordHash")
            .lean();
        
        if (admin) {
            console.log(`✅ Found admin: ${email}`);
            role = "admin";
            user = {
                _id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                passwordHash: admin.passwordHash,
                profilePictureUrl: admin.profilePictureUrl || null,
                status: admin.status || "verified",
                role: "admin",
            };
            userModel = "Admin";
        }
    }

    // ── 4. User not found ──────────────────────────────────────────────
    if (!user) {
        console.log(`❌ User not found: ${email}`);
        return { success: false, reason: "invalid_credentials" };
    }

    // ── 5. Check if user is deactivated ────────────────────────────────
    if (user.status === "deactivated" || user.status === "suspended") {
        console.log(`❌ Account deactivated: ${email}`);
        return { success: false, reason: "account_deactivated" };
    }

    // ── 6. Verify password ──────────────────────────────────────────────
    console.log(`🔑 Verifying password for: ${email}`);
    const isPasswordValid = await bcryptjs_1.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
        console.log(`❌ Invalid password for: ${email}`);
        return { success: false, reason: "invalid_credentials" };
    }

    console.log(`✅ Password verified for: ${email}`);

    // ── 7. Update last login for vendors ──────────────────────────────
    if (role === "vendor" && userModel === "Vendor") {
        await models_1.VendorModel.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
            active: true
        });
    }

    // ── 8. Generate JWT token ──────────────────────────────────────────
    const tokenPayload = {
        userId: user._id,
        role: role,
        email: user.email,
    };
    
    console.log(`🔑 Generating token for: ${email} with role: ${role}`);
    const token = (0, jwt_1.generateAccessToken)(tokenPayload);

    console.log(`✅ Login successful for: ${email} (${role})`);

    return {
        success: true,
        data: {
            accessToken: token,
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: role,
                profilePictureUrl: user.profilePictureUrl || null,
                isActive: user.status !== "deactivated" && user.status !== "suspended",
                status: user.status || "verified",
                stallId: stallId || undefined,
                stallName: stallName || undefined,
                position: position || undefined,
            }
        }
    };
}

// ── LOGOUT ──────────────────────────────────────────────────────────────
async function logout(userId, role) {
    if (role === "vendor") {
        await models_1.VendorModel.findByIdAndUpdate(userId, { active: false });
    }
    return { success: true };
}

// ── REGISTER STUDENT ──────────────────────────────────────────────────
async function registerStudent(data) {
    const existing = await models_1.StudentModel.findOne({
        $or: [{ email: data.email }, { tuptId: data.tuptId }]
    });

    if (existing) {
        if (existing.email === data.email) {
            return { success: false, reason: "email_exists" };
        }
        if (existing.tuptId === data.tuptId) {
            return { success: false, reason: "tupt_id_exists" };
        }
    }

    const salt = await bcryptjs_1.hash(data.password, 10);
    const verificationCode = (0, ids_1.generateVerificationCode)();
    const expiresIn = new Date(Date.now() + 10 * 60 * 1000);

    const student = await models_1.StudentModel.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: salt,
        tuptId: data.tuptId,
        course: data.course,
        section: data.section,
        contactNumber: data.contactNumber,
        birthdate: data.birthdate || null,
        status: "unverified",
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresIn,
        lastVerificationSentAt: new Date(),
        role: "student",
    });

    await (0, mailer_1.sendVerificationEmail)(data.email, verificationCode);

    return { success: true, data: { student } };
}

// ── VERIFY EMAIL ──────────────────────────────────────────────────────
async function verifyEmail(email, code) {
    const student = await models_1.StudentModel.findOne({
        email,
        emailVerificationCode: code,
        emailVerificationExpires: { $gt: new Date() }
    });

    if (!student) {
        return { success: false, reason: "invalid_or_expired_code" };
    }

    student.status = "verified";
    student.emailVerificationCode = null;
    student.emailVerificationExpires = null;
    await student.save();

    return { success: true, message: "Email verified successfully" };
}

// ── RESEND VERIFICATION ──────────────────────────────────────────────
async function resendVerification(email) {
    const student = await models_1.StudentModel.findOne({ email });
    if (!student) {
        return { success: false, reason: "student_not_found" };
    }

    if (student.status === "verified") {
        return { success: false, reason: "already_verified" };
    }

    const cooldown = 60;
    const lastSent = student.lastVerificationSentAt;
    if (lastSent) {
        const secondsSinceLastSent = (Date.now() - lastSent.getTime()) / 1000;
        if (secondsSinceLastSent < cooldown) {
            return {
                success: false,
                reason: "cooldown",
                remainingSeconds: Math.ceil(cooldown - secondsSinceLastSent)
            };
        }
    }

    const code = (0, ids_1.generateVerificationCode)();
    const expiresIn = new Date(Date.now() + 10 * 60 * 1000);

    student.emailVerificationCode = code;
    student.emailVerificationExpires = expiresIn;
    student.lastVerificationSentAt = new Date();
    await student.save();

    await (0, mailer_1.sendVerificationEmail)(email, code);

    return { success: true, message: "Verification code sent" };
}