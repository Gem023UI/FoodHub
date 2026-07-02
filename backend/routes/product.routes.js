"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const product_controller_1 = require("../controllers/product.controller");
const stall_controller_1 = require("../controllers/stall.controller");

const productRouter = (0, express_1.Router)();
exports.productRouter = productRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── GET PRODUCT CARD ──────────────────────────────────────────────────────
productRouter.get("/card/:productId", async (request, response) => {
    const productId = firstParam(request.params.productId);
    try {
        const product = await (0, product_controller_1.getProductCard)(productId);
        if (!product) {
            return response.status(404).json({ message: "Product not found." });
        }
        response.json({ product });
    } catch (error) {
        console.error("Error fetching product card:", error);
        response.status(500).json({ message: "Failed to fetch product." });
    }
});

// ── GET PRODUCT DETAILS ──────────────────────────────────────────────────
productRouter.get("/details/:productId", async (request, response) => {
    const productId = firstParam(request.params.productId);
    try {
        const product = await (0, product_controller_1.getProductDetails)(productId);
        if (!product) {
            return response.status(404).json({ message: "Product not found." });
        }
        response.json({ product });
    } catch (error) {
        console.error("Error fetching product details:", error);
        response.status(500).json({ message: "Failed to fetch product." });
    }
});

// ── GET PRODUCTS BY STALL ──────────────────────────────────────────────────
productRouter.get("/stall/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const { category, available } = request.query;
    
    try {
        const filters = {};
        if (category) filters.category = category;
        if (available !== undefined) filters.available = available === "true";
        
        const products = await (0, product_controller_1.getProductsByStall)(stallId, filters);
        response.json({ products });
    } catch (error) {
        console.error("Error fetching stall products:", error);
        response.status(500).json({ message: "Failed to fetch products." });
    }
});

// ── GET PRODUCTS BY CATEGORY ──────────────────────────────────────────────
productRouter.get("/category/:category", async (request, response) => {
    const category = firstParam(request.params.category);
    try {
        const products = await (0, product_controller_1.getProductsByCategory)(category);
        response.json({ products });
    } catch (error) {
        console.error("Error fetching products by category:", error);
        response.status(500).json({ message: "Failed to fetch products." });
    }
});

// ── CREATE PRODUCT ──────────────────────────────────────────────────────────
productRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const { stallId, ...productData } = request.body;
    
    if (!stallId) {
        return response.status(400).json({ message: "Stall ID is required." });
    }

    try {
        // Verify vendor owns this stall
        if (request.role === "vendor") {
            const stall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!stall || stall._id.toString() !== stallId) {
                return response.status(403).json({ message: "Unauthorized to add products to this stall." });
            }
        }

        const product = await (0, product_controller_1.createProduct)(stallId, productData);
        if (!product) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.status(201).json({ product });
    } catch (error) {
        console.error("Error creating product:", error);
        response.status(500).json({ message: "Failed to create product." });
    }
});

// ── UPDATE PRODUCT ──────────────────────────────────────────────────────────
productRouter.patch("/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const productId = firstParam(request.params.productId);
    const updates = request.body;

    try {
        // Verify vendor owns this product's stall
        if (request.role === "vendor") {
            const stall = await models_1.StallModel.findOne({ "products._id": productId });
            if (!stall) {
                return response.status(404).json({ message: "Product not found." });
            }
            const vendorStall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!vendorStall || vendorStall._id.toString() !== stall._id.toString()) {
                return response.status(403).json({ message: "Unauthorized to update this product." });
            }
        }

        const product = await (0, product_controller_1.updateProduct)(productId, updates);
        if (!product) {
            return response.status(404).json({ message: "Product not found." });
        }
        response.json({ product });
    } catch (error) {
        console.error("Error updating product:", error);
        response.status(500).json({ message: "Failed to update product." });
    }
});

// ── DELETE PRODUCT ──────────────────────────────────────────────────────────
productRouter.delete("/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const productId = firstParam(request.params.productId);

    try {
        // Verify vendor owns this product's stall
        if (request.role === "vendor") {
            const stall = await models_1.StallModel.findOne({ "products._id": productId });
            if (!stall) {
                return response.status(404).json({ message: "Product not found." });
            }
            const vendorStall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!vendorStall || vendorStall._id.toString() !== stall._id.toString()) {
                return response.status(403).json({ message: "Unauthorized to delete this product." });
            }
        }

        const ok = await (0, product_controller_1.deleteProduct)(productId);
        if (!ok) {
            return response.status(404).json({ message: "Product not found." });
        }
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting product:", error);
        response.status(500).json({ message: "Failed to delete product." });
    }
});