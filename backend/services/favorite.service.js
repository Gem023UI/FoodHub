"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFavoritesByUser = listFavoritesByUser;
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
const models_1 = require("../models");
const ids_1 = require("../utils/ids");
async function listFavoritesByUser(userId) {
    return models_1.FavoriteModel.find({ userId }).sort({ createdAt: -1 }).lean();
}
async function addFavorite(userId, target) {
    if (!(0, ids_1.isValidObjectId)(target.targetId)) {
        return null;
    }
    if (target.targetType === "stall") {
        const stall = await models_1.StallModel.findById(target.targetId).select("_id").lean();
        if (!stall) {
            return null;
        }
    }
    else {
        const menuItem = await models_1.MenuItemModel.findById(target.targetId).select("_id").lean();
        if (!menuItem) {
            return null;
        }
    }
    const favorite = await models_1.FavoriteModel.create({
        userId,
        targetType: target.targetType,
        targetId: target.targetId
    });
    return favorite.toObject();
}
async function removeFavorite(userId, targetType, targetId) {
    if (!(0, ids_1.isValidObjectId)(targetId)) {
        return false;
    }
    const result = await models_1.FavoriteModel.findOneAndDelete({ userId, targetType, targetId });
    return Boolean(result);
}
