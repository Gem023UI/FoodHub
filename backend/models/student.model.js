"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentModel = void 0;
const mongoose_1 = require("mongoose");

const studentSchema = new mongoose_1.Schema(
  {
    firstName:    { type: String, required: true, trim: true, maxlength: 50 },
    lastName:     { type: String, required: true, trim: true, maxlength: 50 },
    email:        { 
      type: String, 
      required: true, 
      trim: true, 
      lowercase: true, 
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, default: "student", immutable: true },

    birthday:      { type: Date,   default: null },
    tuptId: {
      type: String, 
      trim: true, 
      uppercase: true,
      unique: true,
      sparse: true, 
      default: null,
    },
    course:        { type: String, trim: true, default: null },
    section:       { type: String, trim: true, default: null },
    contactNumber: { type: String, trim: true, default: null },

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
  { timestamps: true, collection: "students" }
);

exports.StudentModel = (0, mongoose_1.model)("Student", studentSchema);