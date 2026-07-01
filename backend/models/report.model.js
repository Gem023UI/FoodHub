"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModel = exports.StudentAnalyticsModel = exports.StallAnalyticsModel = exports.FavoriteAnalyticsModel = exports.BudgetAnalyticsModel = void 0;
const mongoose_1 = require("mongoose");

// ── Student Analytics Schema ──────────────────────────────────────────────
const studentAnalyticsSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now, index: true },
    totalStudents: { type: Number, default: 0 },
    studentsByCourse: [{
        course: { type: String, required: true },
        count: { type: Number, default: 0 }
    }],
    verifiedStudents: { type: Number, default: 0 },
    unverifiedStudents: { type: Number, default: 0 },
    suspendedStudents: { type: Number, default: 0 }
}, { timestamps: true });

// ── Stall Analytics Schema ────────────────────────────────────────────────
const stallAnalyticsSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now, index: true },
    totalStalls: { type: Number, default: 0 },
    activeStalls: { type: Number, default: 0 },
    stallsByCategory: [{
        category: { type: String, required: true },
        count: { type: Number, default: 0 }
    }],
    stallPerformance: [{
        stallId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Stall" },
        stallName: { type: String, required: true },
        vendorCount: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        orderCount: { type: Number, default: 0 },
        productCount: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 }
    }],
    // Revenue by period
    dailyRevenue: { type: Number, default: 0 },
    weeklyRevenue: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    // Top performing stalls
    topStalls: [{
        stallId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Stall" },
        stallName: { type: String, required: true },
        revenue: { type: Number, default: 0 },
        rating: { type: Number, default: 0 }
    }]
}, { timestamps: true });

// ── Favorite Analytics Schema ─────────────────────────────────────────────
const favoriteAnalyticsSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now, index: true },
    // Overall trending products
    overallTrending: [{
        productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, required: true },
        category: { type: String, required: true },
        favoriteCount: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        calories: { type: Number, default: null },
        proteinGrams: { type: Number, default: null }
    }],
    // Trending by category
    trendingByCategory: [{
        category: { type: String, required: true },
        products: [{
            productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
            productName: { type: String, required: true },
            favoriteCount: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
            calories: { type: Number, default: null },
            proteinGrams: { type: Number, default: null }
        }]
    }],
    // Trending by course
    trendingByCourse: [{
        course: { type: String, required: true },
        products: [{
            productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
            productName: { type: String, required: true },
            favoriteCount: { type: Number, default: 0 }
        }]
    }],
    // Daily/Weekly/Monthly trending
    dailyTrending: [{ type: mongoose_1.Schema.Types.Mixed }],
    weeklyTrending: [{ type: mongoose_1.Schema.Types.Mixed }],
    monthlyTrending: [{ type: mongoose_1.Schema.Types.Mixed }]
}, { timestamps: true });

// ── Budget Analytics Schema ──────────────────────────────────────────────
const budgetAnalyticsSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now, index: true },
    // Average budget by course
    averageBudgetByCourse: [{
        course: { type: String, required: true },
        studentCount: { type: Number, default: 0 },
        totalBudget: { type: Number, default: 0 },
        averageBudget: { type: Number, default: 0 },
        averageSpent: { type: Number, default: 0 },
        averageRemaining: { type: Number, default: 0 }
    }],
    // Average budget by period
    averageDailyBudget: { type: Number, default: 0 },
    averageWeeklyBudget: { type: Number, default: 0 },
    averageMonthlyBudget: { type: Number, default: 0 },
    // Overall budget summary
    totalBudgetAllocated: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalRemaining: { type: Number, default: 0 },
    // Students exceeding budget
    studentsExceedingBudget: [{
        studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student" },
        studentName: { type: String, required: true },
        course: { type: String, required: true },
        budgetLimit: { type: Number, default: 0 },
        spentAmount: { type: Number, default: 0 },
        percentageUsed: { type: Number, default: 0 }
    }]
}, { timestamps: true });

const StudentAnalyticsModel = (0, mongoose_1.model)("StudentAnalytics", studentAnalyticsSchema);
exports.StudentAnalyticsModel = StudentAnalyticsModel;
const StallAnalyticsModel = (0, mongoose_1.model)("StallAnalytics", stallAnalyticsSchema);
exports.StallAnalyticsModel = StallAnalyticsModel;
const FavoriteAnalyticsModel = (0, mongoose_1.model)("FavoriteAnalytics", favoriteAnalyticsSchema);
exports.FavoriteAnalyticsModel = FavoriteAnalyticsModel;
const BudgetAnalyticsModel = (0, mongoose_1.model)("BudgetAnalytics", budgetAnalyticsSchema);
exports.BudgetAnalyticsModel = BudgetAnalyticsModel;

// Keep Report model for compatibility
const reportSchema = new mongoose_1.Schema({
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true },
    reportedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", default: null },
    reason: { 
        type: String, 
        required: true,
        enum: ["No-show / Unclaimed order", "Fake / Duplicate GCash payment", "Abusive behavior / Language", "Other"]
    },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ["Pending", "Resolved", "Dismissed"],
        default: "Pending"
    },
    adminNotes: { type: String, default: "" }
}, { timestamps: true });

exports.ReportModel = (0, mongoose_1.model)("Report", reportSchema);