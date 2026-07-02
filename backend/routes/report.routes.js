"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const report_controller_1 = require("../controllers/report.controller");

const reportRouter = (0, express_1.Router)();
exports.reportRouter = reportRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── DASHBOARD INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/dashboard", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getDashboardInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching dashboard insights:", error);
        response.status(500).json({ message: "Failed to fetch insights." });
    }
});

// ── STALL INSIGHTS ──────────────────────────────────────────────────────
reportRouter.get("/stall/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin", "vendor"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    try {
        const insights = await (0, report_controller_1.getStallInsights)(stallId);
        if (!insights) {
            return response.status(404).json({ message: "Stall not found." });
        }
        response.json(insights);
    } catch (error) {
        console.error("Error fetching stall insights:", error);
        response.status(500).json({ message: "Failed to fetch stall insights." });
    }
});

// ── PRODUCT INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/products", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getProductInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching product insights:", error);
        response.status(500).json({ message: "Failed to fetch product insights." });
    }
});

// ── VENDOR INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/vendors", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getVendorInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching vendor insights:", error);
        response.status(500).json({ message: "Failed to fetch vendor insights." });
    }
});

// ── STUDENT INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/students", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getStudentInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching student insights:", error);
        response.status(500).json({ message: "Failed to fetch student insights." });
    }
});

// ── ORDER INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/orders", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getOrderInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching order insights:", error);
        response.status(500).json({ message: "Failed to fetch order insights." });
    }
});

// ── BUDGET INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/budgets", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getBudgetInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching budget insights:", error);
        response.status(500).json({ message: "Failed to fetch budget insights." });
    }
});

// ── TREND INSIGHTS ──────────────────────────────────────────────────
reportRouter.get("/trends", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const insights = await (0, report_controller_1.getTrendInsights)();
        response.json(insights);
    } catch (error) {
        console.error("Error fetching trend insights:", error);
        response.status(500).json({ message: "Failed to fetch trend insights." });
    }
});