"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const budget_controller_1 = require("../controllers/budget.controller");

const budgetRouter = (0, express_1.Router)();
exports.budgetRouter = budgetRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── GET ALL BUDGET RECORDS ──────────────────────────────────────────────
budgetRouter.get("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    try {
        const budgets = await (0, budget_controller_1.getBudgetRecords)();
        response.json({ budgets });
    } catch (error) {
        console.error("Error fetching budgets:", error);
        response.status(500).json({ message: "Failed to fetch budgets." });
    }
});

// ── GET BUDGET BY COURSE ──────────────────────────────────────────────────
budgetRouter.get("/course/:course", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const course = firstParam(request.params.course);
    try {
        const budgets = await (0, budget_controller_1.getBudgetByCourse)(course);
        response.json({ budgets });
    } catch (error) {
        console.error("Error fetching budgets by course:", error);
        response.status(500).json({ message: "Failed to fetch budgets." });
    }
});

// ── GET BUDGET BY STATUS ──────────────────────────────────────────────────
budgetRouter.get("/status/:status", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const status = firstParam(request.params.status);
    try {
        const budgets = await (0, budget_controller_1.getBudgetByStatus)(status);
        response.json({ budgets });
    } catch (error) {
        console.error("Error fetching budgets by status:", error);
        response.status(500).json({ message: "Failed to fetch budgets." });
    }
});

// ── GET STUDENT BUDGET ──────────────────────────────────────────────────
budgetRouter.get("/student", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    try {
        const budgetData = await (0, budget_controller_1.getStudentBudget)(studentId);
        if (!budgetData) {
            return response.status(404).json({ message: "Student not found." });
        }
        response.json(budgetData);
    } catch (error) {
        console.error("Error fetching student budget:", error);
        response.status(500).json({ message: "Failed to fetch budget." });
    }
});

// ── CREATE BUDGET ──────────────────────────────────────────────────────────
budgetRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const { studentId, amount, period, startDate, endDate } = request.body;
    
    if (!studentId || !amount || !startDate || !endDate) {
        return response.status(400).json({ 
            message: "Student ID, amount, start date, and end date are required." 
        });
    }
    
    try {
        const result = await (0, budget_controller_1.createBudget)({
            studentId,
            amount,
            period: period || "monthly",
            startDate,
            endDate
        });
        
        if (!result.success) {
            const messages = {
                invalid_student_id: "Invalid student ID.",
                student_not_found: "Student not found."
            };
            return response.status(400).json({ 
                message: messages[result.reason] || "Failed to create budget." 
            });
        }
        
        response.status(201).json({ budget: result.data.budget });
    } catch (error) {
        console.error("Error creating budget:", error);
        response.status(500).json({ message: "Failed to create budget." });
    }
});

// ── UPDATE BUDGET ──────────────────────────────────────────────────────────
budgetRouter.patch("/:budgetId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const budgetId = firstParam(request.params.budgetId);
    const updates = request.body;
    
    try {
        const result = await (0, budget_controller_1.updateBudget)(budgetId, updates);
        
        if (!result.success) {
            const messages = {
                invalid_budget_id: "Invalid budget ID.",
                budget_not_found: "Budget not found."
            };
            return response.status(400).json({ 
                message: messages[result.reason] || "Failed to update budget." 
            });
        }
        
        response.json({ budget: result.data.budget });
    } catch (error) {
        console.error("Error updating budget:", error);
        response.status(500).json({ message: "Failed to update budget." });
    }
});