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
    const { period, startDate, endDate } = request.query;
    
    try {
        const now = new Date();
        let start = new Date();
        let labels = [];
        
        if (period === "weekly") {
            start.setDate(start.getDate() - 7);
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            }
        } else if (period === "monthly") {
            start.setMonth(start.getMonth() - 1);
            const days = Math.min(30, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
            for (let i = days; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
        } else if (period === "custom" && startDate && endDate) {
            start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.min(30, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
            for (let i = 0; i <= days; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
        } else {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            }
        }
        
        const query = { 
            studentId, 
            orderStatus: "completed"
        };
        
        if (startDate) {
            const startDateObj = new Date(startDate);
            startDateObj.setHours(0, 0, 0, 0);
            query.createdAt = { $gte: startDateObj };
        }
        if (endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
            query.createdAt = { ...query.createdAt, $lte: endDateObj };
        }
        if (!startDate && !endDate && period !== "custom") {
            query.createdAt = { $gte: start };
        }
        
        console.log("🔬 Nutrition query:", JSON.stringify(query));
        
        const orders = await models_1.OrderModel.find(query)
            .select("orderLines createdAt")
            .lean();
        
        console.log(`🔬 Found ${orders.length} completed orders`);
        
        const dailyNutrition = {};
        
        for (const order of orders) {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            
            if (!dailyNutrition[dateKey]) {
                dailyNutrition[dateKey] = {
                    protein: 0,
                    carbs: 0,
                    calories: 0,
                    count: 0
                };
            }
            
            if (order.orderLines && order.orderLines.length > 0) {
                for (const line of order.orderLines) {
                    if (line.nutrition) {
                        const quantity = line.quantity || 1;
                        dailyNutrition[dateKey].protein += (line.nutrition.protein || 0) * quantity;
                        dailyNutrition[dateKey].carbs += (line.nutrition.carbs || 0) * quantity;
                        dailyNutrition[dateKey].calories += (line.nutrition.calories || 0) * quantity;
                        dailyNutrition[dateKey].count += 1;
                    }
                }
            }
        }
        
        const proteinValues = [];
        const carbsValues = [];
        const caloriesValues = [];
        
        for (const label of labels) {
            const dateStr = getDateStrFromLabel(label);
            const dayData = dailyNutrition[dateStr] || { protein: 0, carbs: 0, calories: 0 };
            proteinValues.push(Math.round(dayData.protein));
            carbsValues.push(Math.round(dayData.carbs));
            caloriesValues.push(Math.round(dayData.calories));
        }
        
        const daysWithData = Object.keys(dailyNutrition).length;
        let avgProtein = 0;
        let avgCarbs = 0;
        let avgCalories = 0;
        
        if (daysWithData > 0) {
            const totalProtein = Object.values(dailyNutrition).reduce((sum, d) => sum + d.protein, 0);
            const totalCarbs = Object.values(dailyNutrition).reduce((sum, d) => sum + d.carbs, 0);
            const totalCalories = Object.values(dailyNutrition).reduce((sum, d) => sum + d.calories, 0);
            
            avgProtein = Math.round(totalProtein / daysWithData);
            avgCarbs = Math.round(totalCarbs / daysWithData);
            avgCalories = Math.round(totalCalories / daysWithData);
        }
        
        console.log("🔬 Nutrition averages:", { avgProtein, avgCarbs, avgCalories });
        console.log("🔬 Daily nutrition data:", dailyNutrition);
        
        response.json({
            labels: labels,
            protein: proteinValues,
            carbs: carbsValues,
            calories: caloriesValues,
            averages: {
                protein: avgProtein,
                carbs: avgCarbs,
                calories: avgCalories
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