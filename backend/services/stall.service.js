"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStalls = listStalls;
exports.getStallById = getStallById;
exports.getStallByVendorId = getStallByVendorId;
exports.createStall = createStall;
exports.updateStall = updateStall;
exports.updatePaymentMethods = updatePaymentMethods;
exports.deleteStall = deleteStall;
exports.canManageStall = canManageStall;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");

async function listStalls(query) {
    const filters = {};
    if (query.category) {
        filters.category = query.category;
    }
    if (query.location) {
        filters.location = { $regex: query.location, $options: "i" };
    }
    if (typeof query.isActive === "boolean") {
        filters.isActive = query.isActive;
    }
    if (query.q) {
        filters.$text = { $search: query.q };
    }
    return models_1.StallModel.find(filters)
        .populate("vendorIds", "firstName lastName email")
        .sort({ createdAt: -1 })
        .lean();
}

async function getStallById(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return null;
    }
    return models_1.StallModel.findById(stallId)
        .populate("vendorIds", "firstName lastName email")
        .lean();
}

async function getStallByVendorId(vendorId) {
    if (!(0, ids_1.isValidObjectId)(vendorId)) {
        return null;
    }
    const vendor = await models_1.VendorModel.findById(vendorId).select("stallId");
    if (!vendor || !vendor.stallId) {
        return null;
    }
    return models_1.StallModel.findById(vendor.stallId)
        .populate("vendorIds", "firstName lastName email")
        .lean();
}

async function createStall(input) {
    const stall = await models_1.StallModel.create({
        vendorIds: input.vendorIds || [],
        name: input.name,
        description: input.description ?? "",
        location: input.location,
        section: input.section ?? "",
        category: input.category ?? "general",
        photos: input.photos ?? [],
        openingHours: input.openingHours ?? "",
        openingTime: input.openingTime ?? "",
        closingTime: input.closingTime ?? "",
        status: input.status ?? "pending",
        isActive: input.isActive ?? true,
        paymentMethods: input.paymentMethods || ["Cash"],
        paymentDetails: {
            gcashNumber: input.gcashNumber || null,
            mayaNumber: input.mayaNumber || null,
        }
    });
    return stall.toObject();
}

async function updateStall(stallId, updates) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return null;
    }
    return models_1.StallModel.findByIdAndUpdate(
        stallId, 
        { $set: updates }, 
        { new: true }
    )
    .populate("vendorIds", "firstName lastName email")
    .lean();
}

async function updatePaymentMethods(stallId, paymentMethods, paymentDetails) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return null;
    }
    
    const updateData = {
        paymentMethods: paymentMethods || ["Cash"]
    };
    
    if (paymentDetails) {
        updateData.paymentDetails = paymentDetails;
    }
    
    return models_1.StallModel.findByIdAndUpdate(
        stallId,
        { $set: updateData },
        { new: true }
    )
    .populate("vendorIds", "firstName lastName email")
    .lean();
}

async function deleteStall(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return false;
    }
    const result = await models_1.StallModel.findByIdAndDelete(stallId);
    return Boolean(result);
}

async function canManageStall(stallId, actorId, actorRole) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return false;
    }
    if (actorRole === "admin") {
        return true;
    }
    const stall = await models_1.StallModel.findById(stallId).select("vendorIds").lean();
    if (!stall) {
        return false;
    }
    if (!stall.vendorIds || stall.vendorIds.length === 0) {
        return false;
    }
    return stall.vendorIds.some(id => id.toString() === actorId);
}