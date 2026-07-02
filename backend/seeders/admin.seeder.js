"use strict";

// Load environment variables explicitly
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { AdminModel } = require("../models");

const adminData = {
    firstName: "Admin",
    lastName: "FoodHub",
    email: "admin@foodhub.com",
    contactNumber: "09123456780",
    status: "verified",
    role: "admin"
};

async function seedAdmin() {
    try {
        // Get MongoDB URI from environment or use fallback
        const mongoUri = process.env.MONGO_URI || "mongodb://Jemuel:Student12345@ac-yxbmddu-shard-00-00.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-01.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-02.f3bxoif.mongodb.net:27017/FoodHub?ssl=true&replicaSet=atlas-xbkzgf-shard-0&authSource=admin&appName=Cluster0";
        
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await AdminModel.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log(`✅ Admin already exists: ${adminData.email}`);
            console.log(`   🔑 Password: admin123`);
            await mongoose.disconnect();
            process.exit(0);
        }

        // Hash password
        const passwordHash = await bcrypt.hash("admin123", 10);

        // Create admin
        const admin = await AdminModel.create({
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            email: adminData.email,
            passwordHash: passwordHash,
            role: adminData.role,
            status: adminData.status,
            contactNumber: adminData.contactNumber
        });

        console.log(`✅ Admin created successfully!`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🔑 Password: admin123`);
        console.log(`   👤 Name: ${admin.firstName} ${admin.lastName}`);

        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seedAdmin();