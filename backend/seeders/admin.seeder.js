"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv/config");

// ── Import Models ──────────────────────────────────────────────────────
const { AdminModel } = require("../models/admin.model");

// ── Configuration ──────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@foodhub.com";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_PROFILE_PICTURE = "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987607/soda_ffr5rq.png";

// ── Database Connection ────────────────────────────────────────────────
async function connectDatabase() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://Jemuel:Student12345@ac-yxbmddu-shard-00-00.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-01.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-02.f3bxoif.mongodb.net:27017/FoodHub?ssl=true&replicaSet=atlas-xbkzgf-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
}

// ── Seed Admin ──────────────────────────────────────────────────────────
async function seedAdmin() {
    try {
        await connectDatabase();

        // ── 1. Clear existing admins ──────────────────────────────────────
        console.log("🗑️ Removing all existing admin records...");
        const deleteResult = await AdminModel.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} admin records`);

        // ── 2. Hash password ──────────────────────────────────────────────
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        // ── 3. Create new admin ───────────────────────────────────────────
        console.log("📝 Creating new admin...");
        const admin = await AdminModel.create({
            firstName: "FoodHub",
            lastName: "Admin",
            email: ADMIN_EMAIL,
            passwordHash: hashedPassword,
            contactNumber: "09123456789",
            profilePictureUrl: ADMIN_PROFILE_PICTURE,
            role: "admin",
            status: "verified",
        });

        console.log("✅ Admin created successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:    ", ADMIN_EMAIL);
        console.log("🔑 Password: ", ADMIN_PASSWORD);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🖼️ Profile Picture:", ADMIN_PROFILE_PICTURE);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // ── 4. Display admin details ──────────────────────────────────────
        console.log("\n📋 Admin Details:");
        console.log("   ID:        ", admin._id);
        console.log("   Name:      ", `${admin.firstName} ${admin.lastName}`);
        console.log("   Email:     ", admin.email);
        console.log("   Role:      ", admin.role);
        console.log("   Status:    ", admin.status);
        console.log("   Contact:   ", admin.contactNumber);
        console.log("   Picture:   ", admin.profilePictureUrl);

    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
        process.exit(0);
    }
}

// ── Run Seeder ─────────────────────────────────────────────────────────
seedAdmin();