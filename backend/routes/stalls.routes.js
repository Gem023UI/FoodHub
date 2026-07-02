"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.stallsRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const stall_controller_1 = require("../controllers/stall.controller");
const order_controller_1 = require("../controllers/order.controller");

const stallsRouter = (0, express_1.Router)();
exports.stallsRouter = stallsRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── LIST STALLS ────────────────────────────────────────────────────────
stallsRouter.get("/", async (request, response) => {
    try {
        const stalls = await (0, stall_controller_1.listStalls)(request.query);
        response.json({ stalls });
    } catch (error) {
        console.error("Error listing stalls:", error);
        response.status(500).json({ message: "Failed to fetch stalls." });
    }
});

// ── GET STALL CARD ──────────────────────────────────────────────────────
stallsRouter.get("/card/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const stall = await (0, stall_controller_1.getStallCard)(stallId);
        if (!stall) return response.status(404).json({ message: "Stall not found." });
        response.json({ stall });
    } catch (error) {
        console.error("Error fetching stall card:", error);
        response.status(500).json({ message: "Failed to fetch stall." });
    }
});

// ── GET STALL DETAILS ──────────────────────────────────────────────────
stallsRouter.get("/details/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const stall = await (0, stall_controller_1.getStallDetails)(stallId);
        if (!stall) return response.status(404).json({ message: "Stall not found." });
        response.json({ stall });
    } catch (error) {
        console.error("Error fetching stall details:", error);
        response.status(500).json({ message: "Failed to fetch stall." });
    }
});

// ── VENDOR'S OWN STALL ────────────────────────────────────────────────
stallsRouter.get("/vendor/my", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor"), async (request, response) => {
    try {
        const stall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
        if (!stall) return response.status(404).json({ message: "No stall assigned." });
        response.json({ stall });
    } catch (error) {
        console.error("Error fetching vendor stall:", error);
        response.status(500).json({ message: "Failed to fetch stall." });
    }
});

// ── GET STALL PRODUCTS BY CATEGORY ──────────────────────────────────────
stallsRouter.get("/:stallId/products/category/:category", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const category = firstParam(request.params.category);
    try {
        const products = await (0, stall_controller_1.listProductsForStall)(stallId, { category, available: true });
        response.json({ products });
    } catch (error) {
        console.error("Error fetching products by category:", error);
        response.status(500).json({ message: "Failed to fetch products." });
    }
});

// ── GET STALL PRODUCT REVIEWS ──────────────────────────────────────────
stallsRouter.get("/:stallId/products/reviews", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const stall = await models_1.StallModel.findById(stallId);
        if (!stall) return response.status(404).json({ message: "Stall not found." });
        
        const allReviews = [];
        for (const product of stall.products || []) {
            for (const review of product.reviews || []) {
                allReviews.push({
                    ...review.toObject(),
                    productName: product.productName,
                    productId: product._id
                });
            }
        }
        allReviews.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
        response.json({ reviews: allReviews });
    } catch (error) {
        console.error("Error fetching product reviews:", error);
        response.status(500).json({ message: "Failed to fetch reviews." });
    }
});

// ── GET STALL VENDORS ──────────────────────────────────────────────────
stallsRouter.get("/:stallId/vendors", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const vendors = await (0, stall_controller_1.getVendorsByStall)(stallId);
        response.json({ vendors });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        response.status(500).json({ message: "Failed to fetch vendors." });
    }
});

// ── GET VENDOR PROFILE ──────────────────────────────────────────────────
stallsRouter.get("/vendor/profile", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor"), async (request, response) => {
    try {
        const vendor = await models_1.StudentModel.findById(request.userId).select("email");
        if (!vendor) return response.status(404).json({ message: "Vendor not found." });
        
        const profile = await (0, stall_controller_1.getVendorProfile)(vendor.email);
        if (!profile) return response.status(404).json({ message: "Vendor profile not found." });
        response.json({ vendor: profile });
    } catch (error) {
        console.error("Error fetching vendor profile:", error);
        response.status(500).json({ message: "Failed to fetch vendor profile." });
    }
});

