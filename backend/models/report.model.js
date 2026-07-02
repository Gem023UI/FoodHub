"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModel = void 0;
const mongoose_1 = require("mongoose");

const reportSchema = new mongoose_1.Schema({
  reporterId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  reporterName: { type: String, required: true },
  reporterEmail: { type: String, required: true },
  reporterCourse: { type: String, required: true },

  reportedUserId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  reportedUserName: { type: String, required: true },
  reportedUserEmail: { type: String, required: true },
  reportedUserCourse: { type: String, required: true },

  orderId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  orderReference: { type: String, default: null },

  stallId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Stall",
    default: null
  },
  stallName: { type: String, default: null },

  productId: {
    type: mongoose_1.Schema.Types.ObjectId,
    default: null
  },
  productName: { type: String, default: null },

  reason: {
    type: String,
    required: true,
    enum: [
      "No-show / Unclaimed order",
      "Fake / Duplicate GCash payment",
      "Abusive behavior / Language",
      "Harassment",
      "Fraud / Scam",
      "Inappropriate content",
      "Spam",
      "Other"
    ]
  },
  description: { type: String, required: true },

  evidence: [{ type: String, trim: true }], // Cloudinary URLs for evidence images

  status: {
    type: String,
    enum: ["Pending", "Under Review", "Resolved", "Dismissed"],
    default: "Pending"
  },

  adminNotes: { type: String, default: "" },
  resolutionDetails: { type: String, default: "" },

  resolvedBy: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

// Indexes
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

exports.ReportModel = (0, mongoose_1.model)("Report", reportSchema);