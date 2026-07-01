"use strict";

require("dotenv/config");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { VendorModel, StallModel } = require("../models");

const vendorData = [
    {
        firstName: "Maria",
        lastName: "Santos",
        email: "maria.santos@manginasal.com",
        contactNumber: "09123456781",
        status: "verified",
        isActive: true,
        proofOfLegitimacyUrl: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/vendor1.jpg",
        stallName: "Mang Inasal"
    },
    {
        firstName: "Juan",
        lastName: "Reyes",
        email: "juan.reyes@jollibee.com",
        contactNumber: "09123456782",
        status: "verified",
        isActive: true,
        proofOfLegitimacyUrl: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/vendor2.jpg",
        stallName: "Jollibee"
    },
    {
        firstName: "Ana",
        lastName: "Dizon",
        email: "ana.dizon@chowking.com",
        contactNumber: "09123456783",
        status: "verified",
        isActive: true,
        proofOfLegitimacyUrl: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/vendor3.jpg",
        stallName: "Chowking"
    },
    {
        firstName: "Carlos",
        lastName: "Garcia",
        email: "carlos.garcia@greenwich.com",
        contactNumber: "09123456784",
        status: "verified",
        isActive: true,
        proofOfLegitimacyUrl: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/vendor4.jpg",
        stallName: "Greenwich Pizza"
    }
];

async function seedVendors() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://Jemuel:Student12345@cluster0.f3bxoif.mongodb.net/FoodHub?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get all stalls
        const stalls = await StallModel.find({});
        console.log(`Found ${stalls.length} stalls`);

        if (stalls.length === 0) {
            console.log("❌ No stalls found. Please run stalls.seeder.js first.");
            process.exit(1);
        }

        // Create a map of stall names to stall objects
        const stallMap = {};
        stalls.forEach(stall => {
            stallMap[stall.name] = stall;
        });

        // Delete existing vendors first to avoid conflicts
        await VendorModel.deleteMany({});
        console.log("Cleared existing vendors");

        let vendorCount = 0;

        // Create one vendor per stall
        for (const data of vendorData) {
            const stall = stallMap[data.stallName];
            
            if (!stall) {
                console.log(`❌ Stall "${data.stallName}" not found. Skipping vendor ${data.firstName} ${data.lastName}`);
                continue;
            }

            // Hash password
            const passwordHash = await bcrypt.hash("password123", 10);

            // Create vendor with stall assignment
            const vendor = await VendorModel.create({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                passwordHash: passwordHash,
                role: "vendor",
                status: data.status,
                isActive: data.isActive,
                contactNumber: data.contactNumber,
                proofOfLegitimacyUrl: data.proofOfLegitimacyUrl,
                profilePictureUrl: null,
                stallId: stall._id  // Required field
            });

            // Update stall with vendorId
            await StallModel.findByIdAndUpdate(stall._id, {
                $addToSet: { vendorIds: vendor._id }
            });

            vendorCount++;
            console.log(`✅ Created vendor: ${data.firstName} ${data.lastName} for ${stall.name}`);
            
            // Verify vendor was created with stall
            const verifyVendor = await VendorModel.findById(vendor._id).populate('stallId');
            console.log(`   Verified: ${verifyVendor.firstName} → ${verifyVendor.stallId ? verifyVendor.stallId.name : '⚠️ NO STALL!'}`);
        }

        console.log(`✅ Seeded ${vendorCount} vendors successfully!`);

        // Final verification - check all vendors have stalls
        const allVendors = await VendorModel.find({}).populate('stallId');
        console.log("\n📊 Final Vendor Verification:");
        allVendors.forEach(v => {
            console.log(`  ${v.firstName} ${v.lastName}: ${v.stallId ? v.stallId.name : '⚠️ NO STALL ASSIGNED!'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedVendors();