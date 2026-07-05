"use strict";
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const { getConfig } = require("../config/env");
const streamifier = require("streamifier");

function initCloudinary() {
  const config = getConfig();
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });
  console.log("☁️ Cloudinary initialized");
}

// ── Upload buffer to Cloudinary ─────────────────────────────────────────
async function uploadToCloudinary(buffer, folder = 'foodhub') {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );
        
        const readableStream = streamifier.createReadStream(buffer);
        readableStream.pipe(uploadStream);
    });
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

function createReviewUpload() {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "foodhub/reviews",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1000, crop: "limit" }],
    },
  });
  return multer({ storage });
}

module.exports = { 
  initCloudinary, 
  uploadToCloudinary,
  createVendorUpload, 
  createProductUpload, 
  createStudentProfileUpload, 
  createVendorProfileUpload,
  createAdminProfileUpload,
  createReviewUpload
};