// ── GET STALL ORDERS BY STATUS ──────────────────────────────────────────
stallsRouter.get("/:stallId/orders", auth_1.authenticateRequest, async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const { status } = request.query;
    
    try {
        // Verify user has access
        const isAdmin = request.role === "admin";
        const isVendor = request.role === "vendor";
        
        if (isVendor) {
            const stall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!stall || stall._id.toString() !== stallId) {
                return response.status(403).json({ message: "Unauthorized to view these orders." });
            }
        }

        let orders = await (0, order_controller_1.getStallOrders)(stallId);
        
        if (status) {
            orders = orders.filter(o => o.orderStatus === status);
        }
        
        response.json({ orders });
    } catch (error) {
        console.error("Error fetching stall orders:", error);
        response.status(500).json({ message: "Failed to fetch orders." });
    }
});

// ── STALL CRUD ────────────────────────────────────────────────────────
stallsRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const stall = await (0, stall_controller_1.createStall)(request.body);
        response.status(201).json({ stall });
    } catch (error) {
        console.error("Error creating stall:", error);
        response.status(500).json({ message: error.message || "Failed to create stall." });
    }
});

stallsRouter.patch("/:stallId", auth_1.authenticateRequest, async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const allowed = await (0, stall_controller_1.canManageStall)(stallId, request.userId, request.role);
        if (!allowed) return response.status(403).json({ message: "Not authorized to manage this stall." });

        const stall = await (0, stall_controller_1.updateStall)(stallId, request.body);
        if (!stall) return response.status(404).json({ message: "Stall not found." });
        response.json({ stall });
    } catch (error) {
        console.error("Error updating stall:", error);
        response.status(500).json({ message: "Failed to update stall." });
    }
});

stallsRouter.delete("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const ok = await (0, stall_controller_1.deleteStall)(stallId);
        if (!ok) return response.status(404).json({ message: "Stall not found." });
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting stall:", error);
        response.status(500).json({ message: "Failed to delete stall." });
    }
});

// ── PRODUCT CRUD ──────────────────────────────────────────────────────
stallsRouter.post("/:stallId/products", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const allowed = await (0, stall_controller_1.canManageStall)(stallId, request.userId, request.role);
        if (!allowed) return response.status(403).json({ message: "Not authorized to manage this stall." });

        const product = await (0, stall_controller_1.createProduct)(stallId, request.body);
        if (!product) return response.status(404).json({ message: "Stall not found." });
        response.status(201).json({ product });
    } catch (error) {
        console.error("Error creating product:", error);
        response.status(500).json({ message: "Failed to create product." });
    }
});

stallsRouter.patch("/products/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const productId = firstParam(request.params.productId);
    try {
        const updated = await (0, stall_controller_1.updateProduct)(productId, request.body);
        if (!updated) return response.status(404).json({ message: "Product not found." });
        response.json({ product: updated });
    } catch (error) {
        console.error("Error updating product:", error);
        response.status(500).json({ message: "Failed to update product." });
    }
});

stallsRouter.delete("/products/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const productId = firstParam(request.params.productId);
    try {
        const ok = await (0, stall_controller_1.deleteProduct)(productId);
        if (!ok) return response.status(404).json({ message: "Product not found." });
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting product:", error);
        response.status(500).json({ message: "Failed to delete product." });
    }
});

// ── VENDOR ROSTER CRUD ──────────────────────────────────────────────────
stallsRouter.post("/:stallId/vendors", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const vendor = await (0, stall_controller_1.addVendorToStall)(stallId, request.body);
        if (!vendor) return response.status(400).json({ message: "Vendor already exists or stall not found." });
        response.status(201).json({ vendor });
    } catch (error) {
        console.error("Error adding vendor:", error);
        response.status(500).json({ message: "Failed to add vendor." });
    }
});

stallsRouter.patch("/vendors/:vendorEmail", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const vendorEmail = firstParam(request.params.vendorEmail);
    try {
        const vendor = await (0, stall_controller_1.updateVendorRoster)(vendorEmail, request.body);
        if (!vendor) return response.status(404).json({ message: "Vendor not found." });
        response.json({ vendor });
    } catch (error) {
        console.error("Error updating vendor:", error);
        response.status(500).json({ message: "Failed to update vendor." });
    }
});

stallsRouter.delete("/vendors/:vendorEmail", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const vendorEmail = firstParam(request.params.vendorEmail);
    try {
        const ok = await (0, stall_controller_1.removeVendorFromStall)(vendorEmail);
        if (!ok) return response.status(404).json({ message: "Vendor not found." });
        response.status(204).send();
    } catch (error) {
        console.error("Error removing vendor:", error);
        response.status(500).json({ message: "Failed to remove vendor." });
    }
});