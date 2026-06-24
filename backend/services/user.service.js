"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers   = listUsers;
exports.getUserById = getUserById;
exports.updateUser  = updateUser;

const models_1 = require("../models");
const ids_1    = require("../utils/ids");

async function listUsers() {
  return models_1.UserModel.find({})
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .sort({ createdAt: -1 })
    .lean();
}

async function getUserById(userId) {
  if (!(0, ids_1.isValidObjectId)(userId)) return null;
  return models_1.UserModel.findById(userId)
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .lean();
}

async function updateUser(userId, updates) {
  if (!(0, ids_1.isValidObjectId)(userId)) return null;

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "profilePictureUrl",
    "birthday",
    "tuptId",
    "course",
    "section",
    "contactNumber",
    "proofOfLegitimacyUrl",
    "role",
    "isActive",
    "status",
  ];

  const sanitizedUpdates = {};
  for (const field of allowedFields) {
    if (field in updates) {
      sanitizedUpdates[field] = updates[field];
    }
  }

  // Sync isActive with status automatically
  if ("status" in sanitizedUpdates) {
    sanitizedUpdates.isActive = sanitizedUpdates.status === "verified";
  }

  return models_1.UserModel
    .findByIdAndUpdate(userId, { $set: sanitizedUpdates }, { new: true })
    .select("-passwordHash -emailVerificationCode -emailVerificationExpires")
    .lean();
}