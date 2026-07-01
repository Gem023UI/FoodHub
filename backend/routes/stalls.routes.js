"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.stallsRouter = void 0;

const express_1 = require("express");
const mongoose_1 = require("mongoose");
const auth_1 = require("../middleware/auth");
const review_service_1 = require("../services/review.service");
const stall_service_1 = require("../services/stall.service");
const product_service_1 = require("../services/product.service");
const models_1 = require("../models");

const stallsRouter = (0, express_1.Router)();
exports.stallsRouter = stallsRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── GET ALL STALLS ──────────────────────────────────────────────────────
stallsRouter.get("/", async (request, response) => {
    const query = {};
    if (typeof request.query.q === "string") query.q = request.query.q;
    if (typeof request.query.category === "string") query.category = request.query.category;
    if (typeof request.query.location === "string") query.location = request.query.location;
    if (typeof request.query.isActive === "string") query.isActive = request.query.isActive === "true";

    try {
        const stalls = await (0, stall_service_1.listStalls)(query);
        response.json({ stalls });
    } catch (error) {
        console.error("Error fetching stalls:", error);
        response.status(500).json({ message: "Failed to fetch stalls." });
    }
});

// ── GET AVAILABLE STALLS (for vendor registration) ─────────────────────
stallsRouter.get("/available", async (request, response) => {
    try {
        const stalls = await models_1.StallModel.find({
            $or: [
                { vendorIds: { $exists: false } },
                { vendorIds: { $size: 0 } }
            ],
            status: "approved"
        }).select("_id name location photos");
        
        response.json({ stalls });
    } catch (error) {
        console.error("Error fetching available stalls:", error);
        response.status(500).json({ message: "Failed to fetch available stalls." });
    }
});

// ── GET VENDOR'S STALL ─────────────────────────────────────────────────
stallsRouter.get("/vendor/my", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    if (!request.userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }

    try {
        const vendor = await models_1.VendorModel.findById(request.userId).select("stallId");
        if (!vendor || !vendor.stallId) {
            response.json({ stall: null });
            return;
        }

        const stall = await models_1.StallModel.findById(vendor.stallId)
            .populate("vendorIds", "firstName lastName email")
            .lean();
        response.json({ stall });
    } catch (error) {
        console.error("Error fetching vendor stall:", error);
        response.status(500).json({ message: "Failed to fetch vendor stall." });
    }
});

// ── GET STALL BY ID ──────────────────────────────────────────────────────
stallsRouter.get("/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    try {
        const stall = await (0, stall_service_1.getStallById)(stallId);
        if (!stall) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }

        const products = await (0, product_service_1.getProductsByStall)(stallId);
        const reviewSummary = await (0, review_service_1.getReviewSummaryForStall)(stallId);
        
        response.json({ stall, products, reviewSummary });
    } catch (error) {
        console.error("Error fetching stall:", error);
        response.status(500).json({ message: "Failed to fetch stall." });
    }
});

// ─── CREATE PRODUCT FOR STALL ──────────────────────────────────────────
stallsRouter.post("/:stallId/products", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }

    try {
        const allowed = await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role);
        if (!allowed) {
            response.status(403).json({ message: "You cannot add products to this stall." });
            return;
        }

        const { name, price, description, ingredients, allergens, nutrition, photos, category, isAvailable, isFeatured } = request.body;

        if (!name || typeof price !== "number") {
            response.status(400).json({ message: "name and price are required." });
            return;
        }

        const product = await (0, product_service_1.createProduct)({
            stallId,
            name,
            price,
            description,
            ingredients,
            allergens,
            nutrition,
            photos: photos || [],
            category,
            isAvailable,
            isFeatured
        });

        if (!product) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }

        response.status(201).json({ product });
    } catch (error) {
        console.error("Error creating product:", error);
        response.status(500).json({ message: "Failed to create product." });
    }
});

// ─── GET PRODUCTS BY STALL ──────────────────────────────────────────────
stallsRouter.get("/:stallId/products", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    try {
        const products = await (0, product_service_1.getProductsByStall)(stallId);
        response.json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        response.status(500).json({ message: "Failed to fetch products." });
    }
});

// ─── GET PRODUCT BY ID ──────────────────────────────────────────────────
stallsRouter.get("/products/:productId", async (request, response) => {
    const productId = firstParam(request.params.productId);
    if (!productId || !mongoose_1.Types.ObjectId.isValid(productId)) {
        response.status(400).json({ message: "Invalid product id format." });
        return;
    }
    const product = await (0, product_service_1.getProductById)(productId);
    if (!product) {
        response.status(404).json({ message: "Product not found." });
        return;
    }
    response.json({ product });
});

// ─── UPDATE PRODUCT ──────────────────────────────────────────────────────
stallsRouter.patch("/products/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const productId = firstParam(request.params.productId);
    if (!productId || !mongoose_1.Types.ObjectId.isValid(productId)) {
        response.status(400).json({ message: "Invalid product id format." });
        return;
    }
    const product = await (0, product_service_1.getProductById)(productId);
    if (!product) {
        response.status(404).json({ message: "Product not found." });
        return;
    }
    const stallId = typeof product.stallId === "object" ? product.stallId._id.toString() : product.stallId.toString();
    const allowed = request.role === "admin" || (await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role));
    if (!allowed) {
        response.status(403).json({ message: "You cannot edit this product." });
        return;
    }
    const updatedProduct = await (0, product_service_1.updateProduct)(productId, request.body);
    if (!updatedProduct) {
        response.status(404).json({ message: "Product not found." });
        return;
    }
    response.json({ product: updatedProduct });
});

// ─── DELETE PRODUCT ──────────────────────────────────────────────────────
stallsRouter.delete("/products/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const productId = firstParam(request.params.productId);
    if (!productId || !mongoose_1.Types.ObjectId.isValid(productId)) {
        response.status(400).json({ message: "Invalid product id format." });
        return;
    }
    const product = await (0, product_service_1.getProductById)(productId);
    if (!product) {
        response.status(404).json({ message: "Product not found." });
        return;
    }
    const stallId = typeof product.stallId === "object" ? product.stallId._id.toString() : product.stallId.toString();
    const allowed = request.role === "admin" || (await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role));
    if (!allowed) {
        response.status(403).json({ message: "You cannot delete this product." });
        return;
    }
    const deleted = await (0, product_service_1.deleteProduct)(productId);
    if (!deleted) {
        response.status(404).json({ message: "Product not found." });
        return;
    }
    response.status(204).send();
});

// ─── GET ALL PRODUCTS ──────────────────────────────────────────────────
stallsRouter.get("/products/all", auth_1.authenticateRequest, async (request, response) => {
    try {
        let products = await (0, product_service_1.listProducts)({}, true);
        if (request.role === "vendor") {
            const stalls = await (0, stall_service_1.listStalls)({});
            const vendorStallIds = stalls
                .filter((s) => {
                    if (!s.vendorIds || s.vendorIds.length === 0) return false;
                    return s.vendorIds.some(id => id.toString() === request.userId);
                })
                .map((s) => s._id.toString());
            products = products.filter((item) => {
                const stallIdStr = item.stallId && typeof item.stallId === "object" && "_id" in item.stallId
                    ? item.stallId._id.toString()
                    : item.stallId?.toString();
                return vendorStallIds.includes(stallIdStr);
            });
        }
        response.json({ products });
    } catch (err) {
        console.error("Error fetching products:", err);
        response.status(500).json({ message: "Failed to fetch all products." });
    }
});

// ─── UPDATE STALL ─────────────────────────────────────────────────────────
stallsRouter.patch("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }

    try {
        const allowed = await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role);
        if (!allowed) {
            response.status(403).json({ message: "You cannot edit this stall." });
            return;
        }

        const stall = await (0, stall_service_1.updateStall)(stallId, request.body);
        if (!stall) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }
        response.json({ stall });
    } catch (error) {
        console.error("Error updating stall:", error);
        response.status(500).json({ message: "Failed to update stall." });
    }
});

// ─── DELETE STALL ─────────────────────────────────────────────────────────
stallsRouter.delete("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    try {
        const deleted = await (0, stall_service_1.deleteStall)(stallId);
        if (!deleted) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting stall:", error);
        response.status(500).json({ message: "Failed to delete stall." });
    }
});

// ─── GET STALL PAYMENT METHODS ─────────────────────────────────────────
stallsRouter.get("/:stallId/payment-methods", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    try {
        const stall = await models_1.StallModel.findById(stallId)
            .select("paymentMethods paymentDetails")
            .lean();
        
        if (!stall) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }

        response.json({
            paymentMethods: stall.paymentMethods || ["Cash"],
            paymentDetails: stall.paymentDetails || { gcashNumber: null, mayaNumber: null }
        });
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        response.status(500).json({ message: "Failed to fetch payment methods." });
    }
});

// ─── UPDATE STALL PAYMENT METHODS (Vendor only) ────────────────────────
stallsRouter.patch("/:stallId/payment-methods", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId || !mongoose_1.Types.ObjectId.isValid(stallId)) {
        response.status(400).json({ message: "Invalid stall id format." });
        return;
    }

    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }

    try {
        const allowed = await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role);
        if (!allowed) {
            response.status(403).json({ message: "You cannot edit payment methods for this stall." });
            return;
        }

        const { paymentMethods, paymentDetails } = request.body;
        
        if (!paymentMethods || !Array.isArray(paymentMethods) || paymentMethods.length === 0) {
            response.status(400).json({ message: "At least one payment method is required." });
            return;
        }

        const stall = await (0, stall_service_1.updatePaymentMethods)(stallId, paymentMethods, paymentDetails);
        
        if (!stall) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }

        response.json({ 
            stall,
            paymentMethods: stall.paymentMethods,
            paymentDetails: stall.paymentDetails
        });
    } catch (error) {
        console.error("Error updating payment methods:", error);
        response.status(500).json({ message: "Failed to update payment methods." });
    }
});