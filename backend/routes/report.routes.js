"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const report_controller_1 = require("../controllers/report.controller");
const models_1 = require("../models");

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

// ── STUDENT REGISTRATION TREND ──────────────────────────────────────────
reportRouter.get("/students/registration", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const { period, startDate, endDate } = request.query;
    try {
        const data = await (0, report_controller_1.getStudentRegistrationTrend)(
            period || 'weekly',
            startDate,
            endDate
        );
        response.json(data);
    } catch (error) {
        console.error("Error fetching student registration trend:", error);
        response.status(500).json({ message: "Failed to fetch student registration trend." });
    }
});

// ── STUDENT COURSE DISTRIBUTION ──────────────────────────────────────────
reportRouter.get("/students/course-distribution", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const data = await (0, report_controller_1.getStudentCourseDistribution)();
        response.json(data);
    } catch (error) {
        console.error("Error fetching student course distribution:", error);
        response.status(500).json({ message: "Failed to fetch student course distribution." });
    }
});

// ── STUDENT VERIFIED COMPARISON ──────────────────────────────────────────
reportRouter.get("/students/verified-comparison", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const data = await (0, report_controller_1.getStudentVerifiedComparison)();
        response.json(data);
    } catch (error) {
        console.error("Error fetching student verified comparison:", error);
        response.status(500).json({ message: "Failed to fetch student verified comparison." });
    }
});

// ── STALL SECTION STATUS ──────────────────────────────────────────────────
reportRouter.get("/stalls/section-status", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const data = await (0, report_controller_1.getStallSectionStatus)();
        response.json(data);
    } catch (error) {
        console.error("Error fetching stall section status:", error);
        response.status(500).json({ message: "Failed to fetch stall section status." });
    }
});

// ── STALL DETAILS WITH REVENUE ──────────────────────────────────────────
reportRouter.get("/stalls/details", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const data = await (0, report_controller_1.getStallDetailsWithRevenue)();
        response.json(data);
    } catch (error) {
        console.error("Error fetching stall details:", error);
        response.status(500).json({ message: "Failed to fetch stall details." });
    }
});

// ── ORDER TREND ──────────────────────────────────────────────────────────
reportRouter.get("/orders/trend", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const { period, startDate, endDate } = request.query;
    try {
        const data = await (0, report_controller_1.getOrderTrend)(
            period || 'weekly',
            startDate,
            endDate
        );
        response.json(data);
    } catch (error) {
        console.error("Error fetching order trend:", error);
        response.status(500).json({ message: "Failed to fetch order trend." });
    }
});

// ── ORDERS BY COURSE DISTRIBUTION ──────────────────────────────────────
reportRouter.get("/orders/course-distribution", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const data = await (0, report_controller_1.getOrdersByCourseDistribution)();
        response.json(data);
    } catch (error) {
        console.error("Error fetching orders by course distribution:", error);
        response.status(500).json({ message: "Failed to fetch orders by course distribution." });
    }
});

// ── STUDENT SPENDING ANALYTICS ──────────────────────────────────────────
reportRouter.get("/spending", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const { period } = request.query;
    const view = period === "monthly" ? "monthly" : "weekly"; // default to weekly, no more "custom"

    try {
        const now = new Date();
        let start;
        let labels;

        if (view === "weekly") {
            // Calendar week: Sunday → Saturday
            const dayOfWeek = now.getDay(); // 0 = Sunday
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
            labels = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                labels.push(d.toLocaleDateString("en-US", { weekday: "short" })); // Sun, Mon, ... Sat
            }
        } else {
            // Calendar month, bucketed into 4 weeks
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        }

        const query = {
            studentId,
            orderStatus: { $ne: "cancelled" },
            createdAt: { $gte: start, $lte: now }
        };

        const orders = await models_1.OrderModel.find(query).select("totalAmount createdAt").lean();

        const values = new Array(labels.length).fill(0);
        let elapsedDays;

        if (view === "weekly") {
            elapsedDays = Math.min(7, Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1);
            for (const order of orders) {
                const dayIndex = Math.floor((order.createdAt - start) / (24 * 60 * 60 * 1000));
                if (dayIndex >= 0 && dayIndex < 7) values[dayIndex] += order.totalAmount || 0;
            }
        } else {
            elapsedDays = now.getDate(); // days elapsed so far this month
            for (const order of orders) {
                const dayOfMonth = order.createdAt.getDate(); // 1-31
                const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7)); // 0..3
                values[weekIndex] += order.totalAmount || 0;
            }
        }

        const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const dailyAvg = totalSpent / Math.max(1, elapsedDays);
        const weeklyAvg = dailyAvg * 7;
        const monthlyAvg = dailyAvg * 30;

        const student = await models_1.StudentModel.findById(studentId).select("budgetCap").lean();
        let remaining = 0;
        if (student?.budgetCap) {
            const activeBudget = student.budgetCap.find(b =>
                b.status === "active" &&
                new Date(b.startDate) <= now &&
                new Date(b.endDate) >= now
            );
            if (activeBudget) {
                remaining = Math.max(0, activeBudget.amount - totalSpent);
            }
        }

        response.json({
            daily: dailyAvg,
            weekly: weeklyAvg,
            monthly: monthlyAvg,
            remaining,
            totalSpent,
            periodData: labels.map((label, i) => ({
                label,
                value: values[i] || 0
            }))
        });
    } catch (error) {
        console.error("Error fetching spending analytics:", error);
        response.status(500).json({ message: "Failed to fetch spending analytics." });
    }
});

