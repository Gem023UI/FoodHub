"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = authenticateRequest;
exports.authorizeRoles = authorizeRoles;
const env_1 = require("../config/env");
const jwt_1 = require("../utils/jwt");
function authenticateRequest(request, response, next) {
    const authorizationHeader = request.header("authorization");
    if (!authorizationHeader?.startsWith("Bearer ")) {
        response.status(401).json({ message: "Missing or invalid authorization token." });
        return;
    }
    const token = authorizationHeader.slice(7).trim();
    try {
        const config = (0, env_1.getConfig)();
        const payload = (0, jwt_1.verifyAccessToken)(token, config.jwtSecret);
        request.userId = payload.userId;
        request.role = payload.role;
        next();
    }
    catch {
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
