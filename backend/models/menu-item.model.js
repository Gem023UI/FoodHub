"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemModel = void 0;
const mongoose_1 = require("mongoose");
const nutritionSchema = new mongoose_1.Schema({
    calories: { type: Number, min: 0, default: null },
    proteinGrams: { type: Number, min: 0, default: null },
    carbsGrams: { type: Number, min: 0, default: null },
    fatGrams: { type: Number, min: 0, default: null },
    sodiumMilligrams: { type: Number, min: 0, default: null }
}, { _id: false });
const menuItemSchema = new mongoose_1.Schema({
    stallId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Stall", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "" },
    ingredients: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    nutrition: { type: nutritionSchema, default: {} },
    price: { type: Number, required: true, min: 0 },
    photoUrl: { type: String, trim: true, default: null },
    category: { type: String, trim: true, default: "general", index: true },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });
menuItemSchema.index({ stallId: 1, name: 1 }, { unique: true });
menuItemSchema.index({ name: "text", description: "text", ingredients: "text", allergens: "text" });
menuItemSchema.index({ price: 1, isAvailable: 1, category: 1 });
exports.MenuItemModel = (0, mongoose_1.model)("MenuItem", menuItemSchema);