// ── STUDENT NUTRITION ANALYTICS ──────────────────────────────────────────
reportRouter.get("/nutrition", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const { period } = request.query;
    const view = ["daily", "weekly", "monthly"].includes(period) ? period : "daily";

    try {
        const now = new Date();
        let start;
        let labels;

        if (view === "daily") {
            // Calendar week: Sunday → Saturday
            const dayOfWeek = now.getDay();
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
            labels = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
            }
        } else if (view === "weekly") {
            // Calendar month, bucketed into 4 weeks
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        } else {
            // Calendar year, bucketed into 12 months
            start = new Date(now.getFullYear(), 0, 1);
            labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        }

        const query = {
            studentId,
            orderStatus: "completed",
            createdAt: { $gte: start, $lte: now }
        };

        const orders = await models_1.OrderModel.find(query)
            .select("orderLines createdAt")
            .lean();

        const proteinValues = new Array(labels.length).fill(0);
        const carbsValues = new Array(labels.length).fill(0);
        const caloriesValues = new Array(labels.length).fill(0);

        for (const order of orders) {
            let bucketIndex;
            if (view === "daily") {
                bucketIndex = Math.floor((order.createdAt - start) / (24 * 60 * 60 * 1000));
                if (bucketIndex < 0 || bucketIndex > 6) continue;
            } else if (view === "weekly") {
                const dayOfMonth = order.createdAt.getDate();
                bucketIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
            } else {
                bucketIndex = order.createdAt.getMonth();
            }

            if (order.orderLines && order.orderLines.length > 0) {
                for (const line of order.orderLines) {
                    if (line.nutrition) {
                        const quantity = line.quantity || 1;
                        proteinValues[bucketIndex] += (line.nutrition.protein || 0) * quantity;
                        carbsValues[bucketIndex] += (line.nutrition.carbs || 0) * quantity;
                        caloriesValues[bucketIndex] += (line.nutrition.calories || 0) * quantity;
                    }
                }
            }
        }

        let elapsedDays;
        if (view === "daily") {
            elapsedDays = Math.min(7, Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1);
        } else if (view === "weekly") {
            elapsedDays = now.getDate();
        } else {
            elapsedDays = Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1;
        }

        const totalProtein = proteinValues.reduce((sum, v) => sum + v, 0);
        const totalCarbs = carbsValues.reduce((sum, v) => sum + v, 0);
        const totalCalories = caloriesValues.reduce((sum, v) => sum + v, 0);

        response.json({
            labels,
            protein: proteinValues.map(v => Math.round(v)),
            carbs: carbsValues.map(v => Math.round(v)),
            calories: caloriesValues.map(v => Math.round(v)),
            averages: {
                protein: Math.round(totalProtein / Math.max(1, elapsedDays)),
                carbs: Math.round(totalCarbs / Math.max(1, elapsedDays)),
                calories: Math.round(totalCalories / Math.max(1, elapsedDays))
            }
        });
    } catch (error) {
        console.error("Error fetching nutrition analytics:", error);
        response.status(500).json({ 
            message: "Failed to fetch nutrition analytics.",
            error: error.message 
        });
    }
});

// ── HELPER FUNCTION TO GET DATE STRING FROM LABEL ──────────────────────
function getDateStrFromLabel(label) {
    const parsed = new Date(label);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }
    
    const weekdayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const dayIndex = weekdayMap[label];
    if (dayIndex !== undefined) {
        const d = new Date();
        const currentDay = d.getDay();
        const diff = d.getDate() - currentDay + dayIndex;
        d.setDate(diff);
        return d.toISOString().split('T')[0];
    }
    
    const monthMatch = label.match(/([A-Za-z]{3})\s+(\d+)/);
    if (monthMatch) {
        const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
        const month = monthMap[monthMatch[1]];
        const day = parseInt(monthMatch[2]);
        if (month !== undefined) {
            const d = new Date();
            d.setMonth(month);
            d.setDate(day);
            return d.toISOString().split('T')[0];
        }
    }
    
    return new Date().toISOString().split('T')[0];
}

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