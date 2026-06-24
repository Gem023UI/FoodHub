"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;

const express_1    = require("express");
const auth_1       = require("../middleware/auth");
const user_service_1 = require("../services/user.service");
const user_model_1 = require("../models/user.model");
const bcryptjs_1   = __importDefault(require("bcryptjs"));

const usersRouter = (0, express_1.Router)();
exports.usersRouter = usersRouter;

function firstParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

// ── GET all users (admin only) ───────────────────────────────────────────────
usersRouter.get(
  "/",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    try {
      const users = await (0, user_service_1.listUsers)();
      response.json({ users });
    } catch {
      response.status(500).json({ message: "Failed to fetch users." });
    }
  }
);

// ── GET single user profile ──────────────────────────────────────────────────
usersRouter.get(
  "/:userId",
  auth_1.authenticateRequest,
  async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) { response.status(400).json({ message: "Invalid user id." }); return; }

    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only access your own profile." });
      return;
    }

    try {
      const user = await (0, user_service_1.getUserById)(userId);
      if (!user) { response.status(404).json({ message: "User not found." }); return; }
      response.json(user);
    } catch {
      response.status(500).json({ message: "Failed to fetch user." });
    }
  }
);

// ── PATCH update user ────────────────────────────────────────────────────────
usersRouter.patch(
  "/:userId",
  auth_1.authenticateRequest,
  async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) { response.status(400).json({ message: "Invalid user id." }); return; }

    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only update your own profile." });
      return;
    }

    const {
      firstName, lastName, email, profilePictureUrl,
      birthday, tuptId, course, section,
      contactNumber, proofOfLegitimacyUrl,
      role, isActive, status,
    } = request.body;

    const updates = {};
    if (firstName !== undefined)             updates.firstName = firstName;
    if (lastName !== undefined)              updates.lastName = lastName;
    if (email !== undefined)                 updates.email = email;
    if (profilePictureUrl !== undefined)     updates.profilePictureUrl = profilePictureUrl;
    if (birthday !== undefined)              updates.birthday = birthday;
    if (tuptId !== undefined)                updates.tuptId = tuptId;
    if (course !== undefined)                updates.course = course;
    if (section !== undefined)               updates.section = section;
    if (contactNumber !== undefined)         updates.contactNumber = contactNumber;
    if (proofOfLegitimacyUrl !== undefined)  updates.proofOfLegitimacyUrl = proofOfLegitimacyUrl;

    // Admin-only fields
    if (request.role === "admin") {
      if (role !== undefined)     updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (status !== undefined)   updates.status = status;
    }

    try {
      const user = await (0, user_service_1.updateUser)(userId, updates);
      if (!user) { response.status(404).json({ message: "User not found." }); return; }
      response.json(user);
    } catch {
      response.status(500).json({ message: "Failed to update user." });
    }
  }
);

// ── POST create user (admin only) ────────────────────────────────────────────
usersRouter.post(
  "/",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const {
      firstName, lastName, email, password,
      role, isActive, status,
    } = request.body;

    if (!firstName || !lastName || !email || !password) {
      response.status(400).json({ message: "firstName, lastName, email, and password are required." });
      return;
    }

    try {
      const passwordHash = await bcryptjs_1.default.hash(password, 10);
      const user = await user_model_1.UserModel.create({
        firstName,
        lastName,
        email,
        passwordHash,
        role:     role   ?? "student",
        status:   status ?? "verified",
        isActive: isActive !== false,
      });
      response.status(201).json({
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          role:      user.role,
          isActive:  user.isActive,
        },
      });
    } catch (error) {
      if (error && error.code === 11000) {
        response.status(409).json({ message: "An account with that email already exists." });
        return;
      }
      response.status(500).json({ message: "Failed to create user." });
    }
  }
);

// ── DELETE user (admin only) ─────────────────────────────────────────────────
usersRouter.delete(
  "/:userId",
  auth_1.authenticateRequest,
  (0, auth_1.authorizeRoles)("admin"),
  async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) { response.status(400).json({ message: "Invalid user id." }); return; }

    try {
      const user = await user_model_1.UserModel.findByIdAndDelete(userId);
      if (!user) { response.status(404).json({ message: "User not found." }); return; }
      response.status(204).end();
    } catch {
      response.status(500).json({ message: "Failed to delete user." });
    }
  }
);