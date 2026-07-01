"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProductById = getProductById;
exports.getProductsByStall = getProductsByStall;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.incrementFavoriteCount = incrementFavoriteCount;
exports.decrementFavoriteCount = decrementFavoriteCount;
exports.updateProductRating = updateProductRating;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");

async function listProducts(query, populateStall = false) {
    const filters = {};
    if (query.stallId && (0, ids_1.isValidObjectId)(query.stallId)) {
        filters.stallId = query.stallId;
    }
    if (query.category) {
        filters.category = query.category;
    }
    if (typeof query.isAvailable === "boolean") {
        filters.isAvailable = query.isAvailable;
    }
    if (query.q) {
        filters.$text = { $search: query.q };
    }
    if (query.minPrice !== undefined) {
        filters.price = { ...filters.price, $gte: query.minPrice };
    }
    if (query.maxPrice !== undefined) {
        filters.price = { ...filters.price, $lte: query.maxPrice };
    }

    let q = models_1.ProductModel.find(filters).sort({ createdAt: -1 });
    if (populateStall) {
        q = q.populate("stallId", "name location");
    }
    return q.lean();
}

async function getProductsByStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        console.error(`❌ Invalid stallId: ${stallId}`);
        return [];
    }
    
    try {
        const products = await models_1.ProductModel.find({ 
            stallId: stallId, 
            isAvailable: true 
        }).sort({ favoriteCount: -1 }).lean();
        
        console.log(`✅ Found ${products.length} products for stall ${stallId}`);
        return products;
    } catch (error) {
        console.error(`❌ Error fetching products for stall ${stallId}:`, error);
        return [];
    }
}

async function getProductById(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return null;
    }
    return models_1.ProductModel.findById(productId)
        .populate("stallId", "name location photos")
        .lean();
}

async function createProduct(input) {
    const stall = await models_1.StallModel.findById(input.stallId).select("_id").lean();
    if (!stall) {
        return null;
    }

    const product = await models_1.ProductModel.create({
        stallId: input.stallId,
        name: input.name,
        description: input.description ?? "",
        ingredients: input.ingredients ?? [],
        allergens: input.allergens ?? [],
        nutrition: input.nutrition ?? {},
        price: input.price,
        photos: input.photos ?? [],
        category: input.category ?? "general",
        isAvailable: input.isAvailable ?? true,
        isFeatured: input.isFeatured ?? false
    });

    return product.toObject();
}

async function updateProduct(productId, updates) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return null;
    }
    return models_1.ProductModel.findByIdAndUpdate(productId, { $set: updates }, { new: true }).lean();
}

async function deleteProduct(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return false;
    }
    const result = await models_1.ProductModel.findByIdAndDelete(productId);
    return Boolean(result);
}

async function incrementFavoriteCount(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return null;
    }
    return models_1.ProductModel.findByIdAndUpdate(productId, {
        $inc: { favoriteCount: 1 }
    }, { new: true }).lean();
}

async function decrementFavoriteCount(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return null;
    }
    return models_1.ProductModel.findByIdAndUpdate(productId, {
        $inc: { favoriteCount: -1 }
    }, { new: true }).lean();
}

async function updateProductRating(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return null;
    }
    const reviews = await models_1.ReviewModel.find({ 
        productId, 
        isVisible: true 
    }).select("rating");
    
    const reviewCount = reviews.length;
    if (reviewCount === 0) {
        return models_1.ProductModel.findByIdAndUpdate(productId, {
            $set: { averageRating: 0, reviewCount: 0 }
        }, { new: true }).lean();
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviewCount;

    return models_1.ProductModel.findByIdAndUpdate(productId, {
        $set: { averageRating, reviewCount }
    }, { new: true }).lean();
}