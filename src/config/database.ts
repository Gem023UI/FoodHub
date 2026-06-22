import mongoose from "mongoose";
import { BudgetModel, FavoriteModel, MenuItemModel, ReviewModel, StallModel, UserModel } from "../models";

export async function connectDatabase(mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);
}

export async function ensureCollections(): Promise<void> {
  await Promise.all([
    UserModel.createCollection(),
    StallModel.createCollection(),
    MenuItemModel.createCollection(),
    ReviewModel.createCollection(),
    FavoriteModel.createCollection(),
    BudgetModel.createCollection()
  ]);
}