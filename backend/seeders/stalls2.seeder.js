"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv/config");

// ── Import Models ──────────────────────────────────────────────────────
const { StallModel } = require("../models/stall.model");

// ── Configuration ──────────────────────────────────────────────────────
const STALL_IMAGE = "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png";
const VENDOR_IMAGE = "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987605/pizza_kcgyga.png";
const PRODUCT_IMAGE = "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987603/crispybite_e0mldh.png";

// ── Constants ──────────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];
const VENDOR_POSITIONS = ["Cook", "Manager", "Financier"];
const VENDOR_STATUSES = ["verified", "unverified", "deactivated"];

// ── Food Items per Category ────────────────────────────────────────────
const FOOD_ITEMS = {
  "Rice Meal": [
    { name: "Chicken Inasal", price: 85, description: "Grilled chicken marinated in annatto and calamansi" },
    { name: "Pork Adobo", price: 75, description: "Classic Filipino pork adobo with soy sauce and vinegar" },
    { name: "Beef Tapa", price: 90, description: "Cured beef strips served with garlic rice and egg" },
    { name: "Tocino", price: 80, description: "Sweet cured pork belly with garlic rice" },
    { name: "Longganisa", price: 70, description: "Filipino sausage with garlic rice and egg" },
    { name: "Sisig", price: 95, description: "Sizzling pork sisig with onions and chili" },
    { name: "Bangus", price: 85, description: "Grilled milkfish with tomato and onion salsa" },
    { name: "Lechon Kawali", price: 100, description: "Crispy fried pork belly with liver sauce" },
    { name: "Chicken Curry", price: 80, description: "Creamy chicken curry with vegetables" },
    { name: "Pork Sinigang", price: 90, description: "Sour pork soup with vegetables" }
  ],
  "Beverage": [
    { name: "Buko Juice", price: 40, description: "Fresh coconut juice" },
    { name: "Lemonade", price: 35, description: "Freshly squeezed lemonade" },
    { name: "Iced Tea", price: 30, description: "Refreshing iced tea" },
    { name: "Mango Shake", price: 55, description: "Creamy mango shake" },
    { name: "Calamansi Juice", price: 35, description: "Fresh calamansi juice" },
    { name: "Milktea", price: 50, description: "Classic milk tea with pearls" },
    { name: "Coffee", price: 40, description: "Brewed coffee" },
    { name: "Chocolate Drink", price: 45, description: "Rich chocolate drink" }
  ],
  "Snacks": [
    { name: "French Fries", price: 45, description: "Crispy golden french fries" },
    { name: "Burger", price: 65, description: "Classic beef burger with cheese" },
    { name: "Pizza Slice", price: 50, description: "Cheese pizza slice" },
    { name: "Chicken Nuggets", price: 55, description: "Crispy chicken nuggets" },
    { name: "Onion Rings", price: 40, description: "Crispy onion rings" },
    { name: "Sandwich", price: 60, description: "Classic club sandwich" },
    { name: "Donut", price: 35, description: "Glazed donut" },
    { name: "Crispy Bites", price: 50, description: "Crispy breaded bites" }
  ],
  "Add-ons": [
    { name: "Extra Rice", price: 15, description: "Steamed white rice" },
    { name: "Garlic Rice", price: 20, description: "Garlic fried rice" },
    { name: "Fried Egg", price: 15, description: "Sunny side up egg" },
    { name: "Extra Sauce", price: 10, description: "Additional sauce" },
    { name: "Side Salad", price: 25, description: "Fresh garden salad" }
  ]
};

