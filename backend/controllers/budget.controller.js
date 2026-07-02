"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgetRecords = getBudgetRecords;
exports.getBudgetByCourse = getBudgetByCourse;
exports.getBudgetByStatus = getBudgetByStatus;
exports.getStudentBudget = getStudentBudget;
exports.createBudget = createBudget;
exports.updateBudget = updateBudget;

const models_1 = require("../models");
const ids_1 = require("../utils/ids");

// ── GET ALL BUDGET RECORDS ──────────────────────────────────────────────
async function getBudgetRecords() {
    return models_1.BudgetModel.find({})
        .populate("studentId", "firstName lastName email tuptId course")
        .sort({ createdAt: -1 })
        .lean();
}

// ── GET BUDGET BY COURSE ──────────────────────────────────────────────────
async function getBudgetByCourse(course) {
    return models_1.BudgetModel.find({ studentCourse: course })
        .populate("studentId", "firstName lastName email tuptId course")
        .sort({ createdAt: -1 })
        .lean();
}

// ── GET BUDGET BY STATUS ──────────────────────────────────────────────────
async function getBudgetByStatus(status) {
    return models_1.BudgetModel.find({ status })
        .populate("studentId", "firstName lastName email tuptId course")
        .sort({ createdAt: -1 })
        .lean();
}

// ── GET STUDENT BUDGET ──────────────────────────────────────────────────
async function getStudentBudget(studentId) {
    if (!(0, ids_1.isValidObjectId)(studentId)) return null;
    
    const student = await models_1.StudentModel.findById(studentId)
        .select("budgetCap firstName lastName email tuptId course")
        .lean();
    
    if (!student) return null;
    
    // Get active budgets
    const now = new Date();
    const activeBudgets = student.budgetCap.filter(b => 
        b.status === "active" && 
        b.startDate <= now && 
        b.endDate >= now
    );
    
    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(activeBudgets.map(async (budget) => {
        let sinceDate = budget.startDate;
        if (budget.period === "daily") {
            sinceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (budget.period === "weekly") {
            sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (budget.period === "monthly") {
            sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        const orders = await models_1.OrderModel.find({
            studentId,
            createdAt: { $gte: sinceDate },
            orderStatus: { $ne: "cancelled" }
        }).select("totalAmount");
        
        const spent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const remaining = budget.amount - spent;
        
        return {
            ...budget,
            spent,
            remaining,
            percentageUsed: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        };
    }));
    
    return {
        student: {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            tuptId: student.tuptId,
            course: student.course
        },
        budgets: budgetsWithSpending
    };
}

// ── CREATE BUDGET ──────────────────────────────────────────────────────────
async function createBudget(data) {
    const { studentId, amount, startDate, endDate } = data;
    
    if (!(0, ids_1.isValidObjectId)(studentId)) {
        return { success: false, reason: "invalid_student_id" };
    }
    
    const student = await models_1.StudentModel.findById(studentId);
    if (!student) {
        return { success: false, reason: "student_not_found" };
    }
    
    // Add budget to student's budgetCap array
    student.budgetCap.push({
        amount,
        period: data.period || "monthly",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "active"
    });
    
    await student.save();
    
    // Also create in Budget collection for analytics
    const budget = await models_1.BudgetModel.create({
        studentId,
        studentTuptId: student.tuptId,
        studentCourse: student.course,
        amount,
        duration: {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        },
        status: "active"
    });
    
    return { success: true, data: { budget } };
}

// ── UPDATE BUDGET ──────────────────────────────────────────────────────────
async function updateBudget(budgetId, updates) {
    if (!(0, ids_1.isValidObjectId)(budgetId)) {
        return { success: false, reason: "invalid_budget_id" };
    }
    
    const budget = await models_1.BudgetModel.findById(budgetId);
    if (!budget) {
        return { success: false, reason: "budget_not_found" };
    }
    
    const allowed = ["amount", "status"];
    for (const f of allowed) {
        if (f in updates) budget[f] = updates[f];
    }
    
    if (updates.startDate) budget.duration.startDate = new Date(updates.startDate);
    if (updates.endDate) budget.duration.endDate = new Date(updates.endDate);
    
    await budget.save();
    
    // Update student's budgetCap if status changed
    if (updates.status) {
        await models_1.StudentModel.updateOne(
            { _id: budget.studentId, "budgetCap._id": budgetId },
            { $set: { "budgetCap.$.status": updates.status } }
        );
    }
    
    return { success: true, data: { budget } };
}