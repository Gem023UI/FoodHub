import { Schema, model, type InferSchemaType } from "mongoose";

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    reason: {
      type: String,
      required: true,
      enum: [
        "No-show / Unclaimed order",
        "Fake / Duplicate GCash payment",
        "Abusive behavior / Language",
        "Other"
      ]
    },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Resolved", "Dismissed"],
      default: "Pending"
    },
    adminNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ status: 1 });

export type Report = InferSchemaType<typeof reportSchema>;
export const ReportModel = model("Report", reportSchema);
