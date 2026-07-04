"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.listStudents = listStudents;
exports.listVendors = listVendors;
exports.updateStudent = updateStudent;
exports.updateVendor = updateVendor;
exports.listAdmins = listAdmins;
exports.createAdmin = createAdmin;
exports.updateAdmin = updateAdmin;
exports.createVendor = createVendor;

const models_1 = require("../models");
const ids_1 = require("../utils/ids");
const bcryptjs_1 = require("bcryptjs");

// ── Student helpers ──────────────────────────────────────────────────────────
async function listStudents() {
    return models_1.StudentModel.find({ role: "student" })
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .sort({ createdAt: -1 })
        .lean();
}

async function updateStudent(studentId, updates, isAdmin = false) {
    if (!(0, ids_1.isValidObjectId)(studentId)) return null;

    const selfAllowed = ["contactNumber", "profilePictureUrl", "birthdate"];
    const adminAllowed = [...selfAllowed, "firstName", "lastName", "course", "section", "tuptId", "status"];
    const allowed = isAdmin ? adminAllowed : selfAllowed;

    const sanitized = {};
    for (const f of allowed) {
        if (f in updates) sanitized[f] = updates[f];
    }

    return models_1.StudentModel
        .findByIdAndUpdate(studentId, { $set: sanitized }, { new: true })
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .lean();
}

// ── Vendor helpers ───────────────────────────────────────────────────────────
async function listVendors() {
    const stalls = await models_1.StallModel.find({}, "stallName vendors").lean();
    const vendors = [];
    for (const stall of stalls) {
        for (const v of stall.vendors || []) {
            vendors.push({
                email: v.email,
                firstName: v.firstName,
                lastName: v.lastName,
                phoneNumber: v.phoneNumber,
                vendorImage: v.vendorImage,
                position: v.position,
                status: v.status,
                role: v.role || "vendor",
                stallId: { _id: stall._id, name: stall.stallName },
            });
        }
    }
    return vendors;
}

async function createVendor(data) {
    if (!(0, ids_1.isValidObjectId)(data.stallId)) {
        return { success: false, reason: "invalid_stall_id" };
    }

    const stall = await models_1.StallModel.findById(data.stallId);
    if (!stall) {
        return { success: false, reason: "stall_not_found" };
    }

    const existing = await models_1.VendorModel.findOne({ email: data.email });
    if (existing) {
        return { success: false, reason: "email_exists" };
    }

    const passwordHash = await bcryptjs_1.hash(data.password, 10);

    const vendor = await models_1.VendorModel.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        contactNumber: data.contactNumber ?? null,
        position: data.position ?? "Cook",
        stallId: stall._id,
        stallName: stall.stallName,
        status: "verified",
        active: false,
    });

    stall.vendors.push({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.contactNumber ?? null,
        vendorImage: null,
        role: "vendor",
        position: data.position ?? "Cook",
        status: "verified",
    });
    await stall.save();

    return { success: true, data: { vendor } };
}

async function updateVendor(vendorEmail, updates, isAdmin = false) {
    const stall = await models_1.StallModel.findOne({ "vendors.email": vendorEmail });
    if (!stall) return null;
    const vendorSub = stall.vendors.find(v => v.email === vendorEmail);
    if (!vendorSub) return null;

    const selfAllowed = ["vendorImage"];
    const adminAllowed = ["firstName", "lastName", "email", "phoneNumber", "vendorImage", "position", "status"];
    const allowed = isAdmin ? adminAllowed : selfAllowed;

    for (const f of allowed) {
        if (f in updates) vendorSub[f] = updates[f];
    }

    await stall.save();

    return {
        ...vendorSub.toObject(),
        stallId: { _id: stall._id, name: stall.stallName }
    };
}

// ── Admin helpers ────────────────────────────────────────────────────────────
async function listAdmins() {
    return models_1.AdminModel.find({})
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();
}

async function createAdmin(data) {
    const passwordHash = await bcryptjs_1.hash(data.password, 10);
    return models_1.AdminModel.create({
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber ?? null,
        email: data.email,
        passwordHash,
        profilePictureUrl: data.profilePictureUrl ?? null,
        status: data.status ?? "active",
    });
}

async function updateAdmin(adminId, updates) {
    if (!(0, ids_1.isValidObjectId)(adminId)) return null;

    // Updated allowed fields to include firstName, lastName, profilePictureUrl
    const allowed = ["firstName", "lastName", "contactNumber", "email", "status", "profilePictureUrl"];
    const sanitized = {};
    for (const f of allowed) {
        if (f in updates) sanitized[f] = updates[f];
    }

    return models_1.AdminModel
        .findByIdAndUpdate(adminId, { $set: sanitized }, { new: true })
        .select("-passwordHash")
        .lean();
}

// ── Legacy helpers ───────────────────────────────────────────────────────────
async function listUsers() {
    const students = await models_1.StudentModel.find({})
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .lean();
    const admins = await models_1.AdminModel.find({})
        .select("-passwordHash")
        .lean();
    const vendors = await listVendors();
    
    return [...students, ...admins, ...vendors].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
}

async function getUserById(userId) {
    if (!(0, ids_1.isValidObjectId)(userId)) return null;
    
    let user = await models_1.StudentModel.findById(userId)
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .lean();
    
    if (!user) {
        user = await models_1.AdminModel.findById(userId)
            .select("-passwordHash")
            .lean();
    }
    
    return user || null;
}

async function updateUser(userId, updates) {
    if (!(0, ids_1.isValidObjectId)(userId)) return null;
    
    let user = await models_1.StudentModel.findById(userId);
    if (user) {
        return updateStudent(userId, updates, true);
    }
    
    let admin = await models_1.AdminModel.findById(userId);
    if (admin) {
        return updateAdmin(userId, updates);
    }
    
    return null;
}