// ── Stall Data ──────────────────────────────────────────────────────────
const STALLS = [
  {
    section: 5,
    name: "Tapsihan ni Juan",
    description: "Authentic Filipino breakfast favorites and rice meals",
    vendors: [
      { firstName: "Juan", lastName: "Santos", email: "juan.santos@vendor.com", position: "Cook", status: "verified" },
      { firstName: "Maria", lastName: "Reyes", email: "maria.reyes@vendor.com", position: "Manager", status: "verified" },
      { firstName: "Jose", lastName: "Cruz", email: "jose.cruz@vendor.com", position: "Financier", status: "verified" }
    ]
  },
  {
    section: 6,
    name: "Adobo Express",
    description: "Specializing in adobo and traditional Filipino dishes",
    vendors: [
      { firstName: "Ana", lastName: "Garcia", email: "ana.garcia@vendor.com", position: "Cook", status: "verified" },
      { firstName: "Carlos", lastName: "Martinez", email: "carlos.martinez@vendor.com", position: "Manager", status: "verified" },
      { firstName: "Rosa", lastName: "Gonzales", email: "rosa.gonzales@vendor.com", position: "Financier", status: "verified" }
    ]
  },
  {
    section: 7,
    name: "Lechon House",
    description: "Home of crispy lechon and pork specialties",
    vendors: [
      { firstName: "Antonio", lastName: "Lopez", email: "antonio.lopez@vendor.com", position: "Cook", status: "verified" },
      { firstName: "Pedro", lastName: "Perez", email: "pedro.perez@vendor.com", position: "Manager", status: "verified" },
      { firstName: "Luisa", lastName: "Mendoza", email: "luisa.mendoza@vendor.com", position: "Financier", status: "verified" }
    ]
  },
  {
    section: 8,
    name: "Sinigang Station",
    description: "Sour soup specialties and comfort food",
    vendors: [
      { firstName: "Manuel", lastName: "Flores", email: "manuel.flores@vendor.com", position: "Cook", status: "verified" },
      { firstName: "Elena", lastName: "Rivera", email: "elena.rivera@vendor.com", position: "Manager", status: "verified" },
      { firstName: "Ramon", lastName: "Morales", email: "ramon.morales@vendor.com", position: "Financier", status: "verified" }
    ]
  },
  {
    section: 9,
    name: "Grill Master",
    description: "Grilled specialties and seafood dishes",
    vendors: [
      { firstName: "Teresa", lastName: "Castro", email: "teresa.castro@vendor.com", position: "Cook", status: "verified" },
      { firstName: "Luis", lastName: "Valdez", email: "luis.valdez@vendor.com", position: "Manager", status: "verified" },
      { firstName: "Rita", lastName: "Ramos", email: "rita.ramos@vendor.com", position: "Financier", status: "verified" }
    ]
  },
  {
    section: 10,
    name: "Rice & Roll",
    description: "Rice meals and quick bites",
    vendors: [
      { firstName: "Alberto", lastName: "Aquino", email: "alberto.aquino@vendor.com", position: "Cook", status: "verified" },
      { firstName: "Sofia", lastName: "Bautista", email: "sofia.bautista@vendor.com", position: "Manager", status: "verified" },
      { firstName: "Andres", lastName: "Gutierrez", email: "andres.gutierrez@vendor.com", position: "Financier", status: "verified" }
    ]
  }
];

// ── Helper Functions ──────────────────────────────────────────────────
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProducts() {
  const products = [];
  
  for (const category of PRODUCT_CATEGORIES) {
    const items = FOOD_ITEMS[category] || [];
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    for (const item of selected) {
      products.push({
        productName: item.name,
        productDescription: item.description,
        productImages: [PRODUCT_IMAGE],
        price: item.price,
        category: category,
        stocks: getRandomNumber(10, 50),
        available: true,
        favorite: getRandomNumber(0, 20),
        nutrition: {
          calories: getRandomNumber(200, 800),
          protein: getRandomNumber(10, 40),
          carbs: getRandomNumber(20, 80),
          allergen: getRandomItem(["None", "Soy", "Gluten", "Dairy", "Eggs", "Seafood", "Nuts"])
        }
      });
    }
  }
  
  return products;
}

// ── Database Connection ────────────────────────────────────────────────
async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://Jemuel:Student12345@ac-yxbmddu-shard-00-00.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-01.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-02.f3bxoif.mongodb.net:27017/FoodHub?ssl=true&replicaSet=atlas-xbkzgf-shard-0&authSource=admin&appName=Cluster0";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");
}

