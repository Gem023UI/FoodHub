"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stallId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Stall", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" },
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });
reviewSchema.index({ userId: 1, stallId: 1 }, { unique: true });
reviewSchema.index({ stallId: 1, rating: -1, createdAt: -1 });
exports.ReviewModel = (0, mongoose_1.model)("Review", reviewSchema);
