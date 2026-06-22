"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analytics_service_1 = require("../services/analytics.service");
const analyticsRouter = (0, express_1.Router)();
exports.analyticsRouter = analyticsRouter;
analyticsRouter.get("/top-rated-stalls", async (_request, response) => {
    try {
        const stalls = await (0, analytics_service_1.getTopRatedStalls)(3);
        response.json(stalls);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch top rated stalls." });
    }
});
analyticsRouter.get("/top-rated-items", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getTopRatedItems)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch top rated items." });
    }
});
analyticsRouter.get("/most-popular-items", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getMostPopularItems)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch most popular items." });
    }
});
analyticsRouter.get("/trending-week", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getTrendingThisWeek)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch trending items." });
    }
});
analyticsRouter.get("/most-favorited-stalls", async (_request, response) => {
    try {
        const stalls = await (0, analytics_service_1.getMostFavoritedStalls)(3);
        response.json(stalls);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch most favorited stalls." });
    }
});
analyticsRouter.get("/most-favorited-items", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getMostFavoritedItems)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch most favorited items." });
    }
});
analyticsRouter.get("/cheapest-items", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getCheapestItems)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch cheapest items." });
    }
});
analyticsRouter.get("/best-value", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getBestValue)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch best value items." });
    }
});
analyticsRouter.get("/most-reviewed-stalls", async (_request, response) => {
    try {
        const stalls = await (0, analytics_service_1.getMostReviewedStalls)(3);
        response.json(stalls);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch most reviewed stalls." });
    }
});
analyticsRouter.get("/new-arrivals", async (_request, response) => {
    try {
        const items = await (0, analytics_service_1.getNewArrivals)(3);
        response.json(items);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch new arrivals." });
    }
});
