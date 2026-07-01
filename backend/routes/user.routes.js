"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const user_service_1 = require("../services/user.service");
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
    
    console.log(`🔍 /me route called: userId=${userId}, role=${role}`);

    if (!userId) {
        console.log("❌ No userId found in request");
        response.status(401).json({ message: "Unauthorized - No user ID found." });
        return;
    }

    try {
        let user = null;
        
        if (role === "student") {
            console.log("🔍 Fetching student...");
            user = await models_1.StudentModel.findById(userId)
                .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
                .lean();
        } else if (role === "vendor") {
            console.log("🔍 Fetching vendor...");
            const vendorData = await models_1.VendorModel.findById(userId)
                .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
                .populate('stallId', 'name location photos openingHours paymentMethods paymentDetails')
                .lean();
            
            console.log(`🔍 Vendor found: ${vendorData ? vendorData.email : 'Not found'}`);
            console.log(`🔍 Vendor stallId raw:`, vendorData?.stallId);
            
            // Create a clean user object with both stallId (as string) and populated stall
            if (vendorData) {
                // Extract stallId as string
                const stallIdString = vendorData.stallId?._id?.toString() || vendorData.stallId?.toString() || null;
                
                user = {
                    ...vendorData,
                    // Keep the populated stall as a separate property
                    stallData: vendorData.stallId || null,
                    // Set stallId as string for frontend compatibility
                    stallId: stallIdString
                };
                
                console.log(`🔍 Vendor stallId (as string): ${user.stallId}`);
            }
            
            // Validate vendor has a stall
            if (user && !user.stallId) {
                console.warn(`⚠️ Vendor ${user.email} has no stall assigned!`);
            }
        } else if (role === "admin") {
            console.log("🔍 Fetching admin...");
            user = await models_1.AdminModel.findById(userId)
                .select("-passwordHash")
                .lean();
        }
        
        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            response.status(404).json({ message: "User not found." });
            return;
        }
        
        console.log(`✅ User found: ${user.email}`);
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
        let user = await models_1.StudentModel.findById(userId)
            .select("-passwordHash -emailVerificationCode -emailVerificationExpires").lean();
        if (!user) user = await models_1.VendorModel.findById(userId)
            .select("-passwordHash -emailVerificationCode -emailVerificationExpires").lean();
        if (!user) user = await models_1.AdminModel.findById(userId)
            .select("-passwordHash").lean();
            
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
        if (request.role !== "admin") {
            delete updates.status;
            delete updates.isActive;
            delete updates.role;
        }

        let updated = null;
        if (request.role === "student") {
            updated = await (0, user_service_1.updateStudent)(userId, updates);
        } else if (request.role === "vendor") {
            updated = await (0, user_service_1.updateVendor)(userId, updates);
        } else if (request.role === "admin") {
            updated = await (0, user_service_1.updateAdmin)(userId, updates);
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
        const students = await (0, user_service_1.listStudents)();
        response.json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        response.status(500).json({ message: "Failed to fetch students." });
    }
});

usersRouter.patch("/students/:id", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const id = firstParam(request.params.id);
    try {
        const student = await (0, user_service_1.updateStudent)(id, request.body);
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
        const vendors = await (0, user_service_1.listVendors)();
        response.json({ vendors });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        response.status(500).json({ message: "Failed to fetch vendors." });
    }
});

usersRouter.patch("/vendors/:id", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const id = firstParam(request.params.id);
    try {
        const vendor = await (0, user_service_1.updateVendor)(id, request.body);
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

usersRouter.delete("/vendors/:id", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const id = firstParam(request.params.id);
    try {
        const vendor = await models_1.VendorModel.findByIdAndDelete(id);
        if (!vendor) {
            response.status(404).json({ message: "Vendor not found." });
            return;
        }
        response.status(204).end();
    } catch (error) {
        console.error("Error deleting vendor:", error);
        response.status(500).json({ message: "Failed to delete vendor." });
    }
});

// ─── VENDOR PROOF UPLOAD ──────────────────────────────────────────────
const { createVendorUpload } = require("../utils/cloudinary");
const vendorUpload = createVendorUpload();

usersRouter.post("/vendor-proof-upload", vendorUpload.single("proof"), (request, response) => {
    if (!request.file) {
        response.status(400).json({ message: "No file uploaded." });
        return;
    }
    response.json({ url: request.file.path });
});