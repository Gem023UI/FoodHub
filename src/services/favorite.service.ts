import { FavoriteModel, MenuItemModel, StallModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface FavoriteTarget {
  targetType: "stall" | "menuItem";
  targetId: string;
}

export async function listFavoritesByUser(userId: string) {
  return FavoriteModel.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function addFavorite(userId: string, target: FavoriteTarget) {
  if (!isValidObjectId(target.targetId)) {
    return null;
  }

  if (target.targetType === "stall") {
    const stall = await StallModel.findById(target.targetId).select("_id").lean();

    if (!stall) {
      return null;
    }
  } else {
    const menuItem = await MenuItemModel.findById(target.targetId).select("_id").lean();

    if (!menuItem) {
      return null;
    }
  }

  const favorite = await FavoriteModel.create({
    userId,
    targetType: target.targetType,
    targetId: target.targetId
  });

  return favorite.toObject();
}

export async function removeFavorite(userId: string, targetType: "stall" | "menuItem", targetId: string) {
  if (!isValidObjectId(targetId)) {
    return false;
  }

  const result = await FavoriteModel.findOneAndDelete({ userId, targetType, targetId });
  return Boolean(result);
}