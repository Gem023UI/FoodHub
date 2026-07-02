"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

exports.listStalls = listStalls;
exports.getStallCard = getStallCard;
exports.getStallDetails = getStallDetails;
exports.getStallByVendorAuthId = getStallByVendorAuthId;
exports.createStall = createStall;
exports.updateStall = updateStall;
exports.deleteStall = deleteStall;
exports.canManageStall = canManageStall;

exports.listProductsForStall = listProductsForStall;
exports.listProductsByCategory = listProductsByCategory;
exports.getProductById = getProductById;
exports.getProductWithStallDoc = getProductWithStallDoc;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;

exports.addVendorToStall = addVendorToStall;
exports.updateVendorRoster = updateVendorRoster;
exports.removeVendorFromStall = removeVendorFromStall;
exports.getVendorsByStall = getVendorsByStall;
exports.getVendorProfile = getVendorProfile;

exports.addReview = addReview;
exports.getReviewsForProduct = getReviewsForProduct;
exports.deleteReview = deleteReview;

const models_1 = require("../models");
const ids_1 = require("../utils/ids");
const bcryptjs_1 = require("bcryptjs");

// ─────────────────────────────── STALLS ───────────────────────────────────

async function listStalls(query = {}) {
    const filters = {};
    if (query.section !== undefined) filters.section = Number(query.section);
    if (typeof query.status === "boolean") filters.status = query.status;
    if (query.q) filters.$text = { $search: query.q };
    return models_1.StallModel.find(filters).sort({ createdAt: -1 }).lean();
}

// ── GET STALL CARD (picture, name, section) ──────────────────────────────
async function getStallCard(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await models_1.StallModel.findById(stallId)
        .select("stallName stallPicture section status")
        .lean();
    return stall;
}

// ── GET STALL DETAILS (all information, with contract check) ──────────────
async function getStallDetails(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return null;

    const stallData = stall.toObject({ virtuals: true });
    
    // Check if contract is active (in operation)
    const isInOperation = !!stallData.proofOfContract;
    stallData.isInOperation = isInOperation;
    stallData.message = isInOperation ? "Stall is currently in operation." : "Stall is currently closed (contract ended).";

    return stallData;
}

async function getStallByVendorAuthId(vendorAuthId) {
    // Find vendor by email since vendorAuthId is now the student ID
    const vendor = await models_1.StudentModel.findById(vendorAuthId).select("email");
    if (!vendor) return null;
    
    const stall = await models_1.StallModel.findOne({ "vendors.email": vendor.email });
    return stall ? stall.toObject({ virtuals: true }) : null;
}

async function createStall(input) {
    const stall = await models_1.StallModel.create({
        stallName: input.stallName,
        stallDescription: input.stallDescription ?? "",
        stallPicture: input.stallPicture ?? null,
        section: input.section,
        openHours: {
            openTime: input.openHours?.openTime ?? "",
            closingTime: input.openHours?.closingTime ?? ""
        },
        status: input.status ?? true,
        proofOfContract: input.proofOfContract ?? null,
        paymentMethod: input.paymentMethod ?? {
            cash: { available: true },
            gcash: { available: false, accountName: "", phoneNumber: "" },
            paymaya: { available: false, accountName: "", phoneNumber: "" }
        },
        products: [],
        vendors: []
    });
    return stall.toObject();
}

async function updateStall(stallId, updates) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const allowed = ["stallName", "stallDescription", "stallPicture", "section", "openHours", "status", "proofOfContract", "paymentMethod"];
    const sanitized = {};
    for (const f of allowed) if (f in updates) sanitized[f] = updates[f];

    const stall = await models_1.StallModel.findByIdAndUpdate(
        stallId,
        { $set: sanitized },
        { new: true, runValidators: true }
    );
    return stall ? stall.toObject({ virtuals: true }) : null;
}

async function deleteStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return false;
    const result = await models_1.StallModel.findByIdAndDelete(stallId);
    return Boolean(result);
}

async function canManageStall(stallId, actorId, actorRole) {
    if (actorRole === "admin") return true;
    if (!(0, ids_1.isValidObjectId)(stallId)) return false;
    
    const vendor = await models_1.StudentModel.findById(actorId).select("email");
    if (!vendor) return false;
    
    const stall = await models_1.StallModel.findOne({ 
        _id: stallId, 
        "vendors.email": vendor.email 
    }).lean();
    
    if (!stall) return false;
    const vendorSub = stall.vendors.find(v => v.email === vendor.email);
    return vendorSub && vendorSub.status === "verified";
}

// ─────────────────────────────── PRODUCTS ──────────────────────────────────

async function getProductWithStallDoc(productId) {
    if (!(0, ids_1.isValidObjectId)(productId)) return null;
    const stall = await models_1.StallModel.findOne({ "products._id": productId });
    if (!stall) return null;
    const product = stall.products.id(productId);
    if (!product) return null;
    return { stall, product };
}

async function listProductsForStall(stallId, filters = {}) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return [];
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return [];
    let products = stall.products || [];
    if (filters.category) products = products.filter(p => p.category === filters.category);
    if (typeof filters.available === "boolean") products = products.filter(p => p.available === filters.available);
    return products.map(p => p.toObject({ virtuals: true }));
}

async function listProductsByCategory(category) {
    const stalls = await models_1.StallModel.find({ "products.category": category });
    const products = [];
    for (const stall of stalls) {
        for (const product of stall.products || []) {
            if (product.category === category && product.available) {
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

async function getProductById(productId) {
    const found = await getProductWithStallDoc(productId);
    if (!found) return null;
    return {
        ...found.product.toObject({ virtuals: true }),
        stallId: { _id: found.stall._id, name: found.stall.stallName, picture: found.stall.stallPicture }
    };
}

async function createProduct(stallId, input) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return null;

    stall.products.push({
        productName: input.productName,
        productDescription: input.productDescription ?? "",
        productImages: input.productImages ?? [],
        category: input.category,
        price: input.price,
        nutrition: input.nutrition ?? {},
        stocks: input.stocks ?? 0,
        available: input.available ?? true,
        favorite: 0,
        reviews: []
    });
    await stall.save();
    return stall.products[stall.products.length - 1].toObject({ virtuals: true });
}

async function updateProduct(productId, updates) {
    const found = await getProductWithStallDoc(productId);
    if (!found) return null;

    const allowed = ["productName", "productDescription", "productImages", "category", "price", "nutrition", "stocks", "available"];
    for (const f of allowed) if (f in updates) found.product[f] = updates[f];

    await found.stall.save();
    return found.product.toObject({ virtuals: true });
}

async function deleteProduct(productId) {
    const found = await getProductWithStallDoc(productId);
    if (!found) return false;
    found.product.deleteOne();
    await found.stall.save();
    return true;
}

// ─────────────────────────────── VENDOR ROSTER ─────────────────────────────

async function getVendorsByStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return [];
    const stall = await models_1.StallModel.findById(stallId).select("vendors").lean();
    return stall ? stall.vendors || [] : [];
}

async function getVendorProfile(vendorEmail) {
    const stall = await models_1.StallModel.findOne({ "vendors.email": vendorEmail });
    if (!stall) return null;
    
    const vendorSub = stall.vendors.find(v => v.email === vendorEmail);
    if (!vendorSub) return null;
    
    const student = await models_1.StudentModel.findOne({ email: vendorEmail })
        .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
        .lean();
    
    return {
        ...vendorSub.toObject(),
        ...(student || {}),
        stallId: stall._id,
        stallName: stall.stallName
    };
}

async function addVendorToStall(stallId, vendorData) {
    if (!(0, ids_1.isValidObjectId)(stallId)) return null;
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return null;
    
    // Check if vendor already exists
    if (stall.vendors.some(v => v.email === vendorData.email)) {
        return null;
    }
    
    stall.vendors.push(vendorData);
    await stall.save();
    return stall.vendors[stall.vendors.length - 1].toObject();
}

async function updateVendorRoster(vendorEmail, updates) {
    const stall = await models_1.StallModel.findOne({ "vendors.email": vendorEmail });
    if (!stall) return null;
    const vendorSub = stall.vendors.find(v => v.email === vendorEmail);
    if (!vendorSub) return null;

    const allowed = ["firstName", "lastName", "email", "phoneNumber", "vendorImage", "role", "position", "status"];
    for (const f of allowed) if (f in updates) vendorSub[f] = updates[f];

    await stall.save();
    return vendorSub.toObject();
}

async function removeVendorFromStall(vendorEmail) {
    const stall = await models_1.StallModel.findOne({ "vendors.email": vendorEmail });
    if (!stall) return false;
    const before = stall.vendors.length;
    stall.vendors = stall.vendors.filter(v => v.email !== vendorEmail);
    if (stall.vendors.length === before) return false;
    await stall.save();
    return true;
}

// ─────────────────────────────── REVIEWS ───────────────────────────────────

async function addReview(productId, data) {
    const found = await getProductWithStallDoc(productId);
    if (!found) return { success: false, reason: "product_not_found" };

    const email = data.reviewEmail.toLowerCase().trim();
    const already = found.product.reviews.some(r => r.reviewEmail === email);
    if (already) return { success: false, reason: "already_reviewed" };

    found.product.reviews.push({
        reviewEmail: email,
        reviewProfileUrl: data.reviewProfileUrl || null,
        rating: data.rating,
        comment: data.comment || "",
        reviewImages: data.reviewImages || [],
        reviewDate: new Date()
    });
    await found.stall.save();

    const review = found.product.reviews[found.product.reviews.length - 1];
    return { success: true, data: { review: review.toObject() } };
}

async function getReviewsForProduct(productId) {
    const found = await getProductWithStallDoc(productId);
    if (!found) return [];
    return found.product.reviews
        .map(r => r.toObject())
        .sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
}

async function deleteReview(productId, reviewId) {
    const found = await getProductWithStallDoc(productId);
    if (!found) return false;
    const review = found.product.reviews.id(reviewId);
    if (!review) return false;
    review.deleteOne();
    await found.stall.save();
    return true;
}