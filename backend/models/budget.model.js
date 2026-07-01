"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetModel = void 0;
const mongoose_1 = require("mongoose");

const budgetSchema = new mongoose_1.Schema({
    studentId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Student", 
        required: true, 
        index: true 
    },
    period: { 
        type: String, 
        required: true, 
        enum: ["daily", "weekly", "monthly"] 
    },
    limitAmount: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    currency: { 
        type: String, 
        required: true, 
        default: "PHP" 
    },
    alertThresholdPercent: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 80 
    },
    spentAmount: { 
        type: Number, 
        min: 0, 
        default: 0 
    },
    // Track spending by period
    spendingHistory: [{
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }
    }]
}, { timestamps: true });

budgetSchema.index({ studentId: 1, period: 1 });

exports.BudgetModel = (0, mongoose_1.model)("Budget", budgetSchema);