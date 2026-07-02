"use strict";

/**
 * Seeds 4 stalls, each with:
 *   - 20 products (5 per category: Rice Meal, Beverage, Snacks, Add-ons), no reviews
 *   - 3 vendors (positions: Cook, Manager, Financier), status "verified"
 *
 * Run with: node backend/seeders/stalls.seeder.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { StallModel } = require("../models/stall.model");
const { StudentModel } = require("../models/student.model");
const { AdminModel } = require("../models/admin.model");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://Jemuel:Student12345@ac-yxbmddu-shard-00-00.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-01.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-02.f3bxoif.mongodb.net:27017/FoodHub?ssl=true&replicaSet=atlas-xbkzgf-shard-0&authSource=admin&appName=Cluster0";
const SEED_PASSWORD = "Vendor@123";

const VENDOR_POSITIONS = ["Cook", "Manager", "Financier"];

// ── Stall Images ──────────────────────────────────────────────────────────
const STALL_IMAGES = [
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png",
];

// ── Product Images by Category ───────────────────────────────────────────
const PRODUCT_IMAGES = {
  "Rice Meal": "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987605/ricemeal_t5twff.png",
  "Beverage": "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987605/lemonade_zdn5jz.png",
  "Snacks": "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987606/snacks_pwfvdh.png",
  "Add-ons": "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987605/lemonade1_rm5lze.png",
};

// ── Product templates (reused per stall, 5 per category) ──────────────────
const PRODUCT_TEMPLATES = {
  "Rice Meal": [
    { productName: "Chicken Adobo Rice Meal", productDescription: "Classic soy-vinegar braised chicken over steamed rice.", price: 85, nutrition: { calories: 620, protein: 32, carbs: 68, allergen: "Soy" } },
    { productName: "Pork Sisig Rice Meal", productDescription: "Sizzling chopped pork with onions and calamansi.", price: 95, nutrition: { calories: 700, protein: 30, carbs: 60, allergen: "Egg" } },
    { productName: "Beef Tapa Rice Meal", productDescription: "Cured beef strips pan-fried and served with garlic rice.", price: 100, nutrition: { calories: 650, protein: 35, carbs: 65, allergen: "None" } },
    { productName: "Fried Bangus Rice Meal", productDescription: "Crispy fried milkfish with atchara and rice.", price: 90, nutrition: { calories: 580, protein: 28, carbs: 62, allergen: "Fish" } },
    { productName: "Vegetable Pinakbet Rice Meal", productDescription: "Mixed native vegetables in shrimp paste sauce.", price: 75, nutrition: { calories: 420, protein: 12, carbs: 58, allergen: "Shellfish" } },
  ],
  "Beverage": [
    { productName: "Iced Coffee", productDescription: "Cold brew coffee over ice with milk.", price: 45, nutrition: { calories: 150, protein: 2, carbs: 22, allergen: "Milk" } },
    { productName: "Fresh Buko Juice", productDescription: "Young coconut water with strips of coconut meat.", price: 40, nutrition: { calories: 90, protein: 1, carbs: 20, allergen: "None" } },
    { productName: "Blue Lemonade", productDescription: "Butterfly pea lemonade, sweet and tangy.", price: 35, nutrition: { calories: 120, protein: 0, carbs: 30, allergen: "None" } },
    { productName: "Taro Milk Tea", productDescription: "Creamy taro-flavored milk tea with pearls.", price: 55, nutrition: { calories: 280, protein: 4, carbs: 52, allergen: "Milk" } },
    { productName: "Bottled Water", productDescription: "500mL purified drinking water.", price: 20, nutrition: { calories: 0, protein: 0, carbs: 0, allergen: "None" } },
  ],
  "Snacks": [
    { productName: "Cheese Sticks", productDescription: "Crispy lumpia wrapper filled with melted cheese.", price: 30, nutrition: { calories: 260, protein: 6, carbs: 24, allergen: "Milk" } },
    { productName: "Fish Balls (10 pcs)", productDescription: "Deep-fried fish balls with sweet-spicy sauce.", price: 25, nutrition: { calories: 220, protein: 10, carbs: 18, allergen: "Fish" } },
    { productName: "Turon", productDescription: "Caramelized banana spring rolls with jackfruit.", price: 20, nutrition: { calories: 190, protein: 2, carbs: 34, allergen: "None" } },
    { productName: "Siomai (4 pcs)", productDescription: "Steamed pork and shrimp dumplings.", price: 35, nutrition: { calories: 240, protein: 12, carbs: 20, allergen: "Shellfish" } },
    { productName: "French Fries", productDescription: "Crispy salted potato fries.", price: 40, nutrition: { calories: 320, protein: 4, carbs: 42, allergen: "None" } },
  ],
  "Add-ons": [
    { productName: "Extra Rice", productDescription: "One extra cup of steamed rice.", price: 15, nutrition: { calories: 200, protein: 4, carbs: 44, allergen: "None" } },
    { productName: "Fried Egg", productDescription: "Sunny-side-up egg.", price: 15, nutrition: { calories: 90, protein: 6, carbs: 1, allergen: "Egg" } },
    { productName: "Gravy", productDescription: "Side of savory brown gravy.", price: 10, nutrition: { calories: 60, protein: 1, carbs: 6, allergen: "None" } },
    { productName: "Extra Sauce", productDescription: "Side of house special dipping sauce.", price: 10, nutrition: { calories: 40, protein: 0, carbs: 5, allergen: "Soy" } },
    { productName: "Atchara", productDescription: "Pickled green papaya relish.", price: 10, nutrition: { calories: 30, protein: 0, carbs: 7, allergen: "None" } },
  ],
};

const STALL_TEMPLATES = [
  {
    stallName: "Kusina ni Aling Nena",
    stallDescription: "Home-style Filipino rice meals cooked fresh daily.",
    section: 1,
    openHours: { openTime: "07:00", closingTime: "18:00" },
    paymentMethod: {
      cash: { available: true },
      gcash: { available: true, accountName: "Nena Reyes", phoneNumber: "09171234501" },
      paymaya: { available: false, accountName: "", phoneNumber: "" },
    },
  },
  {
    stallName: "Street Bites PH",
    stallDescription: "Your go-to for Filipino street food favorites.",
    section: 2,
    openHours: { openTime: "08:00", closingTime: "19:00" },
    paymentMethod: {
      cash: { available: true },
      gcash: { available: true, accountName: "Street Bites PH", phoneNumber: "09171234502" },
      paymaya: { available: true, accountName: "Street Bites PH", phoneNumber: "09171234503" },
    },
  },
  {
    stallName: "Sip & Chill Beverages",
    stallDescription: "Refreshing drinks, teas, and coolers for hot campus days.",
    section: 3,
    openHours: { openTime: "07:30", closingTime: "20:00" },
    paymentMethod: {
      cash: { available: true },
      gcash: { available: false, accountName: "", phoneNumber: "" },
      paymaya: { available: true, accountName: "Sip and Chill", phoneNumber: "09171234504" },
    },
  },
  {
    stallName: "Fusion Corner",
    stallDescription: "A mix of everything — rice meals, snacks, and drinks in one stall.",
    section: 4,
    openHours: { openTime: "08:00", closingTime: "17:30" },
    paymentMethod: {
      cash: { available: true },
      gcash: { available: true, accountName: "Fusion Corner", phoneNumber: "09171234505" },
      paymaya: { available: false, accountName: "", phoneNumber: "" },
    },
  },
];

function buildProducts() {
  const products = [];
  for (const [category, items] of Object.entries(PRODUCT_TEMPLATES)) {
    const imageUrl = PRODUCT_IMAGES[category] || PRODUCT_IMAGES["Snacks"];
    for (const item of items) {
      products.push({
        productName: item.productName,
        productDescription: item.productDescription,
        productImages: [imageUrl],
        category,
        price: item.price,
        stocks: 50,
        available: true,
        favorite: 0,
        nutrition: item.nutrition,
        reviews: [],
      });
    }
  }
  return products;
}

async function ensureIndexes() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "stalls" }).toArray();
    
    if (collections.length > 0) {
      try {
        await db.collection("stalls").dropIndex("name_1");
        console.log("✅ Dropped old name_1 index");
      } catch (err) {
        if (err.code !== 27) {
          console.log("ℹ️ No old index to drop");
        }
      }
      
      try {
        await db.collection("stalls").dropIndex("section_1");
        console.log("✅ Dropped section_1 index (will be recreated)");
      } catch (err) {
        if (err.code !== 27) {
          console.log("ℹ️ No old index to drop");
        }
      }
    }
    
    await StallModel.collection.createIndexes([
      { key: { stallName: 1 }, unique: true },
      { key: { section: 1 }, unique: true },
      { key: { status: 1 } },
      { key: { 'vendors.email': 1 } },
      { key: { 'products.category': 1 } },
      { key: { stallName: 'text', stallDescription: 'text' } }
    ]);
    console.log("✅ Created correct indexes for stalls");
    
  } catch (error) {
    console.log("ℹ️ Index management:", error.message);
  }
}

async function seed() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI (or MONGO_URI) is not set in your environment.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  await ensureIndexes();

  console.log("🧹 Clearing existing data...");
  
  await StallModel.deleteMany({});
  console.log("✅ Cleared stalls");
  
  await StudentModel.deleteMany({ role: "vendor" });
  console.log("✅ Cleared vendor students");
  
  await StudentModel.deleteMany({ email: { $regex: /@foodhub\.test$/ } });
  console.log("✅ Cleared test vendor emails");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const credentialsLog = [];

  for (let i = 0; i < STALL_TEMPLATES.length; i++) {
    const template = STALL_TEMPLATES[i];
    const stallImage = STALL_IMAGES[i] || null;

    const stallData = {
      stallName: template.stallName,
      stallDescription: template.stallDescription,
      stallPicture: stallImage,
      section: template.section,
      openHours: template.openHours,
      status: true,
      proofOfContract: `contract_${template.section}_${Date.now()}.pdf`,
      paymentMethod: template.paymentMethod,
      products: buildProducts(),
      vendors: [],
    };

    const stall = new StallModel(stallData);

    for (let v = 0; v < 3; v++) {
      const email = `vendor${i + 1}${v + 1}@foodhub.test`;
      const firstName = `Vendor${i + 1}${v + 1}`;
      const lastName = template.stallName.split(" ")[0];

      const vendorStudent = await StudentModel.create({
        firstName,
        lastName,
        email,
        passwordHash,
        role: "vendor",
        birthdate: new Date("1995-01-01"),
        tuptId: `VEND${String(i + 1).padStart(2, '0')}${String(v + 1).padStart(2, '0')}`,
        course: "BSIT",
        section: "1A",
        contactNumber: `0917000${i}${v}${v}${i}0`.slice(0, 11).padEnd(11, "0"),
        status: "verified",
        favorites: [],
        budgetCap: []
      });

      stall.vendors.push({
        firstName,
        lastName,
        email,
        phoneNumber: `0917000${i}${v}${v}${i}0`.slice(0, 11).padEnd(11, "0"),
        vendorImage: null,
        role: "vendor",
        position: VENDOR_POSITIONS[v],
        status: "verified",
      });

      credentialsLog.push({
        stall: template.stallName,
        email,
        password: SEED_PASSWORD,
        position: VENDOR_POSITIONS[v],
      });
    }

    await stall.save();
    console.log(`✅ Seeded stall: ${template.stallName} (${stall.products.length} products, ${stall.vendors.length} vendors)`);
  }

  const adminEmail = "admin@foodhub.com";
  const existingAdmin = await AdminModel.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    await AdminModel.create({
      firstName: "Admin",
      lastName: "FoodHub",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "admin",
      status: "verified",
      contactNumber: "09123456780"
    });
    console.log("✅ Admin account created: admin@foodhub.com / admin123");
  } else {
    console.log("✅ Admin account already exists");
  }

  console.log("\n📋 Seeded vendor credentials (all use the same password):\n");
  console.table(credentialsLog);
  console.log(`\nPassword for all seeded vendors: ${SEED_PASSWORD}\n`);
  console.log("📋 Admin credentials:");
  console.log(`   Email: admin@foodhub.com`);
  console.log(`   Password: admin123\n`);

  await mongoose.disconnect();
  console.log("✅ Done. Disconnected from MongoDB.");
}

if (require.main === module) {
  seed().catch((error) => {
    console.error("❌ Seeder failed:", error);
    process.exit(1);
  });
}

module.exports = { seed };