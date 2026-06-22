import { MenuItemModel, StallModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface MenuItemQuery {
  q?: string | undefined;
  category?: string | undefined;
  isAvailable?: boolean | undefined;
  stallId?: string | undefined;
}

export interface CreateMenuItemInput {
  stallId: string;
  name: string;
  description?: string | undefined;
  ingredients?: string[] | undefined;
  allergens?: string[] | undefined;
  nutrition?: {
    calories?: number | null;
    proteinGrams?: number | null;
    carbsGrams?: number | null;
    fatGrams?: number | null;
    sodiumMilligrams?: number | null;
  } | undefined;
  price: number;
  photoUrl?: string | null;
  category?: string | undefined;
  isAvailable?: boolean | undefined;
  isFeatured?: boolean | undefined;
}

export interface UpdateMenuItemInput {
  name?: string | undefined;
  description?: string | undefined;
  ingredients?: string[] | undefined;
  allergens?: string[] | undefined;
  nutrition?: {
    calories?: number | null;
    proteinGrams?: number | null;
    carbsGrams?: number | null;
    fatGrams?: number | null;
    sodiumMilligrams?: number | null;
  } | undefined;
  price?: number | undefined;
  photoUrl?: string | null;
  category?: string | undefined;
  isAvailable?: boolean | undefined;
  isFeatured?: boolean | undefined;
}

export async function listMenuItems(query: MenuItemQuery, populateStall = false) {
  const filters: Record<string, unknown> = {};

  if (query.stallId && isValidObjectId(query.stallId)) {
    filters.stallId = query.stallId;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (typeof query.isAvailable === "boolean") {
    filters.isAvailable = query.isAvailable;
  }

  if (query.q) {
    filters.$text = { $search: query.q };
  }

  let q = MenuItemModel.find(filters).sort({ createdAt: -1 });
  if (populateStall) {
    q = q.populate("stallId", "name");
  }
  return q.lean();
}

export async function getMenuItemById(menuItemId: string) {
  if (!isValidObjectId(menuItemId)) {
    return null;
  }

  return MenuItemModel.findById(menuItemId).lean();
}

export async function createMenuItem(input: CreateMenuItemInput) {
  const stall = await StallModel.findById(input.stallId).select("_id").lean();

  if (!stall) {
    return null;
  }

  const menuItem = await MenuItemModel.create({
    stallId: input.stallId,
    name: input.name,
    description: input.description ?? "",
    ingredients: input.ingredients ?? [],
    allergens: input.allergens ?? [],
    nutrition: input.nutrition ?? {},
    price: input.price,
    photoUrl: input.photoUrl ?? null,
    category: input.category ?? "general",
    isAvailable: input.isAvailable ?? true,
    isFeatured: input.isFeatured ?? false
  });

  return menuItem.toObject();
}

export async function updateMenuItem(menuItemId: string, updates: UpdateMenuItemInput) {
  if (!isValidObjectId(menuItemId)) {
    return null;
  }

  return MenuItemModel.findByIdAndUpdate(menuItemId, { $set: updates }, { new: true }).lean();
}

export async function deleteMenuItem(menuItemId: string) {
  if (!isValidObjectId(menuItemId)) {
    return false;
  }

  const result = await MenuItemModel.findByIdAndDelete(menuItemId);
  return Boolean(result);
}
