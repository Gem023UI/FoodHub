"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.getCategoryById = getCategoryById;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");
async function listCategories() {
    return models_1.CategoryModel.find({}).sort({ name: 1 }).lean();
}
async function getCategoryById(categoryId) {
    if (!(0, ids_1.isValidObjectId)(categoryId)) {
        return null;
    }
    return models_1.CategoryModel.findById(categoryId).lean();
}
async function createCategory(input) {
    const category = await models_1.CategoryModel.create({
        name: input.name.trim(),
        description: input.description?.trim() ?? ""
    });
    return category.toObject();
}
async function updateCategory(categoryId, updates) {
    if (!(0, ids_1.isValidObjectId)(categoryId)) {
        return null;
    }
    return models_1.CategoryModel.findByIdAndUpdate(categoryId, { $set: updates }, { new: true }).lean();
}
async function deleteCategory(categoryId) {
    if (!(0, ids_1.isValidObjectId)(categoryId)) {
        return false;
    }
    const result = await models_1.CategoryModel.findByIdAndDelete(categoryId);
    return Boolean(result);
}
