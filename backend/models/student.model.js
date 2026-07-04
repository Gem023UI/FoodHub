"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentModel = void 0;
const mongoose_1 = require("mongoose");

// Available TUPT courses - use short codes that match frontend options
const COURSES = [
  "BSIT", "BSCS", "BSIS", "BSBA", "BSHM", 
  "BSEd", "BEED", "BSN", "BSPSYCH", "BSCRIM",
  "BSECE", "BSEE", "BSME", "BSCE", "BSIE",
  "BSArch", "BSA", "BSTM", "BSEntrep", "BSOA",
  "ACT", "AET", "AMT"
];

const budgetCapSchema = new mongoose_1.Schema({
  amount: { type: Number, required: true, min: 0 },
  currentBudget: { type: Number, required: true, default: 0 }, // deducted as orders come in; can go negative
  surplus: { type: Number, default: 0 },                       // set once the cap period ends; can be negative
  period: { 
    type: String, 
    required: true,
    enum: ["daily", "weekly", "monthly", "custom"]
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["accomplished", "failed", "active"],
    default: "active"
  }
}, { timestamps: true });

const favoriteSchema = new mongoose_1.Schema({
  stallId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Stall",
    required: true
  },
  productId: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true
  },
  productName: { type: String, required: true, trim: true },
  stallName: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now }
}, { _id: false });

const studentSchema = new mongoose_1.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
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
      default: "student", 
      immutable: true 
    },

    birthdate: { type: Date, default: null },
    tuptId: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      default: null,
    },
    course: { 
      type: String, 
      trim: true, 
      enum: COURSES,
      default: null 
    },
    section: { type: String, trim: true, default: null },
    contactNumber: { type: String, trim: true, default: null },

    profilePictureUrl: { type: String, trim: true, default: null },

    status: {
      type: String,
      enum: ["unverified", "verified", "deactivated"],
      default: "unverified",
    },
    emailVerificationCode: { type: String, select: false, default: null },
    emailVerificationExpires: { type: Date, select: false, default: null },
    lastVerificationSentAt: { type: Date, select: false, default: null },

    budgetCap: [budgetCapSchema],
    favorites: [favoriteSchema],
  },
  { timestamps: true, collection: "students" }
);

// ─── INDEXES ──────────────────────────────────────────────────────────────
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ tuptId: 1 }, { unique: true, sparse: true });
studentSchema.index({ course: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ "favorites.productId": 1 });

exports.StudentModel = (0, mongoose_1.model)("Student", studentSchema);