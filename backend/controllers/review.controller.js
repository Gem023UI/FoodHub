"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getReviewsByProduct = getReviewsByProduct;
exports.deleteReview = deleteReview;

const stall_controller_1 = require("./stall.controller");
const models_1 = require("../models");
const ids_1 = require("../utils/ids");

// ── CREATE REVIEW (only if order is completed) ──────────────────────────
async function createReview({ studentId, productId, rating, comment, images }) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return { success: false, reason: "invalid_product_id" };
    }

    // Get student info
    const student = await models_1.StudentModel.findById(studentId).select("email profilePictureUrl firstName lastName");
    if (!student) {
        return { success: false, reason: "student_not_found" };
    }

    // Check if student has completed this product in an order
    const order = await models_1.OrderModel.findOne({
        studentId,
        "orderLines.productId": productId,
        orderStatus: "completed"
    });

    if (!order) {
        return { success: false, reason: "order_not_completed" };
    }

    // Check if student already reviewed this product
    const stallWithReview = await models_1.StallModel.findOne({
        "products._id": productId,
        "products.reviews.reviewEmail": student.email
    });

    if (stallWithReview) {
        return { success: false, reason: "already_reviewed" };
    }

    // Create the review data
    const reviewData = {
        reviewEmail: student.email,
        reviewProfileUrl: student.profilePictureUrl || null,
        rating: rating,
        comment: comment || "",
        reviewImages: images || [],
        reviewDate: new Date()
    };

    // Add review using stall controller
    const result = await (0, stall_controller_1.addReview)(productId, reviewData);

    if (!result.success) {
        return result;
    }

    // Update product's favorite count? No, reviews don't affect favorites
    // Return the created review
    return { 
        success: true, 
        data: { 
            review: {
                _id: result.data.review._id,
                reviewEmail: result.data.review.reviewEmail,
                reviewProfileUrl: result.data.review.reviewProfileUrl,
                rating: result.data.review.rating,
                comment: result.data.review.comment,
                reviewImages: result.data.review.reviewImages,
                reviewDate: result.data.review.reviewDate,
                productId: productId
            } 
        } 
    };
}

// ── GET REVIEWS BY PRODUCT ──────────────────────────────────────────────
async function getReviewsByProduct(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return [];
    }

    const reviews = await (0, stall_controller_1.getReviewsForProduct)(productId);
    
    // Sort by review date (newest first)
    if (Array.isArray(reviews)) {
        reviews.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
    }
    
    return reviews;
}

// ── DELETE REVIEW ──────────────────────────────────────────────────────────
async function deleteReview(productId, reviewId) {
    if (!(0, ids_1.isValidObjectId)(productId) || !(0, ids_1.isValidObjectId)(reviewId)) {
        return { success: false, reason: "invalid_id" };
    }

    const ok = await (0, stall_controller_1.deleteReview)(productId, reviewId);
    return ok ? { success: true } : { success: false, reason: "not_found" };
}