"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = authenticateRequest;
exports.authorizeRoles = authorizeRoles;
const env_1 = require("../config/env");
const jwt_1 = require("../utils/jwt");

function authenticateRequest(request, response, next) {
    const authorizationHeader = request.header("authorization");
    
    console.log("🔐 Auth header:", authorizationHeader ? "Present" : "Missing");

    if (!authorizationHeader?.startsWith("Bearer ")) {
        console.log("❌ No Bearer token found");
        response.status(401).json({ message: "Missing or invalid authorization token." });
        return;
    }

    const token = authorizationHeader.slice(7).trim();
    console.log("🔑 Token received:", token.substring(0, 20) + "...");

    try {
        const config = (0, env_1.getConfig)();
        const payload = (0, jwt_1.verifyAccessToken)(token, config.jwtSecret);
        
        console.log("✅ Token verified. Payload:", payload);
        
        request.userId = payload.userId;
        request.role = payload.role;
        request.user = payload;
        
        console.log(`✅ Authenticated: userId=${request.userId}, role=${request.role}`);

        next();
    } catch (error) {
        console.error("❌ Auth error:", error.message);
        response.status(401).json({ message: "Invalid or expired authorization token." });
    }
}

function authorizeRoles(...allowedRoles) {
    return (request, response, next) => {
        if (!request.role || !allowedRoles.includes(request.role)) {
            response.status(403).json({ message: "You do not have permission to access this resource." });
            return;
        }
        next();
    };
}