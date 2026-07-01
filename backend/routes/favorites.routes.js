"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const product_service_1 = require("../services/product.service");

const favoritesRouter = (0, express_1.Router)();
exports.favoritesRouter = favoritesRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ─── TOGGLE FAVORITE ────────────────────────────────────────────────────
favoritesRouter.post("/toggle", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const { productId } = request.body;

    if (!productId) {
        response.status(400).json({ message: "Product ID is required." });
        return;
    }

    try {
        // Get product details
        const product = await models_1.ProductModel.findById(productId).populate("stallId", "name");
        if (!product) {
            response.status(404).json({ message: "Product not found." });
            return;
        }

        // Check if already favorited
        const existing = await models_1.FavoriteModel.findOne({ 
            studentId, 
            productId 
        });

        let isFavorited = false;

        if (existing) {
            // Remove favorite
            await models_1.FavoriteModel.findByIdAndDelete(existing._id);
            await (0, product_service_1.decrementFavoriteCount)(productId);
            isFavorited = false;
        } else {
            // Add favorite
            await models_1.FavoriteModel.create({
                studentId,
                productId,
                course: request.userCourse || "Unknown",
                category: product.category,
                productName: product.name,
                stallName: product.stallId?.name || "Unknown"
            });
            await (0, product_service_1.incrementFavoriteCount)(productId);
            isFavorited = true;
        }

        response.json({ isFavorited });
    } catch (error) {
        console.error("Error toggling favorite:", error);
        response.status(500).json({ message: "Failed to toggle favorite." });
    }
});

// ─── CHECK IF FAVORITED ──────────────────────────────────────────────────
favoritesRouter.get("/check/:productId", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const productId = firstParam(request.params.productId);

    if (!productId) {
        response.status(400).json({ message: "Product ID is required." });
        return;
    }

    try {
        const existing = await models_1.FavoriteModel.findOne({ 
            studentId, 
            productId 
        });
        response.json({ isFavorited: !!existing });
    } catch (error) {
        console.error("Error checking favorite:", error);
        response.status(500).json({ message: "Failed to check favorite." });
    }
});

// ─── GET STUDENT FAVORITES ──────────────────────────────────────────────
favoritesRouter.get("/", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;

    try {
        const favorites = await models_1.FavoriteModel.find({ studentId })
            .populate("productId")
            .sort({ createdAt: -1 })
            .lean();
        
        response.json({ favorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        response.status(500).json({ message: "Failed to fetch favorites." });
    }
});

// ─── GET MOST FAVORITED PRODUCTS ────────────────────────────────────────
favoritesRouter.get("/trending", async (request, response) => {
    try {
        const trending = await models_1.FavoriteModel.aggregate([
            {
                $group: {
                    _id: "$productId",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    productId: "$_id",
                    name: "$product.name",
                    price: "$product.price",
                    category: "$product.category",
                    favoriteCount: "$count",
                    nutrition: "$product.nutrition"
                }
            },
            { $sort: { favoriteCount: -1 } },
            { $limit: 10 }
        ]);

        response.json(trending);
    } catch (error) {
        console.error("Error fetching trending:", error);
        response.status(500).json({ message: "Failed to fetch trending." });
    }
});

// ─── GET MOST FAVORITED BY CATEGORY ─────────────────────────────────────
favoritesRouter.get("/trending/category/:category", async (request, response) => {
    const category = firstParam(request.params.category);

    try {
        const trending = await models_1.FavoriteModel.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $match: {
                    "product.category": category
                }
            },
            {
                $group: {
                    _id: "$productId",
                    count: { $sum: 1 },
                    product: { $first: "$product" }
                }
            },
            {
                $project: {
                    productId: "$_id",
                    name: "$product.name",
                    price: "$product.price",
                    category: "$product.category",
                    favoriteCount: "$count",
                    nutrition: "$product.nutrition"
                }
            },
            { $sort: { favoriteCount: -1 } },
            { $limit: 10 }
        ]);

        response.json(trending);
    } catch (error) {
        console.error("Error fetching trending by category:", error);
        response.status(500).json({ message: "Failed to fetch trending by category." });
    }
});