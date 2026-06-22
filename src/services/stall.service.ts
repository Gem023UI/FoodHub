import { StallModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface StallQuery {
  q?: string | undefined;
  category?: string | undefined;
  location?: string | undefined;
  isActive?: boolean | undefined;
}

export interface CreateStallInput {
  vendorId: string;
  name: string;
  description?: string | undefined;
  location: string;
  section?: string | undefined;
  category?: string | undefined;
  photoUrl?: string | null;
  openingHours?: string | undefined;
  status?: "pending" | "approved" | "rejected" | undefined;
}

export interface UpdateStallInput {
  name?: string | undefined;
  description?: string | undefined;
  location?: string | undefined;
  section?: string | undefined;
  category?: string | undefined;
  photoUrl?: string | null;
  openingHours?: string | undefined;
  isActive?: boolean | undefined;
  status?: "pending" | "approved" | "rejected" | undefined;
}

export async function listStalls(query: StallQuery) {
  const filters: Record<string, unknown> = {};

  if (query.category) {
    filters.category = query.category;
  }

  if (query.location) {
    filters.location = { $regex: query.location, $options: "i" };
  }

  if (typeof query.isActive === "boolean") {
    filters.isActive = query.isActive;
  }

  if (query.q) {
    filters.$text = { $search: query.q };
  }

  return StallModel.find(filters).populate("vendorId", "name email").sort({ createdAt: -1 }).lean();
}

export async function getStallById(stallId: string) {
  if (!isValidObjectId(stallId)) {
    return null;
  }

  return StallModel.findById(stallId).populate("vendorId", "name email").lean();
}

export async function createStall(input: CreateStallInput) {
  const stall = await StallModel.create({
    vendorId: input.vendorId,
    name: input.name,
    description: input.description ?? "",
    location: input.location,
    section: input.section ?? "",
    category: input.category ?? "general",
    photoUrl: input.photoUrl ?? null,
    openingHours: input.openingHours ?? "",
    status: input.status ?? "approved"
  });

  return stall.toObject();
}

export async function updateStall(stallId: string, updates: UpdateStallInput) {
  if (!isValidObjectId(stallId)) {
    return null;
  }

  return StallModel.findByIdAndUpdate(stallId, { $set: updates }, { new: true }).populate("vendorId", "name email").lean();
}

export async function deleteStall(stallId: string) {
  if (!isValidObjectId(stallId)) {
    return false;
  }

  const result = await StallModel.findByIdAndDelete(stallId);
  return Boolean(result);
}

export async function canManageStall(stallId: string, actorId: string, actorRole: "user" | "vendor" | "admin") {
  if (!isValidObjectId(stallId)) {
    return false;
  }

  if (actorRole === "admin") {
    return true;
  }

  const stall = await StallModel.findById(stallId).select("vendorId").lean();

  if (!stall) {
    return false;
  }

  return stall.vendorId.toString() === actorId;
}