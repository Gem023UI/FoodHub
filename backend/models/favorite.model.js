"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteModel = void 0;
const mongoose_1 = require("mongoose");

const favoriteSchema = new mongoose_1.Schema({
  studentId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },
  course: {
    type: String,
    required: true,
    index: true
  },
  stallId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Stall",
    required: true
  },
  stallName: { type: String, required: true },
  productId: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true
  },
  productName: { type: String, required: true },
  productImages: [{ type: String, trim: true }],
  productNutrition: {
    calories: { type: Number, default: null },
    protein: { type: Number, default: null },
    carbs: { type: Number, default: null }
  },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a student can only favorite a product once
favoriteSchema.index({ studentId: 1, productId: 1 }, { unique: true });

exports.FavoriteModel = (0, mongoose_1.model)("Favorite", favoriteSchema);