"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv/config");

// ── Import Models ──────────────────────────────────────────────────────
const { VendorModel } = require("../models/vendor.model");
const { StallModel } = require("../models/stall.model");

// ── Configuration ──────────────────────────────────────────────────────
const DEFAULT_PASSWORD = "Vendor@123";
const VENDOR_IMAGE = "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987605/pizza_kcgyga.png";

// ── Database Connection ────────────────────────────────────────────────
async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://Jemuel:Student12345@ac-yxbmddu-shard-00-00.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-01.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-02.f3bxoif.mongodb.net:27017/FoodHub?ssl=true&replicaSet=atlas-xbkzgf-shard-0&authSource=admin&appName=Cluster0";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");
}

// ── Seed Vendors ──────────────────────────────────────────────────────────
async function seedVendors() {
  try {
    await connectDatabase();

    console.log("📝 Fetching stalls and their vendors...");
    
    // Get all stalls with their vendors
    const stalls = await StallModel.find({}).select("_id stallName section vendors").lean();
    
    if (stalls.length === 0) {
      console.log("⚠️ No stalls found. Please run stalls.seeder.js first.");
      process.exit(0);
    }

    console.log(`📊 Found ${stalls.length} stalls`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    let createdCount = 0;
    let skippedCount = 0;
    let stallMap = {};

    // ── Process each stall ──────────────────────────────────────────────
    for (const stall of stalls) {
      if (!stall.vendors || stall.vendors.length === 0) {
        console.log(`⏭️ Stall "${stall.stallName}" has no vendors. Skipping...`);
        continue;
      }

      console.log(`\n🏪 Processing stall: ${stall.stallName} (Section ${stall.section})`);
      console.log(`   Vendors found: ${stall.vendors.length}`);

      for (const vendorData of stall.vendors) {
        // Check if vendor already exists in VendorModel
        const existingVendor = await VendorModel.findOne({ 
          email: vendorData.email 
        });

        if (existingVendor) {
          console.log(`   ⏭️ Vendor ${vendorData.email} already exists. Skipping...`);
          skippedCount++;
          continue;
        }

        // Create vendor account with stallId
        const vendor = await VendorModel.create({
          firstName: vendorData.firstName,
          lastName: vendorData.lastName,
          email: vendorData.email,
          passwordHash: hashedPassword,
          contactNumber: vendorData.phoneNumber || null,
          profilePictureUrl: vendorData.vendorImage || VENDOR_IMAGE,
          position: vendorData.position || "Cook",
          stallId: stall._id,
          stallName: stall.stallName,
          status: vendorData.status || "verified",
          isActive: true,
          lastLogin: null
        });

        console.log(`   ✅ Created vendor: ${vendorData.email} -> ${stall.stallName}`);
        createdCount++;
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Seed Summary:");
    console.log(`   ✅ Created: ${createdCount} vendor accounts`);
    console.log(`   ⏭️ Skipped: ${skippedCount} (already exist)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ── Display all vendor credentials ──────────────────────────────────
    console.log("\n🔑 Vendor Credentials:");
    console.log(`   Default Password: ${DEFAULT_PASSWORD}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const allVendors = await VendorModel.find({})
      .select("email stallName position status")
      .populate("stallId", "stallName section")
      .lean();

    console.log("\n📧 All Vendor Accounts:");
    for (const vendor of allVendors) {
      const stallInfo = vendor.stallId || { stallName: "No stall", section: "N/A" };
      console.log(`   ${vendor.email} -> ${stallInfo.stallName} (Section ${stallInfo.section})`);
      console.log(`      Position: ${vendor.position} | Status: ${vendor.status}`);
    }

    // ── Summary by stall ────────────────────────────────────────────────
    console.log("\n📊 Vendors by Stall:");
    const stallGroups = {};
    for (const vendor of allVendors) {
      const stallName = vendor.stallId?.stallName || "No stall";
      if (!stallGroups[stallName]) stallGroups[stallName] = [];
      stallGroups[stallName].push(vendor.email);
    }
    for (const [stallName, emails] of Object.entries(stallGroups)) {
      console.log(`   🏪 ${stallName}: ${emails.length} vendors`);
    }

  } catch (error) {
    if (error.code === 11000) {
      console.warn("⚠️ Some vendors already exist. Skipping duplicates...");
      console.log("✅ Seed completed with existing records preserved.");
    } else {
      console.error("❌ Error seeding vendors:", error);
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// ── Run Seeder ─────────────────────────────────────────────────────────
seedVendors();