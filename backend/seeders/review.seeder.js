"use strict";

require("dotenv/config");
const mongoose = require("mongoose");
const { StudentModel, ProductModel, ReviewModel, StallModel } = require("../models");

// Sample student IDs - you need to have students in your database
// If no students exist, create a default student first
const defaultStudent = {
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
};

// Sample review data for each product
const reviewComments = [
    {
        rating: 5,
        comment: "Absolutely amazing! Perfectly prepared and delicious. Will definitely order again!",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/review1.jpg"]
    },
    {
        rating: 4,
        comment: "Really good! Though a bit pricey, still worth it for the quality.",
        photos: []
    },
    {
        rating: 5,
        comment: "Best food in TUP! The serving size is generous and the taste is incredible.",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/review2.jpg"]
    },
    {
        rating: 3,
        comment: "Decent but could be better. The flavor was good but serving was small.",
        photos: []
    },
    {
        rating: 4,
        comment: "Great taste! The seasoning was perfect. Will come back for sure.",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/review3.jpg"]
    },
    {
        rating: 5,
        comment: "Super delicious! The best I've had on campus. Highly recommended!",
        photos: []
    },
    {
        rating: 4,
        comment: "Very tasty and fresh. The presentation was also nice.",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/review4.jpg"]
    },
    {
        rating: 3,
        comment: "Average quality. Nothing special but gets the job done.",
        photos: []
    },
    {
        rating: 5,
        comment: "Perfect comfort food! The flavors are well-balanced and satisfying.",
        photos: []
    },
    {
        rating: 4,
        comment: "Good value for money. The portion size is decent and tastes great.",
        photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/review5.jpg"]
    },
    {
        rating: 5,
        comment: "Love it! The texture and flavor are spot on. Will definitely order again!",
        photos: []
    },
    {
        rating: 4,
        comment: "Great taste and quality. A bit oily but still delicious.",
        photos: []
    }
];

async function seedReviews() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://Jemuel:Student12345@cluster0.f3bxoif.mongodb.net/FoodHub?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get or create multiple students for varied reviews
        const students = [];
        
        // Create default student if not exists
        let student1 = await StudentModel.findOne({ email: defaultStudent.email });
        if (!student1) {
            console.log("Creating default student for reviews...");
            student1 = await StudentModel.create(defaultStudent);
            console.log(`✅ Created student: ${student1.firstName} ${student1.lastName}`);
        }
        students.push(student1);

        // Create additional students for variety
        const studentData = [
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
            },
            {
                firstName: "Anna",
                lastName: "Dizon",
                email: "anna.dizon@tup.edu.ph",
                passwordHash: "$2a$10$dummyhashforseeder",
                role: "student",
                status: "verified",
                isActive: true,
                tuptId: "TUPT-21-0004",
                course: "BSIT",
                section: "3A",
                contactNumber: "09123456786"
            }
        ];

        for (const data of studentData) {
            let existing = await StudentModel.findOne({ email: data.email });
            if (!existing) {
                const newStudent = await StudentModel.create(data);
                students.push(newStudent);
                console.log(`✅ Created student: ${newStudent.firstName} ${newStudent.lastName}`);
            } else {
                students.push(existing);
            }
        }

        // Get all products
        const products = await ProductModel.find({});
        console.log(`Found ${products.length} products`);

        if (products.length === 0) {
            console.log("❌ No products found. Please run products.seeder.js first.");
            process.exit(1);
        }

        // Clear existing reviews
        await ReviewModel.deleteMany({});
        console.log("Cleared existing reviews");

        let reviewCount = 0;

        // For each product, assign 3-5 reviews from different students
        for (const product of products) {
            // Get stall for this product
            const stall = await StallModel.findById(product.stallId);
            if (!stall) continue;

            // Random number of reviews per product (3-5)
            const numReviews = 3 + Math.floor(Math.random() * 3);
            
            // Get random students for this product
            const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
            const selectedStudents = shuffledStudents.slice(0, numReviews);

            for (let i = 0; i < selectedStudents.length; i++) {
                const student = selectedStudents[i];
                const comment = reviewComments[(reviewCount + i) % reviewComments.length];
                
                // Slight variation in rating for same product
                const ratingVariation = Math.random() > 0.7 ? -1 : (Math.random() > 0.7 ? 1 : 0);
                const finalRating = Math.max(1, Math.min(5, comment.rating + ratingVariation));

                await ReviewModel.create({
                    studentId: student._id,
                    stallId: product.stallId,
                    productId: product._id,
                    productName: product.name,
                    rating: finalRating,
                    comment: comment.comment,
                    photos: comment.photos,
                    isVisible: true
                });
                reviewCount++;
            }
        }

        console.log(`✅ Seeded ${reviewCount} reviews successfully!`);

        // Display summary
        const reviewSummary = await ReviewModel.aggregate([
            { $group: { 
                _id: "$productName", 
                count: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }},
            { $sort: { count: -1 } }
        ]);

        console.log("\n📊 Review Summary:");
        reviewSummary.forEach(r => {
            console.log(`  ${r._id}: ${r.count} reviews, avg rating: ${r.avgRating.toFixed(1)}⭐`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedReviews();