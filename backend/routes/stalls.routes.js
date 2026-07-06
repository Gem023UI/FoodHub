"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.stallsRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
// Import all functions from controller
const stall_controller_1 = require("../controllers/stall.controller");

const stallsRouter = (0, express_1.Router)();
exports.stallsRouter = stallsRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── TEST ROUTE ──────────────────────────────────────────────────────────
stallsRouter.get("/test", (req, res) => {
    res.json({ message: "Stalls route is working!" });
});

// ── GET ALL STALLS ──────────────────────────────────────────────────────
// Remove auth_1.authenticateRequest from this route
stallsRouter.get("/", async (request, response) => {
    try {
        console.log("📝 GET /stalls");
        const stalls = await (0, stall_controller_1.getStalls)();
        response.json({ stalls });
    } catch (error) {
        console.error("❌ Error listing stalls:", error);
        response.status(500).json({ 
            message: "Failed to fetch stalls.",
            error: error.message 
        });
    }
});

// ── GET STALL CARD ────────────────────────────────────────────────────
stallsRouter.get("/card/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const stall = await (0, stall_controller_1.getStallCard)(stallId);
        if (!stall) {
            return response.status(404).json({ message: "Stall not found." });
        }
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
        if (!stall) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.json({ stall });
    } catch (error) {
        console.error("Error fetching stall details:", error);
        response.status(500).json({ message: "Failed to fetch stall." });
    }
});

// ── GET STALL VENDORS ──────────────────────────────────────────────────
stallsRouter.get("/:stallId/vendors", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const vendors = await (0, stall_controller_1.getStallVendors)(stallId);
        if (vendors === null) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.json({ vendors });
    } catch (error) {
        console.error("Error fetching stall vendors:", error);
        response.status(500).json({ message: "Failed to fetch vendors." });
    }
});

// ── GET STALL PRODUCTS BY CATEGORY ────────────────────────────────────
stallsRouter.get("/:stallId/products/category/:category", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const category = firstParam(request.params.category);
    try {
        const products = await (0, stall_controller_1.getStallProductsByCategory)(stallId, category);
        if (products === null) {
            return response.status(404).json({ message: "Stall not found." });
        }
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
        const reviews = await (0, stall_controller_1.getStallProductReviews)(stallId);
        if (reviews === null) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.json({ reviews });
    } catch (error) {
        console.error("Error fetching product reviews:", error);
        response.status(500).json({ message: "Failed to fetch reviews." });
    }
});

// ── GET VENDOR STALL ──────────────────────────────────────────────────
stallsRouter.get("/vendor/my", auth_1.authenticateRequest, async (request, response) => {
    const vendorAuthId = request.userId;
    try {
        const stall = await (0, stall_controller_1.getVendorStall)(vendorAuthId);
        if (!stall) {
            return response.status(404).json({ message: "No stall found for this vendor." });
        }
        response.json({ stall });
    } catch (error) {
        console.error("Error fetching vendor stall:", error);
        response.status(500).json({ message: "Failed to fetch stall." });
    }
});

// ── GET VENDOR PROFILE ──────────────────────────────────────────────────
stallsRouter.get("/vendor/profile", auth_1.authenticateRequest, async (request, response) => {
    const vendorAuthId = request.userId;
    try {
        const vendor = await (0, stall_controller_1.getVendorProfile)(vendorAuthId);
        if (!vendor) {
            return response.status(404).json({ message: "Vendor not found." });
        }
        response.json({ vendor });
    } catch (error) {
        console.error("Error fetching vendor profile:", error);
        response.status(500).json({ message: "Failed to fetch vendor profile." });
    }
});

// ── CREATE STALL ──────────────────────────────────────────────────────
stallsRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const stall = await (0, stall_controller_1.createStall)(request.body);
        response.status(201).json({ stall });
    } catch (error) {
        console.error("Error creating stall:", error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            if (field === "section") {
                return response.status(409).json({ message: `Section ${request.body.section} is already taken by another stall. Please choose a different section.` });
            }
            if (field === "stallName") {
                return response.status(409).json({ message: `A stall named "${request.body.stallName}" already exists.` });
            }
            return response.status(409).json({ message: "Duplicate value error." });
        }
        response.status(500).json({ message: "Failed to create stall." });
    }
});

// ── UPDATE STALL (admin: any stall; vendor: only their own) ────────────
stallsRouter.patch("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        if (request.role === "vendor") {
            const vendorStall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!vendorStall || vendorStall._id.toString() !== stallId) {
                return response.status(403).json({ message: "Unauthorized to update this stall." });
            }
        }
        const stall = await (0, stall_controller_1.updateStall)(stallId, request.body);
        if (!stall) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.json({ stall });
    } catch (error) {
        console.error("Error updating stall:", error);
        response.status(500).json({ message: "Failed to update stall." });
    }
});

