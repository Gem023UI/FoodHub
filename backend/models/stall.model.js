"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.StallModel = void 0;

const mongoose_1 = require("mongoose");

// Payment methods enum
const PAYMENT_METHODS = ["Cash", "GCash", "Maya"];

const stallSchema = new mongoose_1.Schema({
    vendorIds: [{ 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Vendor", 
        index: true 
    }],
    name: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 120 
    },
    description: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    location: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 120 
    },
    section: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    category: { 
        type: String, 
        trim: true, 
        default: "general", 
        index: true 
    },
    photos: [{ type: String, trim: true }],
    openingHours: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    openingTime: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    closingTime: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
    },
    // ─── PAYMENT METHODS ──────────────────────────────────────────────
    paymentMethods: [{
        type: String,
        enum: PAYMENT_METHODS,
        default: ["Cash"]
    }],
    // Mobile numbers for each payment method
    paymentDetails: {
        gcashNumber: { type: String, trim: true, default: null },
        mayaNumber: { type: String, trim: true, default: null },
    },
    // ─── REVENUE TRACKING ──────────────────────────────────────────────
    dailyRevenue: { 
        type: Number, 
        default: 0 
    },
    weeklyRevenue: { 
        type: Number, 
        default: 0 
    },
    monthlyRevenue: { 
        type: Number, 
        default: 0 
    },
    averageProductRating: { 
        type: Number, 
        default: 0 
    },
    revenueHistory: [{
        date: { type: Date, default: Date.now },
        amount: { type: Number, default: 0 },
        period: { type: String, enum: ["daily", "weekly", "monthly"] }
    }]
}, { timestamps: true });

// Indexes
stallSchema.index({ name: "text", description: "text", location: "text", section: "text" });
stallSchema.index({ name: 1 }, { unique: true });
stallSchema.index({ category: 1, isActive: 1 });
stallSchema.index({ dailyRevenue: -1, weeklyRevenue: -1, monthlyRevenue: -1 });

exports.StallModel = (0, mongoose_1.model)("Stall", stallSchema);
exports.PAYMENT_METHODS = PAYMENT_METHODS;