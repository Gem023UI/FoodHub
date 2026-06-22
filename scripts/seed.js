const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const mongoose = require("mongoose");

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not found in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection;
  console.log("Connected to", mongoUri.split("?")[0]);

  try {
    async function ensureOne(collectionName, query, doc) {
      const col = db.collection(collectionName);
      const existing = await col.findOne(query);
      if (existing) return existing;
      const res = await col.insertOne(doc);
      return await col.findOne({ _id: res.insertedId });
    }

    const student = await ensureOne("users", { email: "student@example.com" }, {
      name: "Student Seed",
      email: "student@example.com",
      passwordHash: bcrypt.hashSync("Student123!", 10),
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const vendor = await ensureOne("users", { email: "vendor@example.com" }, {
      name: "Vendor Seed",
      email: "vendor@example.com",
      passwordHash: bcrypt.hashSync("Vendor123!", 10),
      role: "vendor",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const admin = await ensureOne("users", { email: "admin@example.com" }, {
      name: "Admin Seed",
      email: "admin@example.com",
      passwordHash: bcrypt.hashSync("Admin123!", 10),
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const stall = await ensureOne("stalls", { vendorId: vendor._id, name: "Seeded Stall" }, {
      vendorId: vendor._id,
      name: "Seeded Stall",
      description: "A seeded stall for testing",
      location: "Canteen A",
      section: "Ground",
      category: "general",
      photoUrl: null,
      openingHours: "08:00-17:00",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const menuItem = await ensureOne("menuitems", { stallId: stall._id, name: "Seeded Noodle" }, {
      stallId: stall._id,
      name: "Seeded Noodle",
      description: "Tasty seeded noodles",
      ingredients: ["noodles", "sauce"],
      allergens: ["gluten"],
      nutrition: { calories: 420 },
      price: 99,
      photoUrl: null,
      category: "noodles",
      isAvailable: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const review = await ensureOne("reviews", { userId: student._id, stallId: stall._id }, {
      userId: student._id,
      stallId: stall._id,
      rating: 5,
      comment: "Great seeded food!",
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const favorite = await ensureOne("favorites", { userId: student._id, targetId: stall._id }, {
      userId: student._id,
      targetType: "stall",
      targetId: stall._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const budget = await ensureOne("budgets", { userId: student._id }, {
      userId: student._id,
      period: "monthly",
      limitAmount: 2000,
      currency: "PHP",
      alertThresholdPercent: 80,
      spentAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Seeded collections and example documents:");
    console.log(" user:", { _id: student._id, email: student.email });
    console.log(" vendor:", { _id: vendor._id, email: vendor.email });
    console.log(" stall:", { _id: stall._id, name: stall.name });
    console.log(" menuItem:", { _id: menuItem._id, name: menuItem.name });
    console.log(" review:", { _id: review._id, rating: review.rating });
    console.log(" favorite:", { _id: favorite._id });
    console.log(" budget:", { _id: budget._id, limit: budget.limitAmount });
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
