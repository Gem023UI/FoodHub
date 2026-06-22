"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStalls = listStalls;
exports.getStallById = getStallById;
exports.createStall = createStall;
exports.updateStall = updateStall;
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
    return models_1.StallModel.find(filters).populate("vendorId", "name email").sort({ createdAt: -1 }).lean();
}
async function getStallById(stallId) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return null;
    }
    return models_1.StallModel.findById(stallId).populate("vendorId", "name email").lean();
}
async function createStall(input) {
    const stall = await models_1.StallModel.create({
        vendorId: input.vendorId,
        name: input.name,
        description: input.description ?? "",
        location: input.location,
        section: input.section ?? "",
        category: input.category ?? "general",
        photoUrl: input.photoUrl ?? null,
        openingHours: input.openingHours ?? "",
        status: input.status ?? "approved"
    });
    return stall.toObject();
}
async function updateStall(stallId, updates) {
    if (!(0, ids_1.isValidObjectId)(stallId)) {
        return null;
    }
    return models_1.StallModel.findByIdAndUpdate(stallId, { $set: updates }, { new: true }).populate("vendorId", "name email").lean();
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
    const stall = await models_1.StallModel.findById(stallId).select("vendorId").lean();
    if (!stall) {
        return false;
    }
    return stall.vendorId.toString() === actorId;
}
