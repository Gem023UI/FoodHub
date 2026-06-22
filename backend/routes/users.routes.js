"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const user_service_1 = require("../services/user.service");
const user_model_1 = require("../models/user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const usersRouter = (0, express_1.Router)();
exports.usersRouter = usersRouter;
function firstParam(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
// Get all users (admin only)
usersRouter.get("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const users = await (0, user_service_1.listUsers)();
        response.json({ users });
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch users." });
    }
});
// Get current user profile
usersRouter.get("/:userId", auth_1.authenticateRequest, async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) {
        response.status(400).json({ message: "Invalid user id." });
        return;
    }
    // Users can only access their own profile unless they're admin
    if (request.role !== "admin" && request.userId !== userId) {
        response.status(403).json({ message: "You can only access your own profile." });
        return;
    }
    try {
        const user = await (0, user_service_1.updateUser)(userId, {}); // Get without updating
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        response.json(user);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch user." });
    }
});
// Update user profile
usersRouter.patch("/:userId", auth_1.authenticateRequest, async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) {
        response.status(400).json({ message: "Invalid user id." });
        return;
    }
    // Users can only update their own profile unless they're admin
    if (request.role !== "admin" && request.userId !== userId) {
        response.status(403).json({ message: "You can only update your own profile." });
        return;
    }
    const { name, email, profilePictureUrl, studentId, courseSection, schoolEmail, contactNumber, role, isActive, status } = request.body;
    try {
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (email !== undefined)
            updates.email = email;
        if (profilePictureUrl !== undefined)
            updates.profilePictureUrl = profilePictureUrl;
        if (studentId !== undefined)
            updates.studentId = studentId;
        if (courseSection !== undefined)
            updates.courseSection = courseSection;
        if (schoolEmail !== undefined)
            updates.schoolEmail = schoolEmail;
        if (contactNumber !== undefined)
            updates.contactNumber = contactNumber;
        // Only admins can change role and isActive
        if (request.role === "admin") {
            if (role !== undefined)
                updates.role = role;
            if (isActive !== undefined)
                updates.isActive = isActive;
            if (status !== undefined) {
                updates.status = status;
                updates.isActive = status === "Active";
            }
        }
        const user = await (0, user_service_1.updateUser)(userId, updates);
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        response.json(user);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to update user." });
    }
});
// Create user (admin only)
usersRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const { name, email, password, role, isActive, status } = request.body;
    if (!name || !email || !password) {
        response.status(400).json({ message: "Name, email, and password are required." });
        return;
    }
    try {
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.UserModel.create({
            name,
            email,
            passwordHash,
            role: role ?? "user",
            status: status ?? "Active",
            isActive: status ? (status === "Active") : (isActive !== false)
        });
        response.status(201).json({
            user: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    }
    catch (error) {
        if (error && error.code === 11000) {
            response.status(409).json({ message: "An account with that email already exists." });
            return;
        }
        response.status(500).json({ message: "Failed to create user." });
    }
});
// Delete user (admin only)
usersRouter.delete("/:userId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) {
        response.status(400).json({ message: "Invalid user id." });
        return;
    }
    try {
        const user = await user_model_1.UserModel.findByIdAndDelete(userId);
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        response.status(204).end();
    }
    catch (error) {
        response.status(500).json({ message: "Failed to delete user." });
    }
});
