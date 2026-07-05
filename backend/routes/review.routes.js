"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const review_controller_1 = require("../controllers/review.controller");

const reviewsRouter = (0, express_1.Router)();
exports.reviewsRouter = reviewsRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── GET REVIEWS BY PRODUCT ──────────────────────────────────────────────
reviewsRouter.get("/product/:productId", async (request, response) => {
    const productId = firstParam(request.params.productId);
    if (!productId) return response.status(400).json({ message: "Invalid product id." });

    try {
        const reviews = await (0, review_controller_1.getReviewsByProduct)(productId);
        response.json({ reviews: reviews || [] });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        response.status(500).json({ 
            message: "Failed to fetch reviews.",
            error: error.message 
        });
    }
});

// ── CREATE REVIEW ──────────────────────────────────────────────────────
reviewsRouter.post("/", auth_1.authenticateRequest, async (request, response) => {
    const { productId, orderId, rating, comment, images } = request.body;
    const studentId = request.userId;

    console.log("📝 Review request:", { studentId, productId, orderId, rating, comment });

    if (!productId || !orderId || !rating) {
        return response.status(400).json({ 
            message: "productId, orderId, and rating are required." 
        });
    }

    if (rating < 1 || rating > 5) {
        return response.status(400).json({ 
            message: "Rating must be between 1 and 5." 
        });
    }

    try {
        const result = await (0, review_controller_1.createReview)({
            studentId,
            productId,
            orderId,
            rating: Number(rating),
            comment: comment || "",
            images: images || []
        });

        if (!result.success) {
            const messages = {
                invalid_product_id: "Invalid product ID.",
                invalid_order_id: "Invalid order ID.",
                order_not_completed: "You must have a completed order for this product to review it.",
                student_not_found: "Student not found.",
                already_reviewed: "You have already reviewed this product for this order.",
                product_not_found: "Product not found."
            };
            return response.status(400).json({ 
                message: messages[result.reason] || "Failed to create review." 
            });
        }

        response.status(201).json({ review: result.data.review });
    } catch (error) {
        console.error("Error creating review:", error);
        response.status(500).json({ 
            message: "Failed to create review.",
            error: error.message 
        });
    }
});

// ── DELETE REVIEW ──────────────────────────────────────────────────────
reviewsRouter.delete("/:productId/:reviewId", auth_1.authenticateRequest, async (request, response) => {
    const productId = firstParam(request.params.productId);
    const reviewId = firstParam(request.params.reviewId);
    
    if (!productId || !reviewId) {
        return response.status(400).json({ message: "Invalid review reference." });
    }

    try {
        const result = await (0, review_controller_1.deleteReview)(productId, reviewId);
        
        if (!result.success) {
            return response.status(404).json({ 
                message: result.reason === "not_found" ? "Review not found." : "Failed to delete review." 
            });
        }
        
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting review:", error);
        response.status(500).json({ 
            message: "Failed to delete review.",
            error: error.message 
        });
    }
});