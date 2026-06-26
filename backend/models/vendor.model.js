"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorModel = void 0;

const mongoose_1 = require("mongoose");

const vendorSchema = new mongoose_1.Schema(
  {
    firstName:    { type: String, required: true, trim: true, maxlength: 50 },
    lastName:     { type: String, required: true, trim: true, maxlength: 50 },
    email:        { 
      type: String, 
      required: true, 
      trim: true, 
      lowercase: true, 
      unique: true,
      // ⭐ REMOVE: index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, default: "vendor", immutable: true },

    contactNumber:        { type: String, trim: true, default: null },
    proofOfLegitimacyUrl: { type: String, trim: true, default: null },

    profilePictureUrl: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["unverified", "verified", "suspended"],
      default: "unverified",
    },
    emailVerificationCode:    { type: String, select: false, default: null },
    emailVerificationExpires: { type: Date,   select: false, default: null },
    lastVerificationSentAt:   { type: Date,   select: false, default: null },
  },
  { timestamps: true, collection: "vendors" }
);

// ── Indexes ─────────────────────────────────────────
vendorSchema.index({ status: 1, isActive: 1 });

exports.VendorModel = (0, mongoose_1.model)("Vendor", vendorSchema);