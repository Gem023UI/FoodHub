"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteModel = void 0;
const mongoose_1 = require("mongoose");
const favoriteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, required: true, enum: ["stall", "menuItem"], index: true },
    targetId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true }
}, { timestamps: true });
favoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
exports.FavoriteModel = (0, mongoose_1.model)("Favorite", favoriteSchema);
