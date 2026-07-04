"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStalls = getStalls;
exports.getStallById = getStallById;
exports.getStallBySection = getStallBySection;
exports.getStallByVendorAuthId = getStallByVendorAuthId;
exports.getVendorStall = getVendorStall;
exports.getVendorProfile = getVendorProfile;
exports.getStallCard = getStallCard;
exports.getStallDetails = getStallDetails;
exports.getStallVendors = getStallVendors;
exports.getStallProductsByCategory = getStallProductsByCategory;
exports.getStallProductReviews = getStallProductReviews;
exports.createStall = createStall;
exports.updateStall = updateStall;
exports.deleteStall = deleteStall;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.addReview = addReview;
exports.getReviewsForProduct = getReviewsForProduct;
exports.deleteReview = deleteReview;

// Import models directly
const stall_model_1 = require("../models/stall.model");
const vendor_model_1 = require("../models/vendor.model");
const ids_1 = require("../utils/ids");

// ── GET STALLS ──────────────────────────────────────────────────────────
async function getStalls() {
    try {
        console.log("🔍 getStalls called");
        const stalls = await stall_model_1.StallModel.find({}).lean();
        console.log(`🔍 Found ${stalls.length} stalls`);
        return stalls;
    } catch (error) {
        console.error("❌ Error in getStalls:", error);
        throw error;
    }
}

// ── GET STALL BY ID ────────────────────────────────────────────────────
async function getStallById(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    return stall_model_1.StallModel.findById(stallId).lean();
}

// ── GET STALL BY SECTION ──────────────────────────────────────────────
async function getStallBySection(section) {
    return stall_model_1.StallModel.findOne({ section }).lean();
}

// ── GET STALL BY VENDOR AUTH ID ──────────────────────────────────────
async function getStallByVendorAuthId(vendorAuthId) {
    try {
        const vendor = await vendor_model_1.VendorModel.findById(vendorAuthId).select("email").lean();
        if (!vendor) return null;
        return stall_model_1.StallModel.findOne({ "vendors.email": vendor.email }).lean();
    } catch (error) {
        console.error("Error in getStallByVendorAuthId:", error);
        return null;
    }
}

// ── GET VENDOR STALL ──────────────────────────────────────────────────
async function getVendorStall(vendorAuthId) {
    try {
        const vendor = await vendor_model_1.VendorModel.findById(vendorAuthId).select("email").lean();
        if (!vendor) return null;
        return stall_model_1.StallModel.findOne({ "vendors.email": vendor.email }).lean();
    } catch (error) {
        console.error("Error in getVendorStall:", error);
        return null;
    }
}

// ── GET VENDOR PROFILE ──────────────────────────────────────────────────
async function getVendorProfile(vendorAuthId) {
    try {
        const vendor = await vendor_model_1.VendorModel.findById(vendorAuthId)
        .select("firstName lastName email profilePictureUrl contactNumber position status active")
        .lean();
        if (!vendor) return null;
        
        const stall = await stall_model_1.StallModel.findOne({ "vendors.email": vendor.email }).lean();
        if (!stall) {
            return {
                ...vendor,
                stallId: stall._id,
                stallName: stall.stallName,
                position: vendorSub?.position ?? vendor.position,
                vendorStatus: vendorSub?.status ?? vendor.status
            };
        }
        
        const vendorSub = stall.vendors.find(v => v.email === vendor.email);
        
        return {
            ...vendor,
            stallId: stall._id,
            stallName: stall.stallName,
            position: vendorSub?.position,
            vendorStatus: vendorSub?.status
        };
    } catch (error) {
        console.error("Error in getVendorProfile:", error);
        return null;
    }
}

// ── GET STALL CARD ────────────────────────────────────────────────────
async function getStallCard(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    return stall_model_1.StallModel.findById(stallId)
        .select("stallName stallPicture section status")
        .lean();
}

// ── GET STALL DETAILS ──────────────────────────────────────────────────
async function getStallDetails(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    return stall_model_1.StallModel.findById(stallId)
        .populate("vendors", "firstName lastName email")
        .lean();
}

// ── GET STALL VENDORS ──────────────────────────────────────────────────
async function getStallVendors(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await stall_model_1.StallModel.findById(stallId).select("vendors").lean();
    return stall ? stall.vendors : null;
}

// ── GET STALL PRODUCTS BY CATEGORY ────────────────────────────────────
async function getStallProductsByCategory(stallId, category) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await stall_model_1.StallModel.findById(stallId).lean();
    if (!stall) return null;
    return stall.products.filter(p => p.category === category);
}

