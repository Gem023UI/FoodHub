"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorModel = void 0;

const mongoose_1 = require("mongoose");

// ── Vendor Positions ──────────────────────────────────────────────────
const VENDOR_POSITIONS = ["Cook", "Manager", "Financier"];

// ── Vendor Schema ─────────────────────────────────────────────────────
const vendorSchema = new mongoose_1.Schema(
  {
    firstName: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 50 
    },
    lastName: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 50 
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { 
      type: String, 
      required: true, 
      select: false 
    },
    contactNumber: { 
      type: String, 
      trim: true, 
      default: null 
    },
    profilePictureUrl: { 
      type: String, 
      trim: true, 
      default: null 
    },
    position: {
      type: String,
      enum: VENDOR_POSITIONS,
      required: true,
      default: "Cook"
    },
    stallId: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: "Stall",
      required: true,
      index: true
    },
    stallName: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ["unverified", "verified", "deactivated", "suspended"],
      default: "verified",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true, 
    collection: "vendors" 
  }
);

// ─── INDEXES ──────────────────────────────────────────────────────────
vendorSchema.index({ email: 1 }, { unique: true });
vendorSchema.index({ status: 1 });
vendorSchema.index({ stallId: 1 });
vendorSchema.index({ isActive: 1 });

// ─── VIRTUALS ─────────────────────────────────────────────────────────
vendorSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

vendorSchema.set("toObject", { virtuals: true });
vendorSchema.set("toJSON", { virtuals: true });

exports.VendorModel = (0, mongoose_1.model)("Vendor", vendorSchema);
exports.VENDOR_POSITIONS = VENDOR_POSITIONS;