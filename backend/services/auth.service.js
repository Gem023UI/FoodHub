"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.isDuplicateEmailError = isDuplicateEmailError;

const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongo_1 = require("../utils/mongo");
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");

async function loginUser(input) {
  const config = (0, env_1.getConfig)();
  
  // Search all collections
  let user = await models_1.StudentModel.findOne({ 
    email: input.email.toLowerCase().trim() 
  }).select("+passwordHash +emailVerificationCode +emailVerificationExpires");
  
  let userType = "student";
  
  if (!user) {
    user = await models_1.VendorModel.findOne({ 
      email: input.email.toLowerCase().trim() 
    }).select("+passwordHash +emailVerificationCode +emailVerificationExpires");
    userType = "vendor";
  }
  
  if (!user) {
    user = await models_1.AdminModel.findOne({ 
      email: input.email.toLowerCase().trim() 
    }).select("+passwordHash");
    userType = "admin";
  }

  if (!user) {
    return { success: false, reason: "invalid_credentials" };
  }

  // Check if account is suspended
  if (user.status === "suspended" || !user.isActive) {
    return { success: false, reason: "suspended" };
  }

  // For students and vendors, check if email is verified (skip for admin)
  if (user.role !== "admin" && user.status !== "verified") {
    return { success: false, reason: "unverified" };
  }

  // Verify password
  const passwordMatches = await bcryptjs_1.default.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    return { success: false, reason: "invalid_credentials" };
  }

  return {
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl || null,
        isActive: user.isActive
      },
      accessToken: (0, jwt_1.signAccessToken)({ 
        userId: user._id.toString(), 
        role: user.role 
      }, config.jwtSecret)
    }
  };
}

function isDuplicateEmailError(error) {
  return (0, mongo_1.isMongoServerError)(error) && error.code === 11000;
}