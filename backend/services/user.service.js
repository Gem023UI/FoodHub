"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers      = listUsers;
exports.getUserById    = getUserById;
exports.updateUser     = updateUser;
exports.listStudents   = listStudents;
exports.listVendors    = listVendors;
exports.updateStudent  = updateStudent;
exports.updateVendor   = updateVendor;
exports.listAdmins     = listAdmins;
exports.createAdmin    = createAdmin;
exports.updateAdmin    = updateAdmin;

const models_1  = require("../models");
const ids_1     = require("../utils/ids");
const bcryptjs_1 = require("bcryptjs");

// ── Legacy UserModel helpers (kept for any remaining references) ─────────────

async function listUsers() {
  return models_1.UserModel.find({})
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .sort({ createdAt: -1 })
    .lean();
}

async function getUserById(userId) {
  if (!(0, ids_1.isValidObjectId)(userId)) return null;
  return models_1.UserModel.findById(userId)
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .lean();
}

async function updateUser(userId, updates) {
  if (!(0, ids_1.isValidObjectId)(userId)) return null;

  const allowedFields = [
    "firstName", "lastName", "email", "profilePictureUrl",
    "birthday", "tuptId", "course", "section",
    "contactNumber", "proofOfLegitimacyUrl",
    "role", "isActive", "status",
  ];

  const sanitizedUpdates = {};
  for (const field of allowedFields) {
    if (field in updates) sanitizedUpdates[field] = updates[field];
  }
  if ("status" in sanitizedUpdates) {
    sanitizedUpdates.isActive = sanitizedUpdates.status === "verified";
  }

  return models_1.UserModel
    .findByIdAndUpdate(userId, { $set: sanitizedUpdates }, { new: true })
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .lean();
}

// ── Student helpers ──────────────────────────────────────────────────────────

async function listStudents() {
  return models_1.StudentModel.find({})
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .sort({ createdAt: -1 })
    .lean();
}

async function updateStudent(studentId, updates) {
  if (!(0, ids_1.isValidObjectId)(studentId)) return null;

  const allowed = [
    "firstName", "lastName", "email", "profilePictureUrl",
    "birthday", "tuptId", "course", "section",
    "contactNumber", "isActive", "status",
  ];
  const sanitized = {};
  for (const f of allowed) {
    if (f in updates) sanitized[f] = updates[f];
  }
  if ("status" in sanitized) {
    sanitized.isActive = sanitized.status === "verified";
  }

  return models_1.StudentModel
    .findByIdAndUpdate(studentId, { $set: sanitized }, { new: true })
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .lean();
}

// ── Vendor helpers ───────────────────────────────────────────────────────────

async function listVendors() {
  return models_1.VendorModel.find({})
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .sort({ createdAt: -1 })
    .lean();
}

async function updateVendor(vendorId, updates) {
  if (!(0, ids_1.isValidObjectId)(vendorId)) return null;

  const allowed = [
    "firstName", "lastName", "email", "profilePictureUrl",
    "contactNumber", "proofOfLegitimacyUrl",
    "isActive", "status",
  ];
  const sanitized = {};
  for (const f of allowed) {
    if (f in updates) sanitized[f] = updates[f];
  }
  if ("status" in sanitized) {
    sanitized.isActive = sanitized.status === "verified";
  }

  return models_1.VendorModel
    .findByIdAndUpdate(vendorId, { $set: sanitized }, { new: true })
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .lean();
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
    firstName:     data.firstName,
    lastName:      data.lastName,
    contactNumber: data.contactNumber ?? null,
    email:         data.email,
    passwordHash,
    status:        data.status ?? "active",
    isActive:      data.status ? data.status === "active" : true,
  });
}

async function updateAdmin(adminId, updates) {
  if (!(0, ids_1.isValidObjectId)(adminId)) return null;

  const allowed = [
    "firstName", "lastName", "contactNumber", "email", "status", "isActive",
  ];
  const sanitized = {};
  for (const f of allowed) {
    if (f in updates) sanitized[f] = updates[f];
  }
  if ("status" in sanitized) {
    sanitized.isActive = sanitized.status === "active";
  }

  return models_1.AdminModel
    .findByIdAndUpdate(adminId, { $set: sanitized }, { new: true })
    .select("-passwordHash")
    .lean();
}