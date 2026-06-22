import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["user", "vendor", "admin"],
      default: "user"
    },
    profilePictureUrl: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Active", "Suspended", "Pending"],
      default: "Active"
    },
    // Student-specific fields
    studentId: { type: String, trim: true, default: null },
    courseSection: { type: String, trim: true, default: null },
    schoolEmail: { type: String, trim: true, lowercase: true, default: null, sparse: true },
    // Vendor-specific fields
    contactNumber: { type: String, trim: true, default: null }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ contactNumber: 1 }, { sparse: true });

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);