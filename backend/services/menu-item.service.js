"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMenuItems = listMenuItems;
exports.getMenuItemById = getMenuItemById;
exports.createMenuItem = createMenuItem;
exports.updateMenuItem = updateMenuItem;
exports.deleteMenuItem = deleteMenuItem;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");
async function listMenuItems(query, populateStall = false) {
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
    let q = models_1.MenuItemModel.find(filters).sort({ createdAt: -1 });
    if (populateStall) {
        q = q.populate("stallId", "name");
    }
    return q.lean();
}
async function getMenuItemById(menuItemId) {
    if (!(0, ids_1.isValidObjectId)(menuItemId)) {
        return null;
    }
    return models_1.MenuItemModel.findById(menuItemId).lean();
}
async function createMenuItem(input) {
    const stall = await models_1.StallModel.findById(input.stallId).select("_id").lean();
    if (!stall) {
        return null;
    }
    const menuItem = await models_1.MenuItemModel.create({
        stallId: input.stallId,
        name: input.name,
        description: input.description ?? "",
        ingredients: input.ingredients ?? [],
        allergens: input.allergens ?? [],
        nutrition: input.nutrition ?? {},
        price: input.price,
        photoUrl: input.photoUrl ?? null,
        category: input.category ?? "general",
        isAvailable: input.isAvailable ?? true,
        isFeatured: input.isFeatured ?? false
    });
    return menuItem.toObject();
}
async function updateMenuItem(menuItemId, updates) {
    if (!(0, ids_1.isValidObjectId)(menuItemId)) {
        return null;
    }
    return models_1.MenuItemModel.findByIdAndUpdate(menuItemId, { $set: updates }, { new: true }).lean();
}
async function deleteMenuItem(menuItemId) {
    if (!(0, ids_1.isValidObjectId)(menuItemId)) {
        return false;
    }
    const result = await models_1.MenuItemModel.findByIdAndDelete(menuItemId);
    return Boolean(result);
}
