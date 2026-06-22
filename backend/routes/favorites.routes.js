"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const favorite_service_1 = require("../services/favorite.service");
const favoritesRouter = (0, express_1.Router)();
exports.favoritesRouter = favoritesRouter;
favoritesRouter.get("/me", auth_1.authenticateRequest, async (request, response) => {
    if (!request.userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const favorites = await (0, favorite_service_1.listFavoritesByUser)(request.userId);
    response.json({ favorites });
});
favoritesRouter.post("/", auth_1.authenticateRequest, async (request, response) => {
    if (!request.userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const { targetType, targetId } = request.body;
    if (!targetType || !targetId) {
        response.status(400).json({ message: "targetType and targetId are required." });
        return;
    }
    const favorite = await (0, favorite_service_1.addFavorite)(request.userId, { targetType, targetId });
    if (!favorite) {
        response.status(404).json({ message: "Target not found." });
        return;
    }
    response.status(201).json({ favorite });
});
favoritesRouter.delete("/", auth_1.authenticateRequest, async (request, response) => {
    if (!request.userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const { targetType, targetId } = request.body;
    if (!targetType || !targetId) {
        response.status(400).json({ message: "targetType and targetId are required." });
        return;
    }
    const deleted = await (0, favorite_service_1.removeFavorite)(request.userId, targetType, targetId);
    if (!deleted) {
        response.status(404).json({ message: "Favorite not found." });
        return;
    }
    response.status(204).send();
});
