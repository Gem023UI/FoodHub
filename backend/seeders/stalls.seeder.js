"use strict";

require("dotenv/config");
const mongoose = require("mongoose");
const { StallModel } = require("../models");

const stallData = [
    {
        name: "Mang Inasal",
        description: "Authentic Filipino grilled chicken and barbecue. Known for our signature chicken inasal and unlimited rice.",
        location: "Main Canteen, Ground Floor",
        section: "A",
        category: "Filipino",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"],
        openingHours: "8:00 AM - 8:00 PM",
        openingTime: "8:00 AM",
        closingTime: "8:00 PM",
        status: "approved",
        isActive: true,
        paymentMethods: ["Cash", "GCash", "Maya"],
        paymentDetails: {
            gcashNumber: "09123456789",
            mayaNumber: "09123456788"
        }
    },
    {
        name: "Jollibee",
        description: "The Philippines' favorite fast food chain. Serving delicious chickenjoy, spaghetti, and burgers.",
        location: "Main Canteen, Ground Floor",
        section: "B",
        category: "Fast Food",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"],
        openingHours: "7:00 AM - 9:00 PM",
        openingTime: "7:00 AM",
        closingTime: "9:00 PM",
        status: "approved",
        isActive: true,
        paymentMethods: ["Cash", "GCash", "Maya"],
        paymentDetails: {
            gcashNumber: "09123456787",
            mayaNumber: "09123456786"
        }
    },
    {
        name: "Chowking",
        description: "Chinese-Filipino fast food chain offering noodle soups, dim sum, and rice meals.",
        location: "Main Canteen, Second Floor",
        section: "C",
        category: "Chinese",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"],
        openingHours: "8:00 AM - 8:00 PM",
        openingTime: "8:00 AM",
        closingTime: "8:00 PM",
        status: "approved",
        isActive: true,
        paymentMethods: ["Cash", "GCash", "Maya"],
        paymentDetails: {
            gcashNumber: "09123456785",
            mayaNumber: "09123456784"
        }
    },
    {
        name: "Greenwich Pizza",
        description: "Delicious oven-baked pizzas, pasta, and baked treats. Perfect for sharing with friends.",
        location: "Main Canteen, Second Floor",
        section: "D",
        category: "Italian",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"],
        openingHours: "9:00 AM - 7:00 PM",
        openingTime: "9:00 AM",
        closingTime: "7:00 PM",
        status: "approved",
        isActive: true,
        paymentMethods: ["Cash", "GCash", "Maya"],
        paymentDetails: {
            gcashNumber: "09123456783",
            mayaNumber: "09123456782"
        }
    }
];

async function seedStalls() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://Jemuel:Student12345@cluster0.f3bxoif.mongodb.net/FoodHub?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Clear existing stalls
        await StallModel.deleteMany({});
        console.log("Cleared existing stalls");

        // Insert new stalls with all payment options
        const inserted = await StallModel.insertMany(stallData);
        console.log(`✅ Seeded ${inserted.length} stalls successfully:`);
        inserted.forEach(stall => {
            console.log(`  - ${stall.name} (${stall._id})`);
            console.log(`    Payment Methods: ${stall.paymentMethods.join(", ")}`);
            if (stall.paymentDetails) {
                console.log(`    GCash: ${stall.paymentDetails.gcashNumber || "N/A"}`);
                console.log(`    Maya: ${stall.paymentDetails.mayaNumber || "N/A"}`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedStalls();