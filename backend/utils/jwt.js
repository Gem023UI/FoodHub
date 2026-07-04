"use strict";

const jwt = require("jsonwebtoken");

// ── Generate Access Token ─────────────────────────────────────────────
function generateAccessToken(payload) {
    const secret = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    
    return jwt.sign(payload, secret, { expiresIn });
}

// ── Verify Access Token ───────────────────────────────────────────────
function verifyAccessToken(token, secret) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
}

// ── Generate Refresh Token ────────────────────────────────────────────
function generateRefreshToken(payload) {
    const secret = process.env.JWT_REFRESH_SECRET || "your-super-secret-jwt-refresh-key-change-this-in-production";
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
    
    return jwt.sign(payload, secret, { expiresIn });
}

// ── Verify Refresh Token ──────────────────────────────────────────────
function verifyRefreshToken(token, secret) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error("Invalid or expired refresh token");
    }
}

// ── Decode Token (without verification) ──────────────────────────────
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    decodeToken
};