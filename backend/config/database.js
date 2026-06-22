"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.ensureCollections = ensureCollections;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
async function connectDatabase(mongoUri) {
    await mongoose_1.default.connect(mongoUri);
}
async function ensureCollections() {
    await Promise.all([
        models_1.UserModel.createCollection(),
        models_1.StallModel.createCollection(),
        models_1.MenuItemModel.createCollection(),
        models_1.ReviewModel.createCollection(),
        models_1.FavoriteModel.createCollection(),
        models_1.BudgetModel.createCollection()
    ]);
}
