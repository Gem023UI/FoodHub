"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.ensureCollections = ensureCollections;

const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");

// ─── CONNECTION STATE ──────────────────────────────────────────────────
let isConnected = false;

// ─── CONNECT TO DATABASE ──────────────────────────────────────────────
async function connectDatabase(mongoUri) {
    if (isConnected) {
        console.log('📊 Database already connected');
        return;
    }
    
    try {
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        isConnected = true;
        console.log("✅ Connected to MongoDB");
        
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
        });
        
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
            isConnected = false;
        });
        
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            isConnected = true;
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

// ─── DISCONNECT FROM DATABASE ──────────────────────────────────────────
async function disconnectDatabase() {
    if (!isConnected) {
        console.log('📊 Database already disconnected');
        return;
    }
    
    try {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
        console.error('❌ MongoDB disconnection failed:', error);
        throw error;
    }
}

// ─── CLEANUP OLD INDEXES ──────────────────────────────────────────────
async function cleanupOldIndexes() {
    try {
        const db = mongoose_1.default.connection.db;
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const indexes = await coll.indexes();
            
            for (const index of indexes) {
                // Drop old text indexes with old field names
                if (index.name === "name_text_description_text") {
                    console.log(`🗑️ Dropping old index: ${index.name} from ${collection.name}`);
                    await coll.dropIndex(index.name);
                }
                // Drop old vendorAuthId index if exists
                if (index.name === "vendors.vendorAuthId_1") {
                    console.log(`🗑️ Dropping old index: ${index.name} from ${collection.name}`);
                    await coll.dropIndex(index.name);
                }
                // Drop old studentId index from budget if exists
                if (index.name === "studentId_1" && collection.name === "budgets") {
                    console.log(`🗑️ Dropping old index: ${index.name} from ${collection.name}`);
                    await coll.dropIndex(index.name);
                }
                // Drop old tuptId index if exists
                if (index.name === "tuptId_1" && collection.name === "students") {
                    console.log(`🗑️ Dropping old index: ${index.name} from ${collection.name}`);
                    await coll.dropIndex(index.name);
                }
            }
        }
        console.log("✅ Cleaned up old indexes");
    } catch (error) {
        // Ignore errors if indexes don't exist
        if (error.code !== 27) {
            console.warn("⚠️ Index cleanup warning:", error.message);
        }
    }
}

// ─── ENSURE COLLECTIONS ──────────────────────────────────────────────────
async function ensureCollections() {
    try {
        const db = mongoose_1.default.connection.db;
        
        // Clean up old indexes first
        await cleanupOldIndexes();
        
        // List of collections to ensure exist
        const collections = [
            'students',
            'stalls', 
            'admins',
            'orders',
            'payments',
            'reports',
            'budgets',
            'favorites'
        ];
        
        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map(c => c.name);
        
        for (const collection of collections) {
            if (!existingNames.includes(collection)) {
                await db.createCollection(collection);
                console.log(`✅ Created collection: ${collection}`);
            }
        }
        
        // Create indexes for each collection
        await ensureIndexes();
        
        console.log("✅ Collections and indexes verified");
        
    } catch (error) {
        console.error('❌ Failed to ensure collections:', error);
        throw error;
    }
}

// ─── ENSURE INDEXES ──────────────────────────────────────────────────
async function ensureIndexes() {
    try {
        // Student indexes
        if (models_1.StudentModel) {
            try {
                await models_1.StudentModel.collection.createIndexes([
                    { key: { email: 1 }, unique: true },
                    { key: { tuptId: 1 }, unique: true, sparse: true },
                    { key: { course: 1 } },
                    { key: { status: 1 } },
                    { key: { 'favorites.productId': 1 } }
                ]);
                console.log("✅ Student indexes created");
            } catch (err) {
                if (err.code !== 85) throw err; // 85 = IndexOptionsConflict
                console.log("ℹ️ Student indexes already exist");
            }
        }
        
        // Stall indexes
        if (models_1.StallModel) {
            try {
                // Drop old text index if it exists with wrong name
                try {
                    await models_1.StallModel.collection.dropIndex("name_text_description_text");
                } catch (err) {
                    // Index might not exist
                }
                
                await models_1.StallModel.collection.createIndexes([
                    { key: { stallName: 1 }, unique: true },
                    { key: { section: 1 }, unique: true },
                    { key: { status: 1 } },
                    { key: { 'vendors.email': 1 } },
                    { key: { 'products.category': 1 } },
                    { key: { stallName: 'text', stallDescription: 'text' } }
                ]);
                console.log("✅ Stall indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Stall indexes already exist");
            }
        }
        
        // Admin indexes
        if (models_1.AdminModel) {
            try {
                await models_1.AdminModel.collection.createIndexes([
                    { key: { email: 1 }, unique: true },
                    { key: { status: 1 } }
                ]);
                console.log("✅ Admin indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Admin indexes already exist");
            }
        }
        
        // Order indexes
        if (models_1.OrderModel) {
            try {
                await models_1.OrderModel.collection.createIndexes([
                    { key: { studentId: 1, createdAt: -1 } },
                    { key: { stallId: 1, createdAt: -1 } },
                    { key: { orderStatus: 1 } },
                    { key: { course: 1 } },
                    { key: { 'orderLines.productId': 1 } }
                ]);
                console.log("✅ Order indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Order indexes already exist");
            }
        }
        
        // Payment indexes
        if (models_1.PaymentModel) {
            try {
                await models_1.PaymentModel.collection.createIndexes([
                    { key: { orderId: 1 }, unique: true },
                    { key: { paymentReference: 1 }, unique: true },
                    { key: { paymongoPaymentId: 1 }, unique: true, sparse: true }
                ]);
                console.log("✅ Payment indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Payment indexes already exist");
            }
        }
        
        // Report indexes
        if (models_1.ReportModel) {
            try {
                await models_1.ReportModel.collection.createIndexes([
                    { key: { reporterId: 1 } },
                    { key: { reportedUserId: 1 } },
                    { key: { status: 1 } },
                    { key: { createdAt: -1 } }
                ]);
                console.log("✅ Report indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Report indexes already exist");
            }
        }
        
        // Budget indexes
        if (models_1.BudgetModel) {
            try {
                await models_1.BudgetModel.collection.createIndexes([
                    { key: { studentId: 1 } },
                    { key: { studentTuptId: 1 } },
                    { key: { status: 1 } }
                ]);
                console.log("✅ Budget indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Budget indexes already exist");
            }
        }
        
        // Favorite indexes
        if (models_1.FavoriteModel) {
            try {
                await models_1.FavoriteModel.collection.createIndexes([
                    { key: { studentId: 1, productId: 1 }, unique: true },
                    { key: { studentId: 1 } },
                    { key: { course: 1 } }
                ]);
                console.log("✅ Favorite indexes created");
            } catch (err) {
                if (err.code !== 85) throw err;
                console.log("ℹ️ Favorite indexes already exist");
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to ensure indexes:', error);
        throw error;
    }
}

// ─── EXPORT ──────────────────────────────────────────────────────────
module.exports = {
    connectDatabase,
    disconnectDatabase,
    ensureCollections
};