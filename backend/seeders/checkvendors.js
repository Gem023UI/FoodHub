"use strict";

require("dotenv/config");
const mongoose = require("mongoose");
const { VendorModel } = require("../models");

async function checkVendors() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://Jemuel:Student12345@cluster0.f3bxoif.mongodb.net/FoodHub?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        const vendors = await VendorModel.find({}).populate("stallId", "name location");
        
        console.log("\n📋 Vendor List:");
        console.log("================================");
        
        vendors.forEach(v => {
            console.log(`\n👤 ${v.firstName} ${v.lastName}`);
            console.log(`   Email: ${v.email}`);
            console.log(`   Status: ${v.status}`);
            console.log(`   Stall: ${v.stallId ? v.stallId.name : "❌ NO STALL ASSIGNED!"}`);
            console.log(`   Location: ${v.stallId ? v.stallId.location : "N/A"}`);
        });

        const vendorsWithoutStall = vendors.filter(v => !v.stallId);
        if (vendorsWithoutStall.length > 0) {
            console.log(`\n⚠️ ${vendorsWithoutStall.length} vendors have NO stall assigned!`);
        } else {
            console.log("\n✅ All vendors have stalls assigned!");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkVendors();