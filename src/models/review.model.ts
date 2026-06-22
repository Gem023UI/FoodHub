import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stallId: { type: Schema.Types.ObjectId, ref: "Stall", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" },
    isVisible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, stallId: 1 }, { unique: true });
reviewSchema.index({ stallId: 1, rating: -1, createdAt: -1 });

export type Review = InferSchemaType<typeof reviewSchema> & { userId: Types.ObjectId; stallId: Types.ObjectId };
export const ReviewModel = model("Review", reviewSchema);