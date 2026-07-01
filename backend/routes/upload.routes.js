"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const { createProductUpload } = require("../utils/cloudinary");

const uploadRouter = (0, express_1.Router)();
exports.uploadRouter = uploadRouter;

const productUpload = createProductUpload();

// ─── UPLOAD PRODUCT IMAGE ───────────────────────────────────────────────
uploadRouter.post("/product", auth_1.authenticateRequest, productUpload.single("product"), (request, response) => {
    if (!request.file) {
        response.status(400).json({ message: "No file uploaded." });
        return;
    }
    response.json({ url: request.file.path });
});