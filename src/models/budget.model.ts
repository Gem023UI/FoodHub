import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    period: { type: String, required: true, enum: ["daily", "weekly", "monthly"] },
    limitAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "PHP" },
    alertThresholdPercent: { type: Number, min: 0, max: 100, default: 80 },
    spentAmount: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, period: 1 });

export type Budget = InferSchemaType<typeof budgetSchema> & { userId: Types.ObjectId };
export const BudgetModel = model("Budget", budgetSchema);