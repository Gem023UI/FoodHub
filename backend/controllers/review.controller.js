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

    // Check if student has completed this product in an order
    const order = await models_1.OrderModel.findOne({
        studentId,
        "orderLines.productId": productId,
        orderStatus: "completed"
    });

    if (!order) {
        return { success: false, reason: "order_not_completed" };
    }

    // Get student email for review
    const student = await models_1.StudentModel.findById(studentId).select("email profilePictureUrl");
    if (!student) {
        return { success: false, reason: "student_not_found" };
    }

    // Check if student already reviewed this product
    const existingReview = await models_1.StallModel.findOne({
        "products._id": productId,
        "products.reviews.reviewEmail": student.email
    });

    if (existingReview) {
        return { success: false, reason: "already_reviewed" };
    }

    const result = await (0, stall_controller_1.addReview)(productId, {
        reviewEmail: student.email,
        reviewProfileUrl: student.profilePictureUrl || null,
        rating,
        comment: comment || "",
        reviewImages: images || []
    });

    return result;
}

// ── GET REVIEWS BY PRODUCT ──────────────────────────────────────────────
async function getReviewsByProduct(productId) {
    return (0, stall_controller_1.getReviewsForProduct)(productId);
}

// ── DELETE REVIEW ──────────────────────────────────────────────────────────
async function deleteReview(productId, reviewId) {
    const ok = await (0, stall_controller_1.deleteReview)(productId, reviewId);
    return ok ? { success: true } : { success: false, reason: "not_found" };
}