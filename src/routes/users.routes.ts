import { Router, type Request, type Response } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/auth";
import { listUsers, updateUser } from "../services/user.service";
import { UserModel } from "../models/user.model";
import bcrypt from "bcryptjs";

const usersRouter = Router();

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

// Get all users (admin only)
usersRouter.get(
  "/",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    try {
      const users = await listUsers();
      response.json({ users });
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch users." });
    }
  }
);

// Get current user profile
usersRouter.get(
  "/:userId",
  authenticateRequest,
  async (request: Request, response: Response) => {
    const userId = firstParam(request.params.userId);
    
    if (!userId) {
      response.status(400).json({ message: "Invalid user id." });
      return;
    }

    // Users can only access their own profile unless they're admin
    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only access your own profile." });
      return;
    }

    try {
      const user = await updateUser(userId, {}); // Get without updating
      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }
      response.json(user);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch user." });
    }
  }
);

// Update user profile
usersRouter.patch(
  "/:userId",
  authenticateRequest,
  async (request: Request, response: Response) => {
    const userId = firstParam(request.params.userId);

    if (!userId) {
      response.status(400).json({ message: "Invalid user id." });
      return;
    }

    // Users can only update their own profile unless they're admin
    if (request.role !== "admin" && request.userId !== userId) {
      response.status(403).json({ message: "You can only update your own profile." });
      return;
    }

    const { 
      name, 
      email, 
      profilePictureUrl, 
      studentId, 
      courseSection, 
      schoolEmail, 
      contactNumber,
      role, 
      isActive,
      status
    } = request.body as {
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
    };

    try {
      const updates: Record<string, unknown> = {};
      
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (profilePictureUrl !== undefined) updates.profilePictureUrl = profilePictureUrl;
      if (studentId !== undefined) updates.studentId = studentId;
      if (courseSection !== undefined) updates.courseSection = courseSection;
      if (schoolEmail !== undefined) updates.schoolEmail = schoolEmail;
      if (contactNumber !== undefined) updates.contactNumber = contactNumber;
      
      // Only admins can change role and isActive
      if (request.role === "admin") {
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.isActive = isActive;
        if (status !== undefined) {
          updates.status = status;
          updates.isActive = status === "Active";
        }
      }

      const user = await updateUser(userId, updates);

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      response.json(user);
    } catch (error) {
      response.status(500).json({ message: "Failed to update user." });
    }
  }
);

// Create user (admin only)
usersRouter.post(
  "/",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const { name, email, password, role, isActive, status } = request.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: "user" | "vendor" | "admin";
      isActive?: boolean;
      status?: "Active" | "Suspended" | "Pending";
    };

    if (!name || !email || !password) {
      response.status(400).json({ message: "Name, email, and password are required." });
      return;
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({
        name,
        email,
        passwordHash,
        role: role ?? "user",
        status: status ?? "Active",
        isActive: status ? (status === "Active") : (isActive !== false)
      });
      
      response.status(201).json({
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      if (error && (error as any).code === 11000) {
        response.status(409).json({ message: "An account with that email already exists." });
        return;
      }
      response.status(500).json({ message: "Failed to create user." });
    }
  }
);

// Delete user (admin only)
usersRouter.delete(
  "/:userId",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const userId = firstParam(request.params.userId);
    if (!userId) {
      response.status(400).json({ message: "Invalid user id." });
      return;
    }

    try {
      const user = await UserModel.findByIdAndDelete(userId);
      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }
      response.status(204).end();
    } catch (error) {
      response.status(500).json({ message: "Failed to delete user." });
    }
  }
);

export { usersRouter };
