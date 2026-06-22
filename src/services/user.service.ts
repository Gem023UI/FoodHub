import { UserModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface UpdateUserInput {
  name?: string;
  email?: string;
  profilePictureUrl?: string | null;
  studentId?: string | null;
  courseSection?: string | null;
  schoolEmail?: string | null;
  contactNumber?: string | null;
  role?: "user" | "vendor" | "admin";
  isActive?: boolean;
  status?: "Active" | "Suspended" | "Pending";
}

export async function listUsers() {
  return UserModel.find({})
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getUserById(userId: string) {
  if (!isValidObjectId(userId)) {
    return null;
  }

  return UserModel.findById(userId)
    .select("-passwordHash")
    .lean();
}

export async function updateUser(userId: string, updates: UpdateUserInput) {
  if (!isValidObjectId(userId)) {
    return null;
  }

  const allowedFields: (keyof UpdateUserInput)[] = [
    "name",
    "email",
    "profilePictureUrl",
    "studentId",
    "courseSection",
    "schoolEmail",
    "contactNumber",
    "role",
    "isActive",
    "status"
  ];
  const sanitizedUpdates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in updates) {
      sanitizedUpdates[field] = updates[field];
    }
  }

  return UserModel.findByIdAndUpdate(userId, { $set: sanitizedUpdates }, { new: true })
    .select("-passwordHash")
    .lean();
}
