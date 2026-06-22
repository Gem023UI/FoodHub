"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StallModel = void 0;
const mongoose_1 = require("mongoose");
const stallSchema = new mongoose_1.Schema({
    vendorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "" },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    section: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "general", index: true },
    photoUrl: { type: String, trim: true, default: null },
    openingHours: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" }
}, { timestamps: true });
stallSchema.index({ name: "text", description: "text", location: "text", section: "text" });
stallSchema.index({ vendorId: 1, name: 1 }, { unique: true });
exports.StallModel = (0, mongoose_1.model)("Stall", stallSchema);
