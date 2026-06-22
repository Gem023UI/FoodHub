"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const defaultPort = 3000;
function readNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function getConfig() {
    return {
        port: readNumber(process.env.PORT, defaultPort),
        mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/foodhub",
        jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
        nodeEnv: process.env.NODE_ENV ?? "development"
    };
}
