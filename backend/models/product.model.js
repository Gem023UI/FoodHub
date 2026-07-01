"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");

// Product Categories
const PRODUCT_CATEGORIES = [
    "Rice Meal",
    "Beverage", 
    "Snacks",
    "Add-ons"
];

const nutritionSchema = new mongoose_1.Schema({
    calories: { type: Number, min: 0, default: null },
    proteinGrams: { type: Number, min: 0, default: null },
    carbsGrams: { type: Number, min: 0, default: null },
    fatGrams: { type: Number, min: 0, default: null },
    sodiumMilligrams: { type: Number, min: 0, default: null }
}, { _id: false });

const productSchema = new mongoose_1.Schema({
    stallId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Stall", 
        required: true, 
        index: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 120 
    },
    description: { 
        type: String, 
        trim: true, 
        default: "" 
    },
    ingredients: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    nutrition: { type: nutritionSchema, default: {} },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    photos: [{ type: String, trim: true }],
    category: { 
        type: String, 
        trim: true, 
        enum: PRODUCT_CATEGORIES,
        default: "Rice Meal", 
        index: true 
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    isFeatured: { 
        type: Boolean, 
        default: false 
    },
    // Track favorites
    favoriteCount: { 
        type: Number, 
        default: 0,
        min: 0
    },
    // Track orders
    orderCount: { 
        type: Number, 
        default: 0,
        min: 0
    },
    // Average rating from reviews
    averageRating: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: { 
        type: Number, 
        default: 0,
        min: 0
    }
}, { timestamps: true });

// Indexes
productSchema.index({ stallId: 1, name: 1 }, { unique: true });
productSchema.index({ name: "text", description: "text", ingredients: "text", allergens: "text" });
productSchema.index({ price: 1, isAvailable: 1, category: 1 });
productSchema.index({ favoriteCount: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ orderCount: -1 });

exports.ProductModel = (0, mongoose_1.model)("Product", productSchema);
exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;