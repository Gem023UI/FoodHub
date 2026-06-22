"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const review_service_1 = require("../services/review.service");
const reviewsRouter = (0, express_1.Router)();
exports.reviewsRouter = reviewsRouter;
function firstParam(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
reviewsRouter.get("/stall/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId) {
        response.status(400).json({ message: "Invalid stall id." });
        return;
    }
    const reviews = await (0, review_service_1.listReviewsByStall)(stallId);
    const summary = await (0, review_service_1.getReviewSummary)(stallId);
    response.json({ reviews, summary });
});
reviewsRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("user", "vendor", "admin"), async (request, response) => {
    if (!request.userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const { stallId, rating, comment } = request.body;
    if (!stallId || typeof rating !== "number") {
        response.status(400).json({ message: "stallId and rating are required." });
        return;
    }
    if (rating < 1 || rating > 5) {
        response.status(400).json({ message: "rating must be between 1 and 5." });
        return;
    }
    try {
        const review = await (0, review_service_1.createReview)({ userId: request.userId, stallId, rating, comment });
        if (!review) {
            response.status(404).json({ message: "Stall not found." });
            return;
        }
        response.status(201).json({ review });
    }
    catch {
        response.status(409).json({ message: "You have already reviewed this stall." });
    }
});
reviewsRouter.get("/:reviewId", async (request, response) => {
    const reviewId = firstParam(request.params.reviewId);
    if (!reviewId) {
        response.status(400).json({ message: "Invalid review id." });
        return;
    }
    const review = await (0, review_service_1.getReviewById)(reviewId);
    if (!review || !review.isVisible) {
        response.status(404).json({ message: "Review not found." });
        return;
    }
    response.json({ review });
});
reviewsRouter.patch("/:reviewId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("user", "vendor", "admin"), async (request, response) => {
    const reviewId = firstParam(request.params.reviewId);
    if (!reviewId) {
        response.status(400).json({ message: "Invalid review id." });
        return;
    }
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const allowed = await (0, review_service_1.canManageReview)(reviewId, request.userId, request.role);
    if (!allowed) {
        response.status(403).json({ message: "You cannot edit this review." });
        return;
    }
    const { rating, comment, isVisible } = request.body;
    if (typeof rating === "number" && (rating < 1 || rating > 5)) {
        response.status(400).json({ message: "rating must be between 1 and 5." });
        return;
    }
    const review = await (0, review_service_1.updateReview)(reviewId, { rating, comment, isVisible });
    if (!review) {
        response.status(404).json({ message: "Review not found." });
        return;
    }
    response.json({ review });
});
reviewsRouter.delete("/:reviewId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("user", "vendor", "admin"), async (request, response) => {
    const reviewId = firstParam(request.params.reviewId);
    if (!reviewId) {
        response.status(400).json({ message: "Invalid review id." });
        return;
    }
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const allowed = await (0, review_service_1.canManageReview)(reviewId, request.userId, request.role);
    if (!allowed) {
        response.status(403).json({ message: "You cannot delete this review." });
        return;
    }
    const deleted = await (0, review_service_1.deleteReview)(reviewId);
    if (!deleted) {
        response.status(404).json({ message: "Review not found." });
        return;
    }
    response.status(204).send();
});