// ── DELETE STALL ──────────────────────────────────────────────────────
stallsRouter.delete("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const deleted = await (0, stall_controller_1.deleteStall)(stallId);
        if (!deleted) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting stall:", error);
        response.status(500).json({ message: "Failed to delete stall." });
    }
});

// ── UPDATE VENDOR STATUS (within a stall) ───────────────────────────────
stallsRouter.patch("/:stallId/vendors/:vendorId/status", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const vendorId = firstParam(request.params.vendorId);
    const { status } = request.body;
    const validStatuses = ["unverified", "verified", "deactivated", "suspended"];
    if (!validStatuses.includes(status)) {
        return response.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }
    try {
        const vendor = await (0, stall_controller_1.updateStallVendorStatus)(stallId, vendorId, status);
        if (!vendor) return response.status(404).json({ message: "Vendor not found." });
        response.json({ vendor });
    } catch (error) {
        console.error("Error updating vendor status:", error);
        response.status(500).json({ message: "Failed to update vendor status." });
    }
});

// ── REMOVE VENDOR FROM STALL ────────────────────────────────────────────
stallsRouter.delete("/:stallId/vendors/:vendorId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const vendorId = firstParam(request.params.vendorId);
    try {
        const deleted = await (0, stall_controller_1.removeStallVendorRecord)(stallId, vendorId);
        if (!deleted) return response.status(404).json({ message: "Vendor not found." });
        response.status(204).send();
    } catch (error) {
        console.error("Error removing vendor:", error);
        response.status(500).json({ message: "Failed to remove vendor." });
    }
});

// ── SET STALL STATUS (vendor who owns the stall, or admin) ─────────────
stallsRouter.patch("/:stallId/status", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    const { status } = request.body;
    if (typeof status !== "boolean") {
        return response.status(400).json({ message: "status must be a boolean." });
    }
    try {
        if (request.role === "vendor") {
            const vendorStall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!vendorStall || vendorStall._id.toString() !== stallId) {
                return response.status(403).json({ message: "Unauthorized to update this stall." });
            }
        }
        const stall = await (0, stall_controller_1.setStallStatus)(stallId, status);
        if (!stall) return response.status(404).json({ message: "Stall not found." });
        response.json({ stall });
    } catch (error) {
        console.error("Error updating stall status:", error);
        response.status(500).json({ message: "Failed to update stall status." });
    }
});

// ── ADD VENDOR ACCOUNT TO STALL (vendor adding a co-vendor, or admin) ──
stallsRouter.post("/:stallId/vendor-account", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        if (request.role === "vendor") {
            const vendorStall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!vendorStall || vendorStall._id.toString() !== stallId) {
                return response.status(403).json({ message: "Unauthorized to add vendors to this stall." });
            }
        }
        const result = await (0, stall_controller_1.addVendorAccountToStall)(stallId, request.body);
        if (!result.success) {
            const messages = {
                invalid_stall_id: "Invalid stall ID.",
                stall_not_found: "Stall not found.",
                email_taken: "This email is already registered to a vendor."
            };
            return response.status(result.reason === "stall_not_found" ? 404 : 409).json({ message: messages[result.reason] || "Failed to add vendor." });
        }
        response.status(201).json({ vendor: result.data.vendorAccount });
    } catch (error) {
        console.error("Error adding vendor account:", error);
        response.status(500).json({ message: "Failed to add vendor." });
    }
});

// ── ADD PRODUCT TO STALL ──────────────────────────────────────────────
stallsRouter.post("/:stallId/products", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin", "vendor"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const product = await (0, stall_controller_1.addProduct)(stallId, request.body);
        if (!product) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.status(201).json({ product });
    } catch (error) {
        console.error("Error adding product:", error);
        response.status(500).json({ message: "Failed to add product." });
    }
});

// ── UPDATE PRODUCT ──────────────────────────────────────────────────
stallsRouter.patch("/products/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin", "vendor"), async (request, response) => {
    const productId = firstParam(request.params.productId);
    const { stallId, ...updates } = request.body;
    try {
        const product = await (0, stall_controller_1.updateProduct)(stallId, productId, updates);
        if (!product) {
            return response.status(404).json({ message: "Product not found." });
        }
        response.json({ product });
    } catch (error) {
        console.error("Error updating product:", error);
        response.status(500).json({ message: "Failed to update product." });
    }
});

// ── DELETE PRODUCT ──────────────────────────────────────────────────
stallsRouter.delete("/products/:productId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin", "vendor"), async (request, response) => {
    const productId = firstParam(request.params.productId);
    const { stallId } = request.body;
    try {
        const deleted = await (0, stall_controller_1.deleteProduct)(stallId, productId);
        if (!deleted) {
            return response.status(404).json({ message: "Product not found." });
        }
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting product:", error);
        response.status(500).json({ message: "Failed to delete product." });
    }
});