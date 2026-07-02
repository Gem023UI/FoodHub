"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const favorite_controller_1 = require("../controllers/favorite.controller");

const favoritesRouter = (0, express_1.Router)();
exports.favoritesRouter = favoritesRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── TOGGLE FAVORITE ────────────────────────────────────────────────────
favoritesRouter.post("/toggle", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const { productId } = request.body;
    if (!productId) return response.status(400).json({ message: "Product ID is required." });

    try {
        const result = await (0, favorite_controller_1.toggleFavorite)(studentId, productId);
        if (!result.success) {
            const messages = {
                product_not_found: "Product not found.",
                student_not_found: "Student not found."
            };
            return response.status(404).json({ message: messages[result.reason] || "Failed to toggle favorite." });
        }
        response.json(result.data);
    } catch (error) {
        console.error("Error toggling favorite:", error);
        response.status(500).json({ message: "Failed to toggle favorite." });
    }
});

// ── CHECK IF FAVORITED ──────────────────────────────────────────────────
favoritesRouter.get("/check/:productId", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const productId = firstParam(request.params.productId);
    if (!productId) return response.status(400).json({ message: "Product ID is required." });

    try {
        const student = await models_1.StudentModel.findById(studentId).select("favorites").lean();
        const isFavorited = !!student?.favorites?.some(f => f.productId.toString() === productId);
        response.json({ isFavorited });
    } catch (error) {
        console.error("Error checking favorite:", error);
        response.status(500).json({ message: "Failed to check favorite." });
    }
});

// ── GET STUDENT FAVORITES ──────────────────────────────────────────────
favoritesRouter.get("/", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    try {
        const favorites = await (0, favorite_controller_1.getStudentFavorites)(studentId);
        response.json({ favorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        response.status(500).json({ message: "Failed to fetch favorites." });
    }
});

// ── GET FAVORITES BY CATEGORY ──────────────────────────────────────────
favoritesRouter.get("/by-category", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    try {
        const favorites = await (0, favorite_controller_1.getFavoritesByCategory)(studentId);
        response.json({ favorites });
    } catch (error) {
        console.error("Error fetching favorites by category:", error);
        response.status(500).json({ message: "Failed to fetch favorites." });
    }
});

// ── GET TOP 3 BY COURSE ──────────────────────────────────────────────────
favoritesRouter.get("/top/course/:course", async (request, response) => {
    const course = firstParam(request.params.course);
    try {
        const topFavorites = await (0, favorite_controller_1.getTopFavoritesByCourse)(course);
        response.json({ topFavorites });
    } catch (error) {
        console.error("Error fetching top favorites by course:", error);
        response.status(500).json({ message: "Failed to fetch top favorites." });
    }
});

// ── GET TOP 3 BY PERIOD ──────────────────────────────────────────────────
favoritesRouter.get("/top/period/:period", async (request, response) => {
    const period = firstParam(request.params.period);
    try {
        const topFavorites = await (0, favorite_controller_1.getTopFavoritesByPeriod)(period);
        response.json({ topFavorites });
    } catch (error) {
        console.error("Error fetching top favorites by period:", error);
        response.status(500).json({ message: "Failed to fetch top favorites." });
    }
});

// ── GET ALL STALLS WITH FAVORITE COUNTS ──────────────────────────────────
favoritesRouter.get("/stalls/all", async (request, response) => {
    try {
        const stalls = await (0, favorite_controller_1.getAllStallsWithFavoriteCount)();
        response.json({ stalls });
    } catch (error) {
        console.error("Error fetching stalls with favorites:", error);
        response.status(500).json({ message: "Failed to fetch stalls." });
    }
});