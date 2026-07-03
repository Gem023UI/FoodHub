"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const user_controller_1 = require("../controllers/user.controller");
const stall_controller_1 = require("../controllers/stall.controller");
const cloudinary_1 = require("../utils/cloudinary");

const usersRouter = (0, express_1.Router)();
exports.usersRouter = usersRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ─── GET CURRENT USER ──────────────────────────────────────────────────
usersRouter.get("/me", auth_1.authenticateRequest, async (request, response) => {
    const userId = request.userId;
    const role = request.role;

    try {
        let user = null;
        
        if (role === "student") {
            user = await models_1.StudentModel.findById(userId)
                .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
                .lean();
        } else if (role === "vendor") {
            const student = await models_1.StudentModel.findById(userId)
                .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
                .lean();
            
            if (student) {
                const stall = await models_1.StallModel.findOne({ "vendors.email": student.email });
                if (stall) {
                    const vendorSub = stall.vendors.find(v => v.email === student.email);
                    user = {
                        ...student,
                        stallId: stall._id,
                        stallName: stall.stallName,
                        position: vendorSub?.position,
                        vendorStatus: vendorSub?.status
                    };
                } else {
                    user = student;
                }
            }
        } else if (role === "admin") {
            user = await models_1.AdminModel.findById(userId)
                .select("-passwordHash")
                .lean();
        }
        
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        
        response.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        response.status(500).json({ message: "Failed to fetch user." });
    }
});

// ─── GET USER BY ID ────────────────────────────────────────────────────
usersRouter.get("/:userId", auth_1.authenticateRequest, async (request, response) => {
    const userId = firstParam(request.params.userId);
    
    if (request.role !== "admin" && request.userId !== userId) {
        response.status(403).json({ message: "You can only access your own profile." });
        return;
    }

    try {
        let user = await (0, user_controller_1.getUserById)(userId);
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        response.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        response.status(500).json({ message: "Failed to fetch user." });
    }
});

// ─── UPDATE USER ──────────────────────────────────────────────────────
usersRouter.patch("/:userId", auth_1.authenticateRequest, async (request, response) => {
    const userId = firstParam(request.params.userId);
    
    if (request.role !== "admin" && request.userId !== userId) {
        response.status(403).json({ message: "You can only update your own profile." });
        return;
    }

    try {
        const updates = request.body;
        let updated = null;
        
        if (request.role === "student") {
            const isAdmin = request.role === "admin";
            updated = await (0, user_controller_1.updateStudent)(userId, updates, isAdmin);
        } else if (request.role === "vendor") {
            const student = await models_1.StudentModel.findById(userId).select("email");
            if (student) {
                const isAdmin = request.role === "admin";
                updated = await (0, user_controller_1.updateVendor)(student.email, updates, isAdmin);
            }
        } else if (request.role === "admin") {
            updated = await (0, user_controller_1.updateAdmin)(userId, updates);
        }

        if (!updated) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        response.json(updated);
    } catch (error) {
        console.error("Error updating user:", error);
        response.status(500).json({ message: "Failed to update user." });
    }
});

// ─── STUDENT ROUTES ────────────────────────────────────────────────────
usersRouter.get("/students", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const students = await (0, user_controller_1.listStudents)();
        response.json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        response.status(500).json({ message: "Failed to fetch students." });
    }
});

usersRouter.patch("/students/:id", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const id = firstParam(request.params.id);
    try {
        const student = await (0, user_controller_1.updateStudent)(id, request.body, true);
        if (!student) {
            response.status(404).json({ message: "Student not found." });
            return;
        }
        response.json(student);
    } catch (error) {
        console.error("Error updating student:", error);
        response.status(500).json({ message: "Failed to update student." });
    }
});

usersRouter.delete("/students/:id", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const id = firstParam(request.params.id);
    try {
        const student = await models_1.StudentModel.findByIdAndDelete(id);
        if (!student) {
            response.status(404).json({ message: "Student not found." });
            return;
        }
        response.status(204).end();
    } catch (error) {
        console.error("Error deleting student:", error);
        response.status(500).json({ message: "Failed to delete student." });
    }
});

// ─── VENDOR ROUTES ────────────────────────────────────────────────────
usersRouter.get("/vendors", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const vendors = await (0, user_controller_1.listVendors)();
        response.json({ vendors });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        response.status(500).json({ message: "Failed to fetch vendors." });
    }
});

usersRouter.patch("/vendors/:email", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const email = firstParam(request.params.email);
    try {
        const vendor = await (0, user_controller_1.updateVendor)(email, request.body, true);
        if (!vendor) {
            response.status(404).json({ message: "Vendor not found." });
            return;
        }
        response.json(vendor);
    } catch (error) {
        console.error("Error updating vendor:", error);
        response.status(500).json({ message: "Failed to update vendor." });
    }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────
usersRouter.get("/admins", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const admins = await (0, user_controller_1.listAdmins)();
        response.json({ admins });
    } catch (error) {
        console.error("Error fetching admins:", error);
        response.status(500).json({ message: "Failed to fetch admins." });
    }
});

usersRouter.patch("/admins/:id", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const id = firstParam(request.params.id);
    try {
        const admin = await (0, user_controller_1.updateAdmin)(id, request.body);
        if (!admin) {
            response.status(404).json({ message: "Admin not found." });
            return;
        }
        response.json(admin);
    } catch (error) {
        console.error("Error updating admin:", error);
        response.status(500).json({ message: "Failed to update admin." });
    }
});

// ─── PROFILE UPLOAD ROUTES ──────────────────────────────────────────────
// Import the upload functions
const { 
    createStudentProfileUpload, 
    createVendorProfileUpload,
    createAdminProfileUpload 
} = require("../utils/cloudinary");

// Initialize the upload middleware
const studentProfileUpload = createStudentProfileUpload();
const vendorProfileUpload = createVendorProfileUpload();
const adminProfileUpload = createAdminProfileUpload();

// Student profile upload
usersRouter.post("/profile/student", auth_1.authenticateRequest, studentProfileUpload.single("profile"), (request, response) => {
    try {
        if (!request.file) {
            response.status(400).json({ message: "No file uploaded." });
            return;
        }
        console.log("✅ Student profile picture uploaded:", request.file.path);
        response.json({ url: request.file.path });
    } catch (error) {
        console.error("❌ Error uploading student profile picture:", error);
        response.status(500).json({ message: "Failed to upload picture." });
    }
});

// Vendor profile upload
usersRouter.post("/profile/vendor", auth_1.authenticateRequest, vendorProfileUpload.single("profile"), (request, response) => {
    try {
        if (!request.file) {
            response.status(400).json({ message: "No file uploaded." });
            return;
        }
        console.log("✅ Vendor profile picture uploaded:", request.file.path);
        response.json({ url: request.file.path });
    } catch (error) {
        console.error("❌ Error uploading vendor profile picture:", error);
        response.status(500).json({ message: "Failed to upload picture." });
    }
});

// Admin profile upload - FIXED
usersRouter.post("/profile/admin", auth_1.authenticateRequest, adminProfileUpload.single("profile"), (request, response) => {
    try {
        if (!request.file) {
            response.status(400).json({ message: "No file uploaded." });
            return;
        }
        console.log("✅ Admin profile picture uploaded:", request.file.path);
        response.json({ url: request.file.path });
    } catch (error) {
        console.error("❌ Error uploading admin profile picture:", error);
        response.status(500).json({ message: "Failed to upload picture." });
    }
});