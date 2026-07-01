"use strict";
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const { getConfig } = require("../config/env");

function initCloudinary() {
  const config = getConfig();
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key:    config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
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

module.exports = { initCloudinary, createVendorUpload, createProductUpload };