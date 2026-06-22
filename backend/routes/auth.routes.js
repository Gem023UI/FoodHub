"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_service_1 = require("../services/auth.service");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
authRouter.post("/register", async (request, response) => {
    const { name, email, password, role, studentId, courseSection, schoolEmail, contactNumber } = request.body;
    if (!name || !email || !password) {
        response.status(400).json({ message: "name, email, and password are required." });
        return;
    }
    if (password.length < 8) {
        response.status(400).json({ message: "Password must be at least 8 characters long." });
        return;
    }
    try {
        const result = await (0, auth_service_1.registerUser)({
            name,
            email,
            password,
            role,
            studentId,
            courseSection,
            schoolEmail,
            contactNumber
        });
        response.status(201).json(result);
    }
    catch (error) {
        if ((0, auth_service_1.isDuplicateEmailError)(error)) {
            response.status(409).json({ message: "An account with that email already exists." });
            return;
        }
        response.status(500).json({ message: "Failed to register user." });
    }
});
authRouter.post("/login", async (request, response) => {
    const { email, password } = request.body;
    if (!email || !password) {
        response.status(400).json({ message: "email and password are required." });
        return;
    }
    try {
        const result = await (0, auth_service_1.loginUser)({ email, password });
        if (!result.success) {
            if (result.reason === "suspended") {
                response.status(403).json({ message: "Your account has been suspended by an administrator." });
            }
            else {
                response.status(401).json({ message: "Invalid email or password." });
            }
            return;
        }
        response.json(result.data);
    }
    catch {
        response.status(500).json({ message: "Failed to log in." });
    }
});
authRouter.get("/me", auth_1.authenticateRequest, (request, response) => {
    response.json({ userId: request.userId, role: request.role });
});
