import { Schema, model, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, unique: true, index: true },
    description: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model("Category", categorySchema);
