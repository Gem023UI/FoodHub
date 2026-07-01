"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");

const reviewSchema = new mongoose_1.Schema({
    studentId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Student", 
        required: true, 
        index: true 
    },
    stallId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Stall", 
        required: true, 
        index: true 
    },
    productId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true, 
        index: true 
    },
    productName: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    comment: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    photos: [{ 
        type: String, 
        trim: true 
    }],
    isVisible: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// Indexes - Fix: Use studentId instead of userId
reviewSchema.index({ studentId: 1, productId: 1 }, { unique: true }); // One review per student per product
reviewSchema.index({ stallId: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ isVisible: 1 });

exports.ReviewModel = (0, mongoose_1.model)("Review", reviewSchema);