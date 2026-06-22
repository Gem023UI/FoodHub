"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("./routes/auth.routes");
const categories_routes_1 = require("./routes/categories.routes");
const favorites_routes_1 = require("./routes/favorites.routes");
const reviews_routes_1 = require("./routes/reviews.routes");
const stalls_routes_1 = require("./routes/stalls.routes");
const users_routes_1 = require("./routes/users.routes");
const analytics_routes_1 = require("./routes/analytics.routes");
const ai_routes_1 = require("./routes/ai.routes");
const order_routes_1 = require("./routes/order.routes");
const report_routes_1 = require("./routes/report.routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use("/auth", auth_routes_1.authRouter);
    app.use("/categories", categories_routes_1.categoriesRouter);
    app.use("/reviews", reviews_routes_1.reviewsRouter);
    app.use("/favorites", favorites_routes_1.favoritesRouter);
    app.use("/stalls", stalls_routes_1.stallsRouter);
    app.use("/users", users_routes_1.usersRouter);
    app.use("/analytics", analytics_routes_1.analyticsRouter);
    app.use("/ai", ai_routes_1.aiRouter);
    app.use("/orders", order_routes_1.ordersRouter);
    app.use("/reports", report_routes_1.reportRouter);
    app.get("/health", (_request, response) => {
        response.json({ status: "ok", service: "FoodHub API" });
    });
    return app;
}
