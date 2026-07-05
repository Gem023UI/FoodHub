"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const { createProductUpload, createReviewUpload, createStallUpload, createPaymentProofUpload } = require("../utils/cloudinary");

const uploadRouter = (0, express_1.Router)();
exports.uploadRouter = uploadRouter;

const productUpload = createProductUpload();
const reviewUpload = createReviewUpload();
const stallUpload = createStallUpload();
const paymentProofUpload = createPaymentProofUpload();

// ─── UPLOAD PRODUCT IMAGE ───────────────────────────────────────────────
uploadRouter.post("/product", auth_1.authenticateRequest, productUpload.single("product"), (request, response) => {
    if (!request.file) {
        response.status(400).json({ message: "No file uploaded." });
        return;
    }
    response.json({ url: request.file.path });
});

// ─── UPLOAD REVIEW IMAGES (up to 5) ─────────────────────────────────────
uploadRouter.post("/review", auth_1.authenticateRequest, reviewUpload.array("images", 5), (request, response) => {
    if (!request.files || request.files.length === 0) {
        response.status(400).json({ message: "No files uploaded." });
        return;
    }
    const urls = request.files.map(file => file.path);
    response.json({ urls });
});

// ─── UPLOAD STALL IMAGE ──────────────────────────────────────────────────
uploadRouter.post("/stall-image", auth_1.authenticateRequest, stallUpload.single("image"), (request, response) => {
        if (!request.file) {
        response.status(400).json({ message: "No file uploaded." });
        return;
    }
    response.json({ url: request.file.path });
});

// ─── UPLOAD PAYMENT PROOF (GCash / Maya screenshot) ─────────────────────
uploadRouter.post("/payment-proof", auth_1.authenticateRequest, paymentProofUpload.single("proof"), (request, response) => {
    if (!request.file) {
        response.status(400).json({ message: "No file uploaded." });
        return;
    }
    response.json({ url: request.file.path });
});