// ── GET STALL PRODUCT REVIEWS ──────────────────────────────────────────
async function getStallProductReviews(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await stall_model_1.StallModel.findById(stallId).lean();
    if (!stall) return null;
    
    const allReviews = [];
    for (const product of stall.products || []) {
        if (product.reviews) {
            allReviews.push({
                productId: product._id,
                productName: product.productName,
                reviews: product.reviews
            });
        }
    }
    return allReviews;
}

// ── CREATE STALL ──────────────────────────────────────────────────────
async function createStall(data) {
    const stall = new stall_model_1.StallModel(data);
    await stall.save();
    return stall;
}

// ── UPDATE STALL ──────────────────────────────────────────────────────
async function updateStall(stallId, updates) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    return stall_model_1.StallModel.findByIdAndUpdate(stallId, updates, { new: true }).lean();
}

// ── DELETE STALL ──────────────────────────────────────────────────────
async function deleteStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return false;
    const result = await stall_model_1.StallModel.findByIdAndDelete(stallId);
    return !!result;
}

// ── ADD PRODUCT ──────────────────────────────────────────────────────
async function addProduct(stallId, productData) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await stall_model_1.StallModel.findById(stallId);
    if (!stall) return null;
    
    stall.products.push(productData);
    await stall.save();
    
    const addedProduct = stall.products[stall.products.length - 1];
    return addedProduct;
}

// ── UPDATE PRODUCT ──────────────────────────────────────────────────
async function updateProduct(stallId, productId, updates) {
    if (!(0, ids_1.isValidObjectId)(stallId) || !(0, ids_1.isValidObjectId)(productId)) return null;
    
    const stall = await stall_model_1.StallModel.findById(stallId);
    if (!stall) return null;
    
    const product = stall.products.find(p => p._id.toString() === productId);
    if (!product) return null;
    
    const allowed = ["productName", "productDescription", "productImages", "price", "category", "stocks", "available", "nutrition"];
    for (const f of allowed) {
        if (f in updates) product[f] = updates[f];
    }
    
    await stall.save();
    return product;
}

// ── DELETE PRODUCT ──────────────────────────────────────────────────
async function deleteProduct(stallId, productId) {
    if (!(0, ids_1.isValidObjectId)(stallId) || !(0, ids_1.isValidObjectId)(productId)) return false;
    
    const stall = await stall_model_1.StallModel.findById(stallId);
    if (!stall) return false;
    
    const index = stall.products.findIndex(p => p._id.toString() === productId);
    if (index === -1) return false;
    
    stall.products.splice(index, 1);
    await stall.save();
    return true;
}

// ── ADD REVIEW ──────────────────────────────────────────────────────────
async function addReview(productId, reviewData) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return { success: false, reason: "invalid_product_id" };
    }

    // Find stall containing this product
    const stall = await stall_model_1.StallModel.findOne({
        "products._id": productId
    });

    if (!stall) {
        return { success: false, reason: "product_not_found" };
    }

    // Find the product
    const product = stall.products.find(p => p._id.toString() === productId);
    if (!product) {
        return { success: false, reason: "product_not_found" };
    }

    // Add the review
    product.reviews.push(reviewData);
    await stall.save();

    // Get the newly added review
    const addedReview = product.reviews[product.reviews.length - 1];

    return { 
        success: true, 
        data: { 
            review: {
                ...addedReview.toObject(),
                productId: product._id,
                productName: product.productName
            } 
        } 
    };
}

// ── GET REVIEWS FOR PRODUCT ──────────────────────────────────────────
async function getReviewsForProduct(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) {
        return [];
    }

    const stall = await stall_model_1.StallModel.findOne({
        "products._id": productId
    });

    if (!stall) return [];

    const product = stall.products.find(p => p._id.toString() === productId);
    if (!product) return [];

    return product.reviews || [];
}

// ── DELETE REVIEW ──────────────────────────────────────────────────────
async function deleteReview(productId, reviewId) {
    if (!(0, ids_1.isValidObjectId)(productId) || !(0, ids_1.isValidObjectId)(reviewId)) {
        return false;
    }

    const stall = await stall_model_1.StallModel.findOne({
        "products._id": productId
    });

    if (!stall) return false;

    const product = stall.products.find(p => p._id.toString() === productId);
    if (!product) return false;

    const index = product.reviews.findIndex(r => r._id.toString() === reviewId);
    if (index === -1) return false;

    product.reviews.splice(index, 1);
    await stall.save();
    return true;
}