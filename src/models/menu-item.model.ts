import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const nutritionSchema = new Schema(
  {
    calories: { type: Number, min: 0, default: null },
    proteinGrams: { type: Number, min: 0, default: null },
    carbsGrams: { type: Number, min: 0, default: null },
    fatGrams: { type: Number, min: 0, default: null },
    sodiumMilligrams: { type: Number, min: 0, default: null }
  },
  { _id: false }
);

const menuItemSchema = new Schema(
  {
    stallId: { type: Schema.Types.ObjectId, ref: "Stall", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "" },
    ingredients: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    nutrition: { type: nutritionSchema, default: {} },
    price: { type: Number, required: true, min: 0 },
    photoUrl: { type: String, trim: true, default: null },
    category: { type: String, trim: true, default: "general", index: true },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

menuItemSchema.index({ stallId: 1, name: 1 }, { unique: true });
menuItemSchema.index({ name: "text", description: "text", ingredients: "text", allergens: "text" });
menuItemSchema.index({ price: 1, isAvailable: 1, category: 1 });

export type MenuItem = InferSchemaType<typeof menuItemSchema> & { stallId: Types.ObjectId };
export const MenuItemModel = model("MenuItem", menuItemSchema);