"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetModel = void 0;
const mongoose_1 = require("mongoose");

const budgetSchema = new mongoose_1.Schema({
  studentId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },
  studentTuptId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  studentCourse: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  status: {
    type: String,
    enum: ["accomplished", "failed", "active"],
    default: "active"
  }
}, { timestamps: true });

budgetSchema.index({ studentId: 1 });
budgetSchema.index({ studentTuptId: 1 });
budgetSchema.index({ status: 1 });

exports.BudgetModel = (0, mongoose_1.model)("Budget", budgetSchema);