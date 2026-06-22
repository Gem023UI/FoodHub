import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const stallSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "" },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    section: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "general", index: true },
    photoUrl: { type: String, trim: true, default: null },
    openingHours: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" }
  },
  { timestamps: true }
);

stallSchema.index({ name: "text", description: "text", location: "text", section: "text" });
stallSchema.index({ vendorId: 1, name: 1 }, { unique: true });

export type Stall = InferSchemaType<typeof stallSchema> & { vendorId: Types.ObjectId };
export const StallModel = model("Stall", stallSchema);