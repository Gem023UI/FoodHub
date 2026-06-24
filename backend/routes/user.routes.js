"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;

const express_1      = require("express");
const auth_1         = require("../middleware/auth");
const user_service_1 = require("../services/user.service");
const models_1       = require("../models");
const bcryptjs_1     = __importDefault(require("bcryptjs"));

const usersRouter = (0, express_1.Router)();
exports.usersRouter = usersRouter;

function firstParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

// ════════════════════════════════
// STUDENT ROUTES
// ════════════════════════════════

// GET all students (admin only)
usersRouter.get(
  "/students",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    try {
      const students = await (0, user_service_1.listStudents)();
      response.json({ students });
    } catch {
      response.status(500).json({ message: "Failed to fetch students." });
    }
  }
);

// GET single student
usersRouter.get(
  "/students/:id",
  auth_1.authenticateRequest,
  async (request, response) => {
    const id = firstParam(request.params.id);
    if (request.role !== "admin" && request.userId !== id) {
      response.status(403).json({ message: "You can only access your own profile." });
      return;
    }
    try {
      const student = await models_1.StudentModel.findById(id)
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .lean();
      if (!student) { response.status(404).json({ message: "Student not found." }); return; }
      response.json(student);
    } catch {
      response.status(500).json({ message: "Failed to fetch student." });
    }
  }
);

// PATCH update student
usersRouter.patch(
  "/students/:id",
  auth_1.authenticateRequest,
  async (request, response) => {
    const id = firstParam(request.params.id);
    if (request.role !== "admin" && request.userId !== id) {
      response.status(403).json({ message: "You can only update your own profile." });
      return;
    }
    try {
      const updates = request.body;
      // Non-admins cannot change status or isActive
      if (request.role !== "admin") {
        delete updates.status;
        delete updates.isActive;
      }
      const student = await (0, user_service_1.updateStudent)(id, updates);
      if (!student) { response.status(404).json({ message: "Student not found." }); return; }
      response.json(student);
    } catch {
      response.status(500).json({ message: "Failed to update student." });
    }
  }
);

// DELETE student (admin only)
usersRouter.delete(
  "/students/:id",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const id = firstParam(request.params.id);
    try {
      const student = await models_1.StudentModel.findByIdAndDelete(id);
      if (!student) { response.status(404).json({ message: "Student not found." }); return; }
      response.status(204).end();
    } catch {
      response.status(500).json({ message: "Failed to delete student." });
    }
  }
);

// ════════════════════════════════
// VENDOR ROUTES
// ════════════════════════════════

// GET all vendors (admin only)
usersRouter.get(
  "/vendors",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    try {
      const vendors = await (0, user_service_1.listVendors)();
      response.json({ vendors });
    } catch {
      response.status(500).json({ message: "Failed to fetch vendors." });
    }
  }
);

// GET single vendor
usersRouter.get(
  "/vendors/:id",
  auth_1.authenticateRequest,
  async (request, response) => {
    const id = firstParam(request.params.id);
    if (request.role !== "admin" && request.userId !== id) {
      response.status(403).json({ message: "You can only access your own profile." });
      return;
    }
    try {
      const vendor = await models_1.VendorModel.findById(id)
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .lean();
      if (!vendor) { response.status(404).json({ message: "Vendor not found." }); return; }
      response.json(vendor);
    } catch {
      response.status(500).json({ message: "Failed to fetch vendor." });
    }
  }
);

// PATCH update vendor
usersRouter.patch(
  "/vendors/:id",
  auth_1.authenticateRequest,
  async (request, response) => {
    const id = firstParam(request.params.id);
    if (request.role !== "admin" && request.userId !== id) {
      response.status(403).json({ message: "You can only update your own profile." });
      return;
    }
    try {
      const updates = request.body;
      if (request.role !== "admin") {
        delete updates.status;
        delete updates.isActive;
      }
      const vendor = await (0, user_service_1.updateVendor)(id, updates);
      if (!vendor) { response.status(404).json({ message: "Vendor not found." }); return; }
      response.json(vendor);
    } catch {
      response.status(500).json({ message: "Failed to update vendor." });
    }
  }
);

// DELETE vendor (admin only)
usersRouter.delete(
  "/vendors/:id",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const id = firstParam(request.params.id);
    try {
      const vendor = await models_1.VendorModel.findByIdAndDelete(id);
      if (!vendor) { response.status(404).json({ message: "Vendor not found." }); return; }
      response.status(204).end();
    } catch {
      response.status(500).json({ message: "Failed to delete vendor." });
    }
  }
);

