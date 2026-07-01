"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getReviewsByProduct = getReviewsByProduct;
exports.getReviewsByStall = getReviewsByStall;
exports.getReviewSummary = getReviewSummary;
exports.getReviewSummaryForStall = getReviewSummaryForStall;
exports.updateReviewVisibility = updateReviewVisibility;
exports.deleteReview = deleteReview;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");
const product_service_1 = require("./product.service");

async function createReview(data) {
    const { studentId, stallId, productId, rating, comment, photos } = data;

    // Validate product exists
    const product = await models_1.ProductModel.findById(productId);
    if (!product) {
        return { success: false, reason: "product_not_found" };
    }

    // Check if student already reviewed this product
    const existing = await models_1.ReviewModel.findOne({ 
        studentId, 
        productId 
    });
    if (existing) {
        return { success: false, reason: "already_reviewed" };
    }

    const review = await models_1.ReviewModel.create({
        studentId,
        stallId,
        productId,
        productName: product.name,
        rating,
        comment: comment || "",
        photos: photos || [],
        isVisible: true
    });

    // Update product rating
    await (0, product_service_1.updateProductRating)(productId);

    return {
        success: true,
        data: { review: review.toObject() }
    };
}

async function getReviewsByProduct(productId, limit = 10, skip = 0) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return [];
    }
    return models_1.ReviewModel.find({ 
        productId, 
        isVisible: true 
    })
    .populate("studentId", "firstName lastName profilePictureUrl course")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

async function getReviewsByStall(stallId, limit = 10, skip = 0) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return [];
    }
    return models_1.ReviewModel.find({ 
        stallId, 
        isVisible: true 
    })
    .populate("studentId", "firstName lastName profilePictureUrl course")
    .populate("productId", "name price photos")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

async function getReviewSummary(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return { averageRating: 0, reviewCount: 0 };
    }
    const reviews = await models_1.ReviewModel.find({ 
        productId, 
        isVisible: true 
    }).select("rating");
    
    const reviewCount = reviews.length;
    if (reviewCount === 0) {
        return { averageRating: 0, reviewCount: 0 };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviewCount;

    return { averageRating, reviewCount };
}

async function getReviewSummaryForStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return { averageRating: 0, reviewCount: 0 };
    }
    const reviews = await models_1.ReviewModel.find({ 
        stallId, 
        isVisible: true 
    }).select("rating");
    
    const reviewCount = reviews.length;
    if (reviewCount === 0) {
        return { averageRating: 0, reviewCount: 0 };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviewCount;

    return { averageRating, reviewCount };
}

async function updateReviewVisibility(reviewId, isVisible, adminId) {
    if (!(0, ids_1.isValidObjectId)(reviewId)) {
        return { success: false, reason: "invalid_id" };
    }

    const review = await models_1.ReviewModel.findByIdAndUpdate(reviewId, {
        $set: { isVisible }
    }, { new: true });

    if (!review) {
        return { success: false, reason: "review_not_found" };
    }

    // Update product rating if visibility changed
    await (0, product_service_1.updateProductRating)(review.productId);

    return { success: true, data: { review } };
}

async function deleteReview(reviewId) {
    if (!(0, ids_1.isValidObjectId)(reviewId)) {
        return { success: false, reason: "invalid_id" };
    }

    const review = await models_1.ReviewModel.findById(reviewId);
    if (!review) {
        return { success: false, reason: "review_not_found" };
    }

    await models_1.ReviewModel.findByIdAndDelete(reviewId);
    
    // Update product rating
    await (0, product_service_1.updateProductRating)(review.productId);

    return { success: true };
}