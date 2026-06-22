import { CategoryModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
}

export async function listCategories() {
  return CategoryModel.find({}).sort({ name: 1 }).lean();
}

export async function getCategoryById(categoryId: string) {
  if (!isValidObjectId(categoryId)) {
    return null;
  }

  return CategoryModel.findById(categoryId).lean();
}

export async function createCategory(input: CreateCategoryInput) {
  const category = await CategoryModel.create({
    name: input.name.trim(),
    description: input.description?.trim() ?? ""
  });

  return category.toObject();
}

export async function updateCategory(categoryId: string, updates: UpdateCategoryInput) {
  if (!isValidObjectId(categoryId)) {
    return null;
  }

  return CategoryModel.findByIdAndUpdate(categoryId, { $set: updates }, { new: true }).lean();
}

export async function deleteCategory(categoryId: string) {
  if (!isValidObjectId(categoryId)) {
    return false;
  }

  const result = await CategoryModel.findByIdAndDelete(categoryId);
  return Boolean(result);
}
