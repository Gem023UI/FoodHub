"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = isValidObjectId;
exports.generateVerificationCode = generateVerificationCode;
const mongoose_1 = __importDefault(require("mongoose"));
function isValidObjectId(value) {
    return mongoose_1.default.isValidObjectId(value);
}
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}