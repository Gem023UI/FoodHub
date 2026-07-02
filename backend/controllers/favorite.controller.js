"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFavorite = toggleFavorite;
exports.getStudentFavorites = getStudentFavorites;
exports.getFavoritesByCategory = getFavoritesByCategory;
exports.getTopFavoritesByCourse = getTopFavoritesByCourse;
exports.getTopFavoritesByPeriod = getTopFavoritesByPeriod;
exports.getAllStallsWithFavoriteCount = getAllStallsWithFavoriteCount;

const models_1 = require("../models");
const ids_1 = require("../utils/ids");

// Toggles a favorite for a student/product pair
async function toggleFavorite(studentId, productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) return { success: false, reason: "invalid_id" };

    const student = await models_1.StudentModel.findById(studentId);
    if (!student) return { success: false, reason: "student_not_found" };

    const stall = await models_1.StallModel.findOne({ "products._id": productId });
    if (!stall) return { success: false, reason: "product_not_found" };
    const product = stall.products.id(productId);

    const idx = student.favorites.findIndex(f => f.productId.toString() === productId);

    let isFavorited;
    if (idx >= 0) {
        student.favorites.splice(idx, 1);
        product.favorite = Math.max(0, (product.favorite || 0) - 1);
        isFavorited = false;
    } else {
        student.favorites.push({
            stallId: stall._id,
            productId: product._id,
            productName: product.productName,
            stallName: stall.stallName,
            date: new Date()
        });
        product.favorite = (product.favorite || 0) + 1;
        isFavorited = true;
    }

    await student.save();
    await stall.save();

    return {
        success: true,
        data: { isFavorited, favoriteCount: product.favorite }
    };
}

// Get all favorites for a student
async function getStudentFavorites(studentId) {
    if (!(0, ids_1.isValidObjectId)(studentId)) return [];
    const student = await models_1.StudentModel.findById(studentId).select("favorites").lean();
    return student ? student.favorites : [];
}

// Get favorites by category for a student
async function getFavoritesByCategory(studentId) {
    if (!(0, ids_1.isValidObjectId)(studentId)) return [];
    
    const student = await models_1.StudentModel.findById(studentId).select("favorites course").lean();
    if (!student || !student.favorites || student.favorites.length === 0) return [];

    const stallIds = [...new Set(student.favorites.map(f => f.stallId.toString()))];
    const stalls = await models_1.StallModel.find({ _id: { $in: stallIds } }).lean();
    
    const productMap = {};
    for (const stall of stalls) {
        for (const product of stall.products || []) {
            productMap[product._id.toString()] = {
                ...product,
                stallName: stall.stallName,
                stallId: stall._id
            };
        }
    }

    const favoritesByCategory = {};
    for (const fav of student.favorites) {
        const product = productMap[fav.productId.toString()];
        if (!product) continue;
        
        const category = product.category || "Uncategorized";
        if (!favoritesByCategory[category]) {
            favoritesByCategory[category] = [];
        }
        favoritesByCategory[category].push({
            ...fav,
            productDetails: product
        });
    }

    // Sort each category by favorite count (descending)
    for (const category in favoritesByCategory) {
        favoritesByCategory[category].sort((a, b) => {
            const countA = a.productDetails.favorite || 0;
            const countB = b.productDetails.favorite || 0;
            return countB - countA;
        });
    }

    return favoritesByCategory;
}

// Get top 3 products from each category filtered by student course
async function getTopFavoritesByCourse(course) {
    const stalls = await models_1.StallModel.find({}).lean();
    
    const categoryMap = {};
    for (const stall of stalls) {
        for (const product of stall.products || []) {
            const category = product.category || "Uncategorized";
            if (!categoryMap[category]) {
                categoryMap[category] = [];
            }
            categoryMap[category].push({
                productId: product._id,
                productName: product.productName,
                productDescription: product.productDescription,
                productImages: product.productImages || [],
                price: product.price,
                category: product.category,
                favorite: product.favorite || 0,
                nutrition: product.nutrition || {},
                stallId: stall._id,
                stallName: stall.stallName
            });
        }
    }

    // Get top 3 from each category
    const result = {};
    for (const category in categoryMap) {
        const sorted = categoryMap[category].sort((a, b) => b.favorite - a.favorite);
        result[category] = sorted.slice(0, 3);
    }

    return result;
}

// Get top 3 products from each category filtered by period
async function getTopFavoritesByPeriod(period) {
    const now = new Date();
    let sinceDate;
    
    if (period === "today") {
        sinceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
        sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
        sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
        sinceDate = new Date(0); // all time
    }

    // Get all students and their favorites within the period
    const students = await models_1.StudentModel.find(
        { "favorites.date": { $gte: sinceDate } },
        "favorites"
    ).lean();

    // Count favorites per product
    const productCounts = {};
    for (const student of students) {
        for (const fav of student.favorites || []) {
            const key = fav.productId.toString();
            if (!productCounts[key]) {
                productCounts[key] = {
                    productId: fav.productId,
                    productName: fav.productName,
                    stallId: fav.stallId,
                    stallName: fav.stallName,
                    count: 0
                };
            }
            productCounts[key].count += 1;
        }
    }

    // Enrich with product details
    const stalls = await models_1.StallModel.find({}).lean();
    const productDetails = {};
    for (const stall of stalls) {
        for (const product of stall.products || []) {
            productDetails[product._id.toString()] = {
                productDescription: product.productDescription,
                productImages: product.productImages || [],
                price: product.price,
                category: product.category || "Uncategorized",
                nutrition: product.nutrition || {}
            };
        }
    }

    // Group by category
    const categoryMap = {};
    for (const key in productCounts) {
        const details = productDetails[key];
        if (!details) continue;
        
        const category = details.category || "Uncategorized";
        if (!categoryMap[category]) {
            categoryMap[category] = [];
        }
        categoryMap[category].push({
            ...productCounts[key],
            ...details,
            favoriteCount: productCounts[key].count
        });
    }

    // Get top 3 from each category
    const result = {};
    for (const category in categoryMap) {
        const sorted = categoryMap[category].sort((a, b) => b.favoriteCount - a.favoriteCount);
        result[category] = sorted.slice(0, 3);
    }

    return result;
}

// Get all stalls with their products and favorite counts
async function getAllStallsWithFavoriteCount() {
    const stalls = await models_1.StallModel.find({}).lean();
    
    return stalls.map(stall => ({
        stallId: stall._id,
        stallName: stall.stallName,
        stallPicture: stall.stallPicture,
        section: stall.section,
        status: stall.status,
        products: (stall.products || []).map(product => ({
            productId: product._id,
            productName: product.productName,
            productDescription: product.productDescription,
            productImages: product.productImages || [],
            price: product.price,
            category: product.category,
            favorite: product.favorite || 0,
            nutrition: product.nutrition || {},
            available: product.available
        }))
    }));
}