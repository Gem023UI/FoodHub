"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const review_service_1 = require("../services/review.service");
const reviewsRouter = (0, express_1.Router)();
exports.reviewsRouter = reviewsRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── GET REVIEWS BY PRODUCT ──────────────────────────────────────────────
reviewsRouter.get("/product/:productId", async (request, response) => {
    const productId = firstParam(request.params.productId);
    if (!productId) {
        response.status(400).json({ message: "Invalid product id." });
        return;
    }

    try {
        const reviews = await (0, review_service_1.getReviewsByProduct)(productId);
        response.json({ reviews });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        response.status(500).json({ message: "Failed to fetch reviews." });
    }
});

// ── CREATE REVIEW ──────────────────────────────────────────────────────
reviewsRouter.post("/", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const { stallId, productId, rating, comment, photos } = request.body;

    if (!stallId || !productId || !rating) {
        response.status(400).json({ 
            message: "stallId, productId, and rating are required." 
        });
        return;
    }

    try {
        const result = await (0, review_service_1.createReview)({
            studentId,
            stallId,
            productId,
            rating,
            comment,
            photos: photos || []
        });

        if (!result.success) {
            const messages = {
                product_not_found: "Product not found.",
                already_reviewed: "You have already reviewed this product."
            };
            response.status(400).json({ 
                message: messages[result.reason] || "Failed to create review." 
            });
            return;
        }

        response.status(201).json({ review: result.data.review });
    } catch (error) {
        console.error("Error creating review:", error);
        response.status(500).json({ message: "Failed to create review." });
    }
});

// ── UPDATE REVIEW VISIBILITY (Admin only) ─────────────────────────────
reviewsRouter.patch("/:reviewId/visibility", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const reviewId = firstParam(request.params.reviewId);
    const { isVisible } = request.body;

    if (!reviewId || typeof isVisible !== "boolean") {
        response.status(400).json({ message: "Invalid request." });
        return;
    }

    try {
        const result = await (0, review_service_1.updateReviewVisibility)(reviewId, isVisible);
        if (!result.success) {
            response.status(404).json({ message: "Review not found." });
            return;
        }
        response.json({ review: result.data.review });
    } catch (error) {
        console.error("Error updating review:", error);
        response.status(500).json({ message: "Failed to update review." });
    }
});

// ── DELETE REVIEW ──────────────────────────────────────────────────────
reviewsRouter.delete("/:reviewId", auth_1.authenticateRequest, async (request, response) => {
    const reviewId = firstParam(request.params.reviewId);
    if (!reviewId) {
        response.status(400).json({ message: "Invalid review id." });
        return;
    }

    try {
        const result = await (0, review_service_1.deleteReview)(reviewId);
        if (!result.success) {
            response.status(404).json({ message: "Review not found." });
            return;
        }
        response.status(204).send();
    } catch (error) {
        console.error("Error deleting review:", error);
        response.status(500).json({ message: "Failed to delete review." });
    }
});