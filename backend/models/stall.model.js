"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.StallModel = exports.PRODUCT_CATEGORIES = exports.VENDOR_POSITIONS = exports.MAX_SECTIONS = void 0;

const mongoose_1 = require("mongoose");

// ── Enums ──────────────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];
const VENDOR_POSITIONS = ["Cook", "Manager", "Financier"];
const MAX_SECTIONS = 12;

const phoneValidator = {
  validator: (v) => !v || /^\d{11}$/.test(v),
  message: (props) => `${props.value} is not a valid 11-digit phone number`
};

// ── Product Review Subschema ─────────────────────────────────────────────
const productReviewSchema = new mongoose_1.Schema({
  reviewEmail: { type: String, required: true, trim: true, lowercase: true },
  reviewProfileUrl: { type: String, trim: true, default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, default: "" },
  reviewImages: [{ type: String, trim: true }],
  reviewDate: { type: Date, default: Date.now }
}, { timestamps: true });

// ── Nutrition Subschema ──────────────────────────────────────────────────
const nutritionSchema = new mongoose_1.Schema({
  calories: { type: Number, min: 0, default: null },
  protein: { type: Number, min: 0, default: null },
  carbs: { type: Number, min: 0, default: null },
  allergen: { type: String, trim: true, default: "" }
}, { _id: false });

// ── Product Subschema ─────────────────────────────────────────────────────
const productSchema = new mongoose_1.Schema({
  productName: { type: String, required: true, trim: true, maxlength: 120 },
  productDescription: { type: String, trim: true, default: "" },
  productImages: [{ type: String, trim: true }],
  price: { type: Number, required: true, min: 0 },
  category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
  stocks: { type: Number, default: 0, min: 0 },
  available: { type: Boolean, default: true },
  favorite: { type: Number, default: 0, min: 0 },
  nutrition: { type: nutritionSchema, default: () => ({}) },
  reviews: [productReviewSchema]
}, { timestamps: true });

productSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / this.reviews.length;
});

productSchema.virtual("reviewCount").get(function () {
  return this.reviews ? this.reviews.length : 0;
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

// ── Vendor Subschema ────────────────────────────────────────────────────
const vendorSchema = new mongoose_1.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, trim: true, lowercase: true },
  phoneNumber: { type: String, trim: true, validate: phoneValidator },
  vendorImage: { type: String, trim: true, default: null },
  role: { 
    type: String, 
    enum: ["student", "admin", "vendor"],
    default: "vendor"
  },
  position: { 
    type: String, 
    enum: VENDOR_POSITIONS,
    required: true
  },
  status: { 
    type: String, 
    enum: ["unverified", "verified", "deactivated"],
    default: "unverified"
  }
}, { timestamps: true });

// ── Stall Schema ───────────────────────────────────────────────────────────
const stallSchema = new mongoose_1.Schema({
  stallName: { type: String, required: true, trim: true, maxlength: 120, unique: true },
  stallDescription: { type: String, trim: true, default: "" },
  stallPicture: { type: String, trim: true, default: null },
  section: {
    type: Number,
    required: true,
    min: 1,
    max: MAX_SECTIONS,
    unique: true,
    validate: {
      validator: Number.isInteger,
      message: "Section must be a whole number between 1 and 12"
    }
  },
  openHours: {
    openTime: { type: String, trim: true, default: "" },
    closingTime: { type: String, trim: true, default: "" }
  },
  status: { type: Boolean, default: true },
  proofOfContract: { type: String, trim: true, default: null },
  paymentMethod: {
    cash: {
      available: { type: Boolean, default: true }
    },
    gcash: {
      available: { type: Boolean, default: false },
      accountName: { type: String, trim: true, default: "" },
      phoneNumber: { type: String, trim: true, validate: phoneValidator }
    },
    paymaya: {
      available: { type: Boolean, default: false },
      accountName: { type: String, trim: true, default: "" },
      phoneNumber: { type: String, trim: true, validate: phoneValidator }
    }
  },
  products: [productSchema],
  vendors: [vendorSchema],
}, { timestamps: true });

// ─── INDEXES (only define once, no duplicates) ──────────────────────────
stallSchema.index({ stallName: 1 }, { unique: true });
stallSchema.index({ section: 1 }, { unique: true });
stallSchema.index({ status: 1 });
stallSchema.index({ "vendors.email": 1 });
stallSchema.index({ "products.category": 1 });
stallSchema.index({ stallName: "text", stallDescription: "text" });

stallSchema.set("toObject", { virtuals: true });
stallSchema.set("toJSON", { virtuals: true });

exports.StallModel = (0, mongoose_1.model)("Stall", stallSchema);
exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
exports.VENDOR_POSITIONS = VENDOR_POSITIONS;
exports.MAX_SECTIONS = MAX_SECTIONS;