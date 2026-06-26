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
    console.log("✅ Connected to MongoDB");
}

async function ensureCollections() {
    // Only create collections for models that exist
    const collections = [];
    
    // Student
    if (models_1.StudentModel) {
        collections.push(models_1.StudentModel.createCollection().catch(err => 
            console.warn("⚠️ Student collection already exists or error:", err.message)
        ));
    }
    
    // Vendor
    if (models_1.VendorModel) {
        collections.push(models_1.VendorModel.createCollection().catch(err => 
            console.warn("⚠️ Vendor collection already exists or error:", err.message)
        ));
    }
    
    // Admin
    if (models_1.AdminModel) {
        collections.push(models_1.AdminModel.createCollection().catch(err => 
            console.warn("⚠️ Admin collection already exists or error:", err.message)
        ));
    }
    
    // Stall
    if (models_1.StallModel) {
        collections.push(models_1.StallModel.createCollection().catch(err => 
            console.warn("⚠️ Stall collection already exists or error:", err.message)
        ));
    }
    
    // MenuItem
    if (models_1.MenuItemModel) {
        collections.push(models_1.MenuItemModel.createCollection().catch(err => 
            console.warn("⚠️ MenuItem collection already exists or error:", err.message)
        ));
    }
    
    // Review
    if (models_1.ReviewModel) {
        collections.push(models_1.ReviewModel.createCollection().catch(err => 
            console.warn("⚠️ Review collection already exists or error:", err.message)
        ));
    }
    
    // Favorite
    if (models_1.FavoriteModel) {
        collections.push(models_1.FavoriteModel.createCollection().catch(err => 
            console.warn("⚠️ Favorite collection already exists or error:", err.message)
        ));
    }
    
    // Budget
    if (models_1.BudgetModel) {
        collections.push(models_1.BudgetModel.createCollection().catch(err => 
            console.warn("⚠️ Budget collection already exists or error:", err.message)
        ));
    }
    
    // Order
    if (models_1.OrderModel) {
        collections.push(models_1.OrderModel.createCollection().catch(err => 
            console.warn("⚠️ Order collection already exists or error:", err.message)
        ));
    }
    
    // Report
    if (models_1.ReportModel) {
        collections.push(models_1.ReportModel.createCollection().catch(err => 
            console.warn("⚠️ Report collection already exists or error:", err.message)
        ));
    }
    
    await Promise.all(collections);
    console.log("✅ Collections ensured");
}