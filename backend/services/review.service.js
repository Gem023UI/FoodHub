"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviewsByStall = listReviewsByStall;
exports.getReviewSummary = getReviewSummary;
exports.createReview = createReview;
exports.getReviewById = getReviewById;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.canManageReview = canManageReview;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");
async function listReviewsByStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return [];
    }
    return models_1.ReviewModel.find({ stallId, isVisible: true }).sort({ createdAt: -1 }).lean();
}
async function getReviewSummary(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return { averageRating: 0, reviewCount: 0 };
    }
    const summary = await models_1.ReviewModel.aggregate([
        { $match: { stallId: models_1.StallModel.db.base.Types.ObjectId.createFromHexString(stallId), isVisible: true } },
        {
            $group: {
                _id: "$stallId",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 }
            }
        }
    ]);
    const firstSummary = summary[0];
    if (!firstSummary) {
        return { averageRating: 0, reviewCount: 0 };
    }
    return {
        averageRating: Number(firstSummary.averageRating?.toFixed(1) ?? 0),
        reviewCount: firstSummary.reviewCount
    };
}
async function createReview(input) {
    const stall = await models_1.StallModel.findById(input.stallId).select("_id").lean();
    if (!stall) {
        return null;
    }
    const review = await models_1.ReviewModel.create({
        userId: input.userId,
        stallId: input.stallId,
        rating: input.rating,
        comment: input.comment ?? ""
    });
    return review.toObject();
}
async function getReviewById(reviewId) {
    if (!(0, ids_1.isValidObjectId)(reviewId)) {
        return null;
    }
    return models_1.ReviewModel.findById(reviewId).lean();
}
async function updateReview(reviewId, updates) {
    if (!(0, ids_1.isValidObjectId)(reviewId)) {
        return null;
    }
    return models_1.ReviewModel.findByIdAndUpdate(reviewId, { $set: updates }, { new: true }).lean();
}
async function deleteReview(reviewId) {
    if (!(0, ids_1.isValidObjectId)(reviewId)) {
        return false;
    }
    const result = await models_1.ReviewModel.findByIdAndDelete(reviewId);
    return Boolean(result);
}
async function canManageReview(reviewId, actorId, actorRole) {
    if (actorRole === "admin") {
        return true;
    }
    const review = await models_1.ReviewModel.findById(reviewId).select("userId").lean();
    if (!review) {
        return false;
    }
    return review.userId.toString() === actorId;
}
