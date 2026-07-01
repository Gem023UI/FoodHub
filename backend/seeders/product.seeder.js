"use strict";

require("dotenv/config");
const mongoose = require("mongoose");
const { StallModel, ProductModel } = require("../models");

// Product data for each stall
const productData = {
    // Mang Inasal (Section A)
    "Mang Inasal": {
        "Rice Meal": [
            {
                name: "Chicken Inasal",
                description: "Signature grilled chicken marinated in annatto oil and calamansi. Served with rice.",
                price: 99.00,
                nutrition: { calories: 450, proteinGrams: 35, carbsGrams: 45, fatGrams: 18 },
                ingredients: ["Chicken", "Annatto Oil", "Calamansi", "Garlic", "Ginger"],
                allergens: ["Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            },
            {
                name: "Pork BBQ",
                description: "Grilled pork skewers marinated in a sweet and savory sauce. Served with rice.",
                price: 89.00,
                nutrition: { calories: 380, proteinGrams: 28, carbsGrams: 35, fatGrams: 15 },
                ingredients: ["Pork", "Soy Sauce", "Ketchup", "Garlic", "Sugar"],
                allergens: ["Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            },
            {
                name: "Sizzling Sisig",
                description: "Sizzling pork sisig with onions and chili. Served with rice.",
                price: 120.00,
                nutrition: { calories: 520, proteinGrams: 32, carbsGrams: 40, fatGrams: 28 },
                ingredients: ["Pork Head", "Onions", "Chili", "Calamansi", "Mayonnaise"],
                allergens: ["Eggs"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            }
        ],
        "Beverage": [
            {
                name: "Iced Tea",
                description: "Refreshing iced tea served with lemon.",
                price: 35.00,
                nutrition: { calories: 90, proteinGrams: 0, carbsGrams: 23, fatGrams: 0 },
                ingredients: ["Tea", "Sugar", "Lemon"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            },
            {
                name: "Fresh Lemonade",
                description: "Freshly squeezed lemonade with a hint of mint.",
                price: 40.00,
                nutrition: { calories: 75, proteinGrams: 0, carbsGrams: 19, fatGrams: 0 },
                ingredients: ["Lemon", "Sugar", "Water", "Mint"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            }
        ],
        "Snacks": [
            {
                name: "Lumpiang Shanghai",
                description: "Crispy Filipino spring rolls filled with ground pork and vegetables.",
                price: 65.00,
                nutrition: { calories: 280, proteinGrams: 12, carbsGrams: 28, fatGrams: 14 },
                ingredients: ["Ground Pork", "Carrots", "Onions", "Garlic", "Spring Roll Wrapper"],
                allergens: ["Wheat", "Eggs"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            },
            {
                name: "Banana Cue",
                description: "Caramelized bananas on a stick, a Filipino favorite.",
                price: 25.00,
                nutrition: { calories: 150, proteinGrams: 1, carbsGrams: 35, fatGrams: 2 },
                ingredients: ["Saba Banana", "Brown Sugar", "Oil"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            }
        ],
        "Add-ons": [
            {
                name: "Extra Rice",
                description: "Extra serving of steamed rice.",
                price: 20.00,
                nutrition: { calories: 200, proteinGrams: 4, carbsGrams: 42, fatGrams: 0 },
                ingredients: ["Rice"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            },
            {
                name: "Egg",
                description: "Fried egg, sunny side up.",
                price: 15.00,
                nutrition: { calories: 70, proteinGrams: 6, carbsGrams: 0, fatGrams: 5 },
                ingredients: ["Egg"],
                allergens: ["Eggs"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png"]
            }
        ]
    },
    // Jollibee (Section B)
    "Jollibee": {
        "Rice Meal": [
            {
                name: "Chickenjoy 1pc",
                description: "Famous crispy fried chicken with rice and gravy.",
                price: 89.00,
                nutrition: { calories: 420, proteinGrams: 32, carbsGrams: 40, fatGrams: 22 },
                ingredients: ["Chicken", "Flour", "Spices", "Oil"],
                allergens: ["Wheat"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            },
            {
                name: "Chickenjoy 2pc",
                description: "Two pieces of crispy fried chicken with rice and gravy.",
                price: 149.00,
                nutrition: { calories: 680, proteinGrams: 50, carbsGrams: 55, fatGrams: 35 },
                ingredients: ["Chicken", "Flour", "Spices", "Oil"],
                allergens: ["Wheat"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            },
            {
                name: "Burger Steak",
                description: "Juicy burger patty in mushroom gravy with rice.",
                price: 75.00,
                nutrition: { calories: 350, proteinGrams: 25, carbsGrams: 38, fatGrams: 14 },
                ingredients: ["Beef", "Mushrooms", "Gravy", "Rice"],
                allergens: ["Wheat", "Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            }
        ],
        "Beverage": [
            {
                name: "Pineapple Juice",
                description: "Refreshing pineapple juice.",
                price: 39.00,
                nutrition: { calories: 110, proteinGrams: 0, carbsGrams: 28, fatGrams: 0 },
                ingredients: ["Pineapple", "Sugar"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            },
            {
                name: "Coca-Cola",
                description: "Classic Coca-Cola served with ice.",
                price: 35.00,
                nutrition: { calories: 140, proteinGrams: 0, carbsGrams: 39, fatGrams: 0 },
                ingredients: ["Carbonated Water", "Sugar", "Caffeine"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            }
        ],
        "Snacks": [
            {
                name: "Jolly Hotdog",
                description: "Hotdog bun with cheese and special sauce.",
                price: 55.00,
                nutrition: { calories: 320, proteinGrams: 12, carbsGrams: 35, fatGrams: 15 },
                ingredients: ["Hotdog", "Bun", "Cheese", "Sauce"],
                allergens: ["Wheat", "Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            },
            {
                name: "French Fries",
                description: "Crispy golden french fries.",
                price: 45.00,
                nutrition: { calories: 250, proteinGrams: 3, carbsGrams: 32, fatGrams: 12 },
                ingredients: ["Potato", "Oil", "Salt"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            }
        ],
        "Add-ons": [
            {
                name: "Gravy",
                description: "Extra serving of gravy.",
                price: 10.00,
                nutrition: { calories: 40, proteinGrams: 1, carbsGrams: 5, fatGrams: 2 },
                ingredients: ["Flour", "Butter", "Chicken Stock"],
                allergens: ["Wheat", "Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png"]
            }
        ]
    },
    // Chowking (Section C)
    "Chowking": {
        "Rice Meal": [
            {
                name: "Chao Fan",
                description: "Classic Chinese fried rice with pork and shrimp.",
                price: 95.00,
                nutrition: { calories: 480, proteinGrams: 22, carbsGrams: 55, fatGrams: 18 },
                ingredients: ["Rice", "Pork", "Shrimp", "Eggs", "Green Onions"],
                allergens: ["Eggs", "Shellfish", "Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            },
            {
                name: "Braised Beef",
                description: "Tender braised beef in savory sauce with rice.",
                price: 110.00,
                nutrition: { calories: 520, proteinGrams: 30, carbsGrams: 48, fatGrams: 22 },
                ingredients: ["Beef", "Soy Sauce", "Star Anise", "Garlic", "Rice"],
                allergens: ["Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            },
            {
                name: "Sweet and Sour Pork",
                description: "Crispy pork in sweet and sour sauce with rice.",
                price: 105.00,
                nutrition: { calories: 490, proteinGrams: 25, carbsGrams: 52, fatGrams: 20 },
                ingredients: ["Pork", "Pineapple", "Bell Peppers", "Onions", "Sweet and Sour Sauce"],
                allergens: ["Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            }
        ],
        "Beverage": [
            {
                name: "Wintermelon Milk Tea",
                description: "Creamy wintermelon milk tea with pearls.",
                price: 55.00,
                nutrition: { calories: 180, proteinGrams: 2, carbsGrams: 40, fatGrams: 2 },
                ingredients: ["Wintermelon", "Milk", "Tea", "Tapioca Pearls"],
                allergens: ["Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            },
            {
                name: "Lemon Iced Tea",
                description: "Refreshing lemon iced tea.",
                price: 40.00,
                nutrition: { calories: 85, proteinGrams: 0, carbsGrams: 22, fatGrams: 0 },
                ingredients: ["Tea", "Lemon", "Sugar"],
                allergens: [],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            }
        ],
        "Snacks": [
            {
                name: "Pancit Canton",
                description: "Stir-fried egg noodles with vegetables and meat.",
                price: 75.00,
                nutrition: { calories: 340, proteinGrams: 14, carbsGrams: 42, fatGrams: 12 },
                ingredients: ["Egg Noodles", "Cabbage", "Carrots", "Pork", "Soy Sauce"],
                allergens: ["Wheat", "Eggs", "Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            },
            {
                name: "Siopao Asado",
                description: "Steamed pork bun with savory filling.",
                price: 45.00,
                nutrition: { calories: 210, proteinGrams: 10, carbsGrams: 30, fatGrams: 6 },
                ingredients: ["Flour", "Pork", "Soy Sauce", "Garlic", "Sugar"],
                allergens: ["Wheat", "Soy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            }
        ],
        "Add-ons": [
            {
                name: "Fried Wonton",
                description: "Crispy fried wonton wrapper with pork filling.",
                price: 20.00,
                nutrition: { calories: 80, proteinGrams: 3, carbsGrants: 8, fatGrams: 4 },
                ingredients: ["Wonton Wrapper", "Pork", "Garlic"],
                allergens: ["Wheat", "Eggs"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png"]
            }
        ]
    },
    // Greenwich Pizza (Section D)
    "Greenwich Pizza": {
        "Rice Meal": [
            {
                name: "Pasta with Meatballs",
                description: "Spaghetti with savory meatballs and garlic bread.",
                price: 95.00,
                nutrition: { calories: 460, proteinGrams: 24, carbsGrams: 48, fatGrams: 18 },
                ingredients: ["Pasta", "Meatballs", "Tomato Sauce", "Garlic Bread"],
                allergens: ["Wheat", "Eggs", "Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            },
            {
                name: "Baked Macaroni",
                description: "Creamy baked macaroni with cheese and ground meat.",
                price: 85.00,
                nutrition: { calories: 420, proteinGrams: 20, carbsGrams: 45, fatGrams: 16 },
                ingredients: ["Macaroni", "Ground Meat", "Cheese", "Tomato Sauce"],
                allergens: ["Wheat", "Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            },
            {
                name: "Lasagna",
                description: "Classic Italian lasagna with layers of pasta, meat, and cheese.",
                price: 120.00,
                nutrition: { calories: 580, proteinGrams: 30, carbsGrams: 50, fatGrams: 28 },
                ingredients: ["Pasta", "Ground Beef", "Tomato Sauce", "Cheese", "Béchamel"],
                allergens: ["Wheat", "Dairy", "Eggs"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            }
        ],
        "Beverage": [
            {
                name: "Iced Mocha",
                description: "Chilled mocha coffee with whipped cream.",
                price: 50.00,
                nutrition: { calories: 160, proteinGrams: 3, carbsGrams: 28, fatGrams: 5 },
                ingredients: ["Coffee", "Chocolate", "Milk", "Sugar", "Whipped Cream"],
                allergens: ["Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            },
            {
                name: "Strawberry Shake",
                description: "Refreshing strawberry milkshake.",
                price: 55.00,
                nutrition: { calories: 210, proteinGrams: 4, carbsGrams: 40, fatGrams: 5 },
                ingredients: ["Strawberry", "Milk", "Ice Cream", "Sugar"],
                allergens: ["Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            }
        ],
        "Snacks": [
            {
                name: "Garlic Bread",
                description: "Toasted bread with garlic butter and herbs.",
                price: 35.00,
                nutrition: { calories: 180, proteinGrams: 5, carbsGrams: 22, fatGrams: 8 },
                ingredients: ["Bread", "Garlic", "Butter", "Herbs"],
                allergens: ["Wheat", "Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            },
            {
                name: "Pizza Slice",
                description: "Classic cheese pizza slice.",
                price: 45.00,
                nutrition: { calories: 240, proteinGrams: 10, carbsGrams: 28, fatGrams: 10 },
                ingredients: ["Pizza Dough", "Tomato Sauce", "Cheese"],
                allergens: ["Wheat", "Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            }
        ],
        "Add-ons": [
            {
                name: "Extra Cheese",
                description: "Extra serving of cheese for pizza or pasta.",
                price: 15.00,
                nutrition: { calories: 60, proteinGrams: 4, carbsGrams: 1, fatGrams: 5 },
                ingredients: ["Cheese"],
                allergens: ["Dairy"],
                photos: ["https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782547195/92ebf89e-abfe-400e-9cd3-70f8597b6932.png"]
            }
        ]
    }
};

async function seedProducts() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://Jemuel:Student12345@cluster0.f3bxoif.mongodb.net/FoodHub?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get all stalls
        const stalls = await StallModel.find({});
        console.log(`Found ${stalls.length} stalls`);

        // Clear existing products
        await ProductModel.deleteMany({});
        console.log("Cleared existing products");

        let totalProducts = 0;

        // Loop through each stall and create products
        for (const stall of stalls) {
            const stallName = stall.name;
            const stallProducts = productData[stallName];
            
            if (!stallProducts) {
                console.log(`⚠️ No product data for ${stallName}, skipping...`);
                continue;
            }

            console.log(`📦 Seeding products for ${stallName}...`);

            const products = [];
            
            // Loop through categories
            for (const [category, items] of Object.entries(stallProducts)) {
                for (const item of items) {
                    products.push({
                        stallId: stall._id,
                        ...item,
                        category: category,
                        isAvailable: true,
                        isFeatured: Math.random() > 0.7 // Randomly feature some items
                    });
                }
            }

            if (products.length > 0) {
                const inserted = await ProductModel.insertMany(products);
                totalProducts += inserted.length;
                console.log(`  ✅ Added ${inserted.length} products for ${stallName}`);
            }
        }

        console.log(`✅ Successfully seeded ${totalProducts} products across all stalls!`);
        
        // List products by category
        const categoryCounts = await ProductModel.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        console.log("\n📊 Products by Category:");
        categoryCounts.forEach(c => {
            console.log(`  ${c._id}: ${c.count}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedProducts();