import mongoose from "mongoose";

export function isValidObjectId(value: string): boolean {
  return mongoose.isValidObjectId(value);
}