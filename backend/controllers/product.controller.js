"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductCard = getProductCard;
exports.getProductDetails = getProductDetails;
exports.getProductsByStall = getProductsByStall;
exports.getProductsByCategory = getProductsByCategory;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;

const stall_controller_1 = require("./stall.controller");
const models_1 = require("../models");
const ids_1 = require("../utils/ids");

// ── GET PRODUCT CARD (first image, name, description, nutrition, price, favorite count) ──
async function getProductCard(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) return null;
    
    const stall = await models_1.StallModel.findOne({ "products._id": productId });
    if (!stall) return null;
    
    const product = stall.products.id(productId);
    if (!product) return null;

    return {
        productId: product._id,
        productName: product.productName,
        productDescription: product.productDescription,
        productImage: product.productImages && product.productImages.length > 0 ? product.productImages[0] : null,
        price: product.price,
        favorite: product.favorite || 0,
        nutrition: product.nutrition || {},
        stallId: stall._id,
        stallName: stall.stallName
    };
}

// ── GET PRODUCT DETAILS (all product information) ──
async function getProductDetails(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) return null;
    
    const stall = await models_1.StallModel.findOne({ "products._id": productId });
    if (!stall) return null;
    
    const product = stall.products.id(productId);
    if (!product) return null;

    return {
        ...product.toObject({ virtuals: true }),
        stallId: stall._id,
        stallName: stall.stallName,
        stallPicture: stall.stallPicture,
        stallStatus: stall.status
    };
}

// ── GET PRODUCTS BY STALL ──────────────────────────────────────────────────
async function getProductsByStall(stallId, filters = {}) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return [];
    
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return [];
    
    let products = stall.products || [];
    
    if (filters.category) {
        products = products.filter(p => p.category === filters.category);
    }
    if (filters.available !== undefined) {
        products = products.filter(p => p.available === filters.available);
    }
    
    return products.map(p => ({
        ...p.toObject({ virtuals: true }),
        stallId: stall._id,
        stallName: stall.stallName
    }));
}

// ── GET PRODUCTS BY CATEGORY ──────────────────────────────────────────────
async function getProductsByCategory(category) {
    const stalls = await models_1.StallModel.find({ "products.category": category });
    const products = [];
    
    for (const stall of stalls) {
        for (const product of stall.products || []) {
            if (product.category === category) {
                products.push({
                    ...product.toObject({ virtuals: true }),
                    stallId: stall._id,
                    stallName: stall.stallName
                });
            }
        }
    }
    
    return products;
}

// ── CREATE PRODUCT ──────────────────────────────────────────────────────────
async function createProduct(stallId, input) {
    return (0, stall_controller_1.addProduct)(stallId, input);
}

// ── UPDATE PRODUCT ──────────────────────────────────────────────────────────
async function updateProduct(productId, updates) {
    const stall = await models_1.StallModel.findOne({ "products._id": productId });
    if (!stall) return null;
    return (0, stall_controller_1.updateProduct)(stall._id.toString(), productId, updates);
}

// ── DELETE PRODUCT ──────────────────────────────────────────────────────────
async function deleteProduct(productId) {
    const stall = await models_1.StallModel.findOne({ "products._id": productId });
    if (!stall) return false;
    return (0, stall_controller_1.deleteProduct)(stall._id.toString(), productId);
}