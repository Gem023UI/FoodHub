"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModel = void 0;

const mongoose_1 = require("mongoose");

const adminSchema = new mongoose_1.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    contactNumber: { type: String, trim: true, default: null },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "admin", "vendor"],
      default: "admin",
      immutable: true,
    },
    profilePictureUrl: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ["unverified", "verified", "deactivated"],
      default: "unverified",
    },
  },
  { timestamps: true, collection: "admins" }
);

adminSchema.index({ status: 1 });

exports.AdminModel = (0, mongoose_1.model)("Admin", adminSchema);