// ════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════

// GET all admins (admin only)
usersRouter.get(
  "/admins",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    try {
      const admins = await (0, user_service_1.listAdmins)();
      response.json({ admins });
    } catch {
      response.status(500).json({ message: "Failed to fetch admins." });
    }
  }
);

// GET single admin
usersRouter.get(
  "/admins/:id",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const id = firstParam(request.params.id);
    try {
      const admin = await models_1.AdminModel.findById(id)
        .select("-passwordHash")
        .lean();
      if (!admin) { response.status(404).json({ message: "Admin not found." }); return; }
      response.json(admin);
    } catch {
      response.status(500).json({ message: "Failed to fetch admin." });
    }
  }
);

// POST create admin (admin only)
usersRouter.post(
  "/admins",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const { firstName, lastName, contactNumber, email, password, status } = request.body;
    if (!firstName || !lastName || !email || !password) {
      response.status(400).json({ message: "firstName, lastName, email, and password are required." });
      return;
    }
    try {
      const admin = await (0, user_service_1.createAdmin)({ firstName, lastName, contactNumber, email, password, status });
      response.status(201).json({
        admin: {
          _id:           admin._id.toString(),
          firstName:     admin.firstName,
          lastName:      admin.lastName,
          contactNumber: admin.contactNumber,
          email:         admin.email,
          status:        admin.status,
          role:          admin.role,
        },
      });
    } catch (error) {
      if (error && error.code === 11000) {
        response.status(409).json({ message: "An admin with that email already exists." });
        return;
      }
      response.status(500).json({ message: "Failed to create admin." });
    }
  }
);

// PATCH update admin (admin only)
usersRouter.patch(
  "/admins/:id",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const id = firstParam(request.params.id);
    try {
      const admin = await (0, user_service_1.updateAdmin)(id, request.body);
      if (!admin) { response.status(404).json({ message: "Admin not found." }); return; }
      response.json(admin);
    } catch {
      response.status(500).json({ message: "Failed to update admin." });
    }
  }
);

// DELETE admin (admin only)
usersRouter.delete(
  "/admins/:id",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const id = firstParam(request.params.id);
    try {
      const admin = await models_1.AdminModel.findByIdAndDelete(id);
      if (!admin) { response.status(404).json({ message: "Admin not found." }); return; }
      response.status(204).end();
    } catch {
      response.status(500).json({ message: "Failed to delete admin." });
    }
  }
);

// ════════════════════════════════
// LEGACY — generic /:userId routes
// kept so existing JWT-authenticated
// profile fetches don't break
// ════════════════════════════════

usersRouter.get(
  "/:userId",
  auth_1.authenticateRequest,
  async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only access your own profile." });
      return;
    }
    try {
      // Search across all three collections
      let user = await models_1.StudentModel.findById(userId)
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires").lean();
      if (!user) user = await models_1.VendorModel.findById(userId)
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires").lean();
      if (!user) user = await models_1.AdminModel.findById(userId)
        .select("-passwordHash").lean();
      if (!user) { response.status(404).json({ message: "User not found." }); return; }
      response.json(user);
    } catch {
      response.status(500).json({ message: "Failed to fetch user." });
    }
  }
);

usersRouter.patch(
  "/:userId",
  auth_1.authenticateRequest,
  async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only update your own profile." });
      return;
    }
    try {
      const updates = request.body;
      if (request.role !== "admin") {
        delete updates.status;
        delete updates.isActive;
      }
      // Route update to correct collection based on caller's role
      let updated = null;
      if (request.role === "student") {
        updated = await (0, user_service_1.updateStudent)(userId, updates);
      } else if (request.role === "vendor") {
        updated = await (0, user_service_1.updateVendor)(userId, updates);
      } else if (request.role === "admin") {
        updated = await (0, user_service_1.updateAdmin)(userId, updates);
      }
      if (!updated) { response.status(404).json({ message: "User not found." }); return; }
      response.json(updated);
    } catch {
      response.status(500).json({ message: "Failed to update user." });
    }
  }
);

const { createVendorUpload } = require("../utils/cloudinary");
const vendorUpload = createVendorUpload();

// POST /api/users/vendor-proof-upload
usersRouter.post(
  "/vendor-proof-upload",
  vendorUpload.single("proof"),
  (request, response) => {
    if (!request.file) {
      response.status(400).json({ message: "No file uploaded." });
      return;
    }
    response.json({ url: request.file.path });
  }
);