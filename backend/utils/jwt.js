"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signAccessToken(payload, secret) {
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
}
function verifyAccessToken(token, secret) {
    return jsonwebtoken_1.default.verify(token, secret);
}
