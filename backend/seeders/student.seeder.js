"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv/config");

// ── Import Models ──────────────────────────────────────────────────────
const { StudentModel } = require("../models/student.model");

// ── Configuration ──────────────────────────────────────────────────────
const DEFAULT_PASSWORD = "Student@123";
const PROFILE_PICTURE = "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782987606/sandwich_tubjsx.png";

// ── TUP Courses ──────────────────────────────────────────────────────
const COURSES = [
  "BSIT", "BSCS", "BSIS", "BSBA", "BSHM", 
  "BSEd", "BEED", "BSN", "BSPSYCH", "BSCRIM",
  "BSECE", "BSEE", "BSME", "BSCE", "BSIE",
  "BSArch", "BSA", "BSTM", "BSEntrep", "BSOA"
];

// ── Student Data ──────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Carlos", "Rosa", "Antonio", "Elena",
  "Pedro", "Luisa", "Miguel", "Isabel", "Jorge", "Carmen", "Ramon", "Teresa",
  "Luis", "Rita", "Manuel", "Clara", "Alberto", "Sofia", "Andres", "Julia",
  "Francisco", "Patricia", "Enrique", "Lourdes", "Rafael", "Luz"
];

const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Garcia", "Martinez", "Gonzales", "Lopez", "Perez",
  "Mendoza", "Flores", "Ocampo", "Villanueva", "Dela Cruz", "Torres", "Rivera",
  "Morales", "Castro", "Valdez", "Ramos", "Aquino", "Bautista", "Gutierrez",
  "Hernandez", "Romero", "Salazar", "Paredes", "David", "Bernardo", "Santos", "Luna"
];

const SECTIONS = ["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C", "4A"];

const STATUSES = ["verified", "unverified", "deactivated"];

// ── Helper Functions ──────────────────────────────────────────────────
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTuptId() {
  const year = String(getRandomNumber(20, 24)).padStart(2, '0');
  const number = String(getRandomNumber(1000, 9999));
  return `TUPT-${year}-${number}`;
}

function generateEmail(firstName, lastName) {
  const domains = ["gmail.com", "yahoo.com", "tup.edu.ph", "outlook.com"];
  const domain = getRandomItem(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 99)}@${domain}`;
}

function generateBirthdate() {
  const year = getRandomNumber(2000, 2005);
  const month = String(getRandomNumber(1, 12)).padStart(2, '0');
  const day = String(getRandomNumber(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateContactNumber() {
  const prefix = ["09", "08", "07"];
  const numbers = String(getRandomNumber(100000000, 999999999));
  return `${getRandomItem(prefix)}${numbers}`;
}

// ── Generate Students ──────────────────────────────────────────────────
function generateStudents(count = 30) {
  const students = [];
  const usedEmails = new Set();
  const usedTuptIds = new Set();

  for (let i = 0; i < count; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const course = getRandomItem(COURSES);
    const status = getRandomItem(STATUSES);
    
    // Generate unique email
    let email = generateEmail(firstName, lastName);
    let attempts = 0;
    while (usedEmails.has(email) && attempts < 10) {
      email = generateEmail(firstName, lastName);
      attempts++;
    }
    usedEmails.add(email);

    // Generate unique TUPT ID
    let tuptId = generateTuptId();
    attempts = 0;
    while (usedTuptIds.has(tuptId) && attempts < 10) {
      tuptId = generateTuptId();
      attempts++;
    }
    usedTuptIds.add(tuptId);

    students.push({
      firstName,
      lastName,
      email,
      tuptId,
      course,
      section: getRandomItem(SECTIONS),
      contactNumber: generateContactNumber(),
      birthdate: generateBirthdate(),
      status: status,
      profilePictureUrl: PROFILE_PICTURE,
      role: "student",
      // Additional fields
      orderCount: getRandomNumber(0, 50),
      totalSpent: getRandomNumber(0, 5000),
    });
  }

  return students;
}

// ── Database Connection ────────────────────────────────────────────────
async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://Jemuel:Student12345@ac-yxbmddu-shard-00-00.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-01.f3bxoif.mongodb.net:27017,ac-yxbmddu-shard-00-02.f3bxoif.mongodb.net:27017/FoodHub?ssl=true&replicaSet=atlas-xbkzgf-shard-0&authSource=admin&appName=Cluster0";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");
}

// ── Seed Students ──────────────────────────────────────────────────────
async function seedStudents() {
  try {
    await connectDatabase();

    console.log("📝 Generating 30 student records...");
    const studentsData = generateStudents(30);

    console.log("🔑 Hashing passwords...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    // Prepare students for insertion
    const studentsToInsert = studentsData.map(student => ({
      ...student,
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert students (without deleting existing records)
    console.log(`💾 Inserting ${studentsToInsert.length} students...`);
    const result = await StudentModel.insertMany(studentsToInsert, { ordered: false });
    
    console.log(`✅ Successfully inserted ${result.length} students!`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Student Summary:");
    console.log(`   Total Inserted: ${result.length}`);
    console.log(`   Default Password: ${DEFAULT_PASSWORD}`);
    console.log(`   Profile Picture: ${PROFILE_PICTURE}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Display sample student credentials
    console.log("\n📋 Sample Student Credentials:");
    console.log("   Email:    ", result[0].email);
    console.log("   Password: ", DEFAULT_PASSWORD);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Show course distribution
    const courseCount = {};
    result.forEach(s => {
      courseCount[s.course] = (courseCount[s.course] || 0) + 1;
    });
    
    console.log("\n📊 Course Distribution:");
    Object.entries(courseCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([course, count]) => {
        console.log(`   ${course}: ${count} students`);
      });

    // Show status distribution
    const statusCount = {};
    result.forEach(s => {
      statusCount[s.status] = (statusCount[s.status] || 0) + 1;
    });
    
    console.log("\n📊 Status Distribution:");
    Object.entries(statusCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} students`);
      });

  } catch (error) {
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      console.warn("⚠️ Some students already exist in the database. Skipping duplicates...");
      console.log("✅ Seed completed with existing records preserved.");
    } else {
      console.error("❌ Error seeding students:", error);
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// ── Run Seeder ─────────────────────────────────────────────────────────
seedStudents();