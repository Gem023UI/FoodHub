"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;

const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("./routes/auth.routes");
const favorites_routes_1 = require("./routes/favorites.routes");
const reviews_routes_1 = require("./routes/reviews.routes");
const stalls_routes_1 = require("./routes/stalls.routes");
const users_routes_1 = require("./routes/user.routes");
const analytics_routes_1 = require("./routes/analytics.routes");

function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use("/auth", auth_routes_1.authRouter);
    app.use("/reviews", reviews_routes_1.reviewsRouter);
    app.use("/favorites", favorites_routes_1.favoritesRouter);
    app.use("/stalls", stalls_routes_1.stallsRouter);
    app.use("/users", users_routes_1.usersRouter);
    app.use("/analytics", analytics_routes_1.analyticsRouter);
    app.get("/health", (_request, response) => {
        response.json({ status: "ok", service: "FoodHub API" });
    });
    app.use((err, req, res, next) => {
        console.error("Unhandled error:", err);
        res.status(500).json({ 
            message: "Internal server error", 
            error: process.env.NODE_ENV === "development" ? err.message : undefined 
        });
    });
    return app;
}
