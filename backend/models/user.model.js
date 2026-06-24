"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");

const userSchema = new mongoose_1.Schema(
  {
    // ── Shared basic fields ──────────────────────────
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName:  { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      required: true,
      enum: ["student", "vendor", "admin"],
      default: "student",
    },

    profilePictureUrl: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: false }, // activated after email verify

    // ── Verification / status ────────────────────────
    status: {
      type: String,
      enum: ["unverified", "verified", "suspended"],
      default: "unverified",
    },
    emailVerificationCode:       { type: String, select: false, default: null },
    emailVerificationExpires:    { type: Date,   select: false, default: null },

    // ── Student-specific fields ──────────────────────
    birthday:      { type: Date,   default: null },
    tuptId: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      sparse: true,
      // unique enforced via index below
    },
    course:        { type: String, trim: true, default: null },
    section:       { type: String, trim: true, default: null },
    contactNumber: { type: String, trim: true, default: null },

    // ── Vendor-specific fields ───────────────────────
    proofOfLegitimacyUrl: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ tuptId: 1 }, { unique: true, sparse: true });
userSchema.index({ contactNumber: 1 }, { sparse: true });

exports.UserModel = (0, mongoose_1.model)("User", userSchema);