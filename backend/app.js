"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;

const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = require("./routes/auth.routes");
const order_routes_1 = require("./routes/order.routes");
const stalls_routes_1 = require("./routes/stalls.routes");
const users_routes_1 = require("./routes/user.routes");
const reviews_routes_1 = require("./routes/review.routes");
const favorites_routes_1 = require("./routes/favorites.routes");
const upload_routes_1 = require("./routes/upload.routes");
const budget_routes_1 = require("./routes/budget.routes");
const report_routes_1 = require("./routes/report.routes");
const product_routes_1 = require("./routes/product.routes");
const { initCloudinary } = require("./utils/cloudinary");

function createApp() {
    const app = (0, express_1.default)();
    
    // ─── CORS ──────────────────────────────────────────────────────────────
    const staticAllowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : [];

    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow non-browser requests (curl, server-to-server, Postman) with no origin header
            if (!origin) return callback(null, true);

            const isTrycloudflare = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin);
            const isStaticallyAllowed = staticAllowedOrigins.includes(origin) || staticAllowedOrigins.includes('*');
            const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

            if (isTrycloudflare || isStaticallyAllowed || isLocalhost) {
                return callback(null, true);
            }

            console.warn(`🚫 CORS blocked origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
    // ─── MIDDLEWARE ──────────────────────────────────────────────────────
    app.use(express_1.default.json({ limit: '50mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
    
    // ─── REQUEST LOGGING (Development only) ────────────────────────────
    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            console.log(`📝 ${req.method} ${req.url}`);
            next();
        });
    }
    
    // ─── CLOUDINARY ──────────────────────────────────────────────────────
    initCloudinary();
    
    // ─── ROUTES ──────────────────────────────────────────────────────────
    app.use("/auth", auth_routes_1.authRouter);
    app.use("/orders", order_routes_1.orderRouter);
    app.use("/stalls", stalls_routes_1.stallsRouter);
    app.use("/users", users_routes_1.usersRouter);
    app.use("/reviews", reviews_routes_1.reviewsRouter);
    app.use("/favorites", favorites_routes_1.favoritesRouter);
    app.use("/uploads", upload_routes_1.uploadRouter);
    app.use("/budgets", budget_routes_1.budgetRouter);
    app.use("/reports", report_routes_1.reportRouter);
    app.use("/products", product_routes_1.productRouter);
    
    // ─── HEALTH CHECK ──────────────────────────────────────────────────
    app.get("/health", (_request, response) => {
        response.json({ 
            status: "ok", 
            service: "FoodHub API",
            version: "2.0.0",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });
    
    // ─── ROOT ENDPOINT ──────────────────────────────────────────────────
    app.get("/", (_request, response) => {
        response.json({
            message: "Welcome to FoodHub API",
            version: "2.0.0",
            endpoints: {
                auth: "/auth",
                orders: "/orders",
                stalls: "/stalls",
                users: "/users",
                reviews: "/reviews",
                favorites: "/favorites",
                uploads: "/uploads",
                budgets: "/budgets",
                reports: "/reports",
                products: "/products",
                health: "/health"
            }
        });
    });
    
    // ─── 404 HANDLER ──────────────────────────────────────────────────────
    app.use((req, res, next) => {
        res.status(404).json({
            message: "Route not found",
            path: req.path,
            method: req.method
        });
    });
    
    // ─── ERROR HANDLER ──────────────────────────────────────────────────
    app.use((err, req, res, next) => {
        console.error("❌ Unhandled error:", err.stack || err);
        
        // Handle specific error types
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation error",
                errors: err.errors
            });
        }
        
        if (err.name === 'CastError') {
            return res.status(400).json({
                message: "Invalid ID format",
                field: err.path
            });
        }
        
        if (err.code === 11000) {
            return res.status(409).json({
                message: "Duplicate key error",
                field: Object.keys(err.keyPattern)[0]
            });
        }
        
        // Default error response
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            error: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    });
    
    return app;
}