import bcrypt from "bcryptjs";
import { isMongoServerError } from "../utils/mongo";
import { UserModel } from "../models";
import { signAccessToken } from "../utils/jwt";
import { getConfig } from "../config/env";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: "user" | "vendor" | undefined;
  studentId?: string | undefined;
  courseSection?: string | undefined;
  schoolEmail?: string | undefined;
  contactNumber?: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const config = getConfig();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? "user",
    studentId: input.studentId || null,
    courseSection: input.courseSection || null,
    schoolEmail: input.schoolEmail || null,
    contactNumber: input.contactNumber || null
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
      isActive: user.isActive
    },
    accessToken: signAccessToken({ userId: user._id.toString(), role: user.role }, config.jwtSecret)
  };
}

export async function loginUser(input: LoginInput) {
  const config = getConfig();
  const user = await UserModel.findOne({ email: input.email.toLowerCase().trim() }).select("+passwordHash");

  if (!user) {
    return { success: false, reason: "invalid_credentials" };
  }

  if (user.status === "Suspended" || !user.isActive) {
    return { success: false, reason: "suspended" };
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    return { success: false, reason: "invalid_credentials" };
  }

  return {
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        isActive: user.isActive
      },
      accessToken: signAccessToken({ userId: user._id.toString(), role: user.role }, config.jwtSecret)
    }
  };
}

export function isDuplicateEmailError(error: unknown): boolean {
  return isMongoServerError(error) && error.code === 11000;
}