// ── Seed Stalls ──────────────────────────────────────────────────────────
async function seedStalls() {
  try {
    await connectDatabase();

    console.log("📝 Creating stalls from Section 5 to 10...");
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const stallData of STALLS) {
      // Check if stall already exists in this section
      const existingStall = await StallModel.findOne({ section: stallData.section });
      
      if (existingStall) {
        console.log(`⏭️ Section ${stallData.section} already has a stall. Skipping...`);
        skippedCount++;
        continue;
      }

      console.log(`🏪 Creating stall in Section ${stallData.section}: "${stallData.name}"`);
      
      // Generate products (3 per category)
      const products = generateProducts();
      
      // Build vendor data with proper fields
      const vendors = stallData.vendors.map(v => ({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phoneNumber: `09${String(getRandomNumber(100000000, 999999999))}`,
        vendorImage: VENDOR_IMAGE,
        role: "vendor",
        position: v.position,
        status: v.status
      }));

      const stall = new StallModel({
        stallName: `${stallData.name} (Sec ${stallData.section})`,
        stallDescription: stallData.description,
        stallPicture: STALL_IMAGE,
        section: stallData.section,
        openHours: {
          openTime: "08:00",
          closingTime: "20:00"
        },
        status: true,
        proofOfContract: STALL_IMAGE,
        paymentMethod: {
          cash: { available: true },
          gcash: {
            available: true,
            accountName: `FoodHub Section ${stallData.section}`,
            phoneNumber: `09${String(getRandomNumber(100000000, 999999999))}`
          },
          paymaya: {
            available: Math.random() > 0.5,
            accountName: `FoodHub Maya ${stallData.section}`,
            phoneNumber: `09${String(getRandomNumber(100000000, 999999999))}`
          }
        },
        products: products,
        vendors: vendors
      });
      
      await stall.save();
      createdCount++;
      
      console.log(`✅ Created stall in Section ${stallData.section} with:`);
      console.log(`   - ${vendors.length} vendors`);
      console.log(`   - ${products.length} products`);
    }

    // ── Summary ──────────────────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Seed Summary:");
    console.log(`   ✅ Created: ${createdCount} stalls`);
    console.log(`   ⏭️ Skipped: ${skippedCount} stalls (already exist)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Display created stall details
    if (createdCount > 0) {
      const createdStalls = await StallModel.find({
        section: { $in: [5, 6, 7, 8, 9, 10] }
      }).select("stallName section products vendors").lean();
      
      console.log("\n📋 Created Stall Details:");
      for (const stall of createdStalls) {
        console.log(`   🏪 ${stall.stallName}`);
        console.log(`      Section: ${stall.section}`);
        console.log(`      Products: ${stall.products?.length || 0}`);
        console.log(`      Vendors: ${stall.vendors?.length || 0}`);
        
        const statusCount = {};
        for (const vendor of stall.vendors || []) {
          statusCount[vendor.status] = (statusCount[vendor.status] || 0) + 1;
        }
        const statusStr = Object.entries(statusCount)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ");
        console.log(`      Vendor Statuses: ${statusStr || "None"}`);
      }
    }

    // ── Images Used ──────────────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🖼️ Images Used:");
    console.log(`   Stall: ${STALL_IMAGE}`);
    console.log(`   Vendor: ${VENDOR_IMAGE}`);
    console.log(`   Product: ${PRODUCT_IMAGE}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️ Remember to run vendor.seeder.js to create vendor accounts!");

  } catch (error) {
    if (error.code === 11000) {
      console.warn("⚠️ Some stalls already exist. Skipping duplicates...");
      console.log("✅ Seed completed with existing records preserved.");
    } else {
      console.error("❌ Error seeding stalls:", error);
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// ── Run Seeder ─────────────────────────────────────────────────────────
seedStalls();