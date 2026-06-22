"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoServerError = isMongoServerError;
function isMongoServerError(error) {
    return typeof error === "object" && error !== null && "code" in error;
}
