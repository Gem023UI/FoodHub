"use strict";

require("dotenv/config");
const mongoose = require("mongoose");
const { StudentModel, VendorModel, StallModel, ProductModel, OrderModel } = require("../models");

// Sample order data generator
function generateOrderLines(products, numItems = 2) {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(numItems, shuffled.length));
    
    return selected.map(product => {
        const quantity = 1 + Math.floor(Math.random() * 3);
        return {
            productId: product._id,
            productName: product.name,
            price: product.price,
            quantity: quantity,
            subtotal: product.price * quantity,
            nutrition: product.nutrition || {}
        };
    });
}

function generateRandomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(8 + Math.floor(Math.random() * 10));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
}

function getRandomPickupTime() {
    const hours = 8 + Math.floor(Math.random() * 10);
    const minutes = Math.floor(Math.random() * 4) * 15;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

async function seedOrders() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://Jemuel:Student12345@cluster0.f3bxoif.mongodb.net/FoodHub?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get students (use the ones from review seeder or create default)
        let students = await StudentModel.find({});
        if (students.length === 0) {
            // Create default students
            const defaultStudents = [
                {
                    firstName: "Juan",
                    lastName: "Dela Cruz",
                    email: "juan.delacruz@tup.edu.ph",
                    passwordHash: "$2a$10$dummyhashforseeder",
                    role: "student",
                    status: "verified",
                    isActive: true,
                    tuptId: "TUPT-21-0001",
                    course: "BSIT",
                    section: "3A",
                    contactNumber: "09123456789"
                },
                {
                    firstName: "Maria",
                    lastName: "Santos",
                    email: "maria.santos@tup.edu.ph",
                    passwordHash: "$2a$10$dummyhashforseeder",
                    role: "student",
                    status: "verified",
                    isActive: true,
                    tuptId: "TUPT-21-0002",
                    course: "BSCS",
                    section: "3B",
                    contactNumber: "09123456788"
                },
                {
                    firstName: "Jose",
                    lastName: "Reyes",
                    email: "jose.reyes@tup.edu.ph",
                    passwordHash: "$2a$10$dummyhashforseeder",
                    role: "student",
                    status: "verified",
                    isActive: true,
                    tuptId: "TUPT-21-0003",
                    course: "BSECE",
                    section: "3C",
                    contactNumber: "09123456787"
                }
            ];
            students = await StudentModel.insertMany(defaultStudents);
            console.log(`✅ Created ${students.length} default students`);
        }

        // Get vendors and their stalls
        const vendors = await VendorModel.find({}).populate("stallId");
        console.log(`Found ${vendors.length} vendors`);

        if (vendors.length === 0) {
            console.log("❌ No vendors found. Please run vendors.seeder.js first.");
            process.exit(1);
        }

        // Clear existing orders
        await OrderModel.deleteMany({});
        console.log("Cleared existing orders");

        let orderCount = 0;
        const orderStatuses = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
        const paymentStatuses = ["Unpaid", "Paid"];

        // For each vendor/stall, create 5 orders
        for (const vendor of vendors) {
            const stall = vendor.stallId;
            if (!stall) {
                console.log(`⚠️ Vendor ${vendor.firstName} ${vendor.lastName} has no stall, skipping...`);
                continue;
            }

            // Get products for this stall
            const products = await ProductModel.find({ stallId: stall._id });
            if (products.length === 0) {
                console.log(`⚠️ No products found for ${stall.name}, skipping...`);
                continue;
            }

            console.log(`📦 Creating orders for ${stall.name}...`);

            // Get available payment methods from stall, default to ["Cash"] if none
            const availableMethods = stall.paymentMethods && stall.paymentMethods.length > 0 
                ? stall.paymentMethods 
                : ["Cash"];
            
            console.log(`  Available payment methods: ${availableMethods.join(", ")}`);

            // Create 5 orders per stall
            for (let i = 0; i < 5; i++) {
                // Pick random student
                const student = students[Math.floor(Math.random() * students.length)];
                
                // Generate order lines (2-4 items)
                const numItems = 2 + Math.floor(Math.random() * 3);
                const orderLines = generateOrderLines(products, numItems);
                
                // Calculate total
                const totalAmount = orderLines.reduce((sum, line) => sum + line.subtotal, 0);
                
                // Random payment method from available methods
                const paymentMethod = availableMethods[Math.floor(Math.random() * availableMethods.length)];
                
                // Random status (weighted towards completed)
                let statusIndex = Math.random();
                let orderStatus, paymentStatus;
                if (statusIndex < 0.4) {
                    orderStatus = "Completed";
                    paymentStatus = "Paid";
                } else if (statusIndex < 0.6) {
                    orderStatus = "Ready";
                    paymentStatus = "Paid";
                } else if (statusIndex < 0.8) {
                    orderStatus = "Preparing";
                    paymentStatus = "Paid";
                } else if (statusIndex < 0.9) {
                    orderStatus = "Pending";
                    paymentStatus = Math.random() > 0.5 ? "Paid" : "Unpaid";
                } else {
                    orderStatus = "Cancelled";
                    paymentStatus = "Unpaid";
                }

                // Random date within last 30 days
                const createdAt = generateRandomDate(30);
                
                // Build order object
                const orderData = {
                    studentId: student._id,
                    stallId: stall._id,
                    orderLines: orderLines,
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    pickupTime: getRandomPickupTime(),
                    orderStatus: orderStatus,
                    paymentStatus: paymentStatus,
                    createdAt: createdAt,
                    updatedAt: createdAt
                };

                // Add GCash number only if payment method is GCash
                if (paymentMethod === "GCash") {
                    orderData.gcashNumber = "0912345678" + String(Math.floor(Math.random() * 90) + 10);
                }

                const order = await OrderModel.create(orderData);
                orderCount++;
            }
            
            console.log(`  ✅ Created 5 orders for ${stall.name}`);
        }

        console.log(`✅ Seeded ${orderCount} orders successfully!`);

        // Display summary
        const orderSummary = await OrderModel.aggregate([
            { $group: {
                _id: "$orderStatus",
                count: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }},
            { $sort: { count: -1 } }
        ]);

        console.log("\n📊 Order Summary:");
        orderSummary.forEach(o => {
            console.log(`  ${o._id}: ${o.count} orders, ₱${o.totalRevenue.toFixed(2)} revenue`);
        });

        // Display payment method breakdown
        const paymentSummary = await OrderModel.aggregate([
            { $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } }
        ]);

        console.log("\n💳 Payment Method Breakdown:");
        paymentSummary.forEach(p => {
            console.log(`  ${p._id}: ${p.count} orders`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedOrders();