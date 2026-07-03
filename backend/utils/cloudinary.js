"use strict";
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const { getConfig } = require("../config/env");

function initCloudinary() {
  const config = getConfig();
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });
  console.log("☁️ Cloudinary initialized");
}

function createVendorUpload() {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "foodhub/vendor-proofs",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1200, crop: "limit" }],
    },
  });
  return multer({ storage });
}

function createProductUpload() {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "foodhub/products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
  });
  return multer({ storage });
}

function createStudentProfileUpload() {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "foodhub/profiles/students",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
    },
  });
  return multer({ storage });
}

function createVendorProfileUpload() {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "foodhub/profiles/vendors",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
    },
  });
  return multer({ storage });
}

// ─── ADMIN PROFILE UPLOAD ──────────────────────────────────────────────
function createAdminProfileUpload() {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "foodhub/profiles/admins",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
    },
  });
  return multer({ storage });
}

// Export all functions
module.exports = { 
  initCloudinary, 
  createVendorUpload, 
  createProductUpload, 
  createStudentProfileUpload, 
  createVendorProfileUpload,
  createAdminProfileUpload
};