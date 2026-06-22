import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, required: true, enum: ["stall", "menuItem"], index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true }
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export type Favorite = InferSchemaType<typeof favoriteSchema> & { userId: Types.ObjectId; targetId: Types.ObjectId };
export const FavoriteModel = model("Favorite", favoriteSchema);