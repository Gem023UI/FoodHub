import { Router, type Request, type Response } from "express";
import { authenticateRequest } from "../middleware/auth";
import { isDuplicateEmailError, loginUser, registerUser } from "../services/auth.service";

const authRouter = Router();

authRouter.post("/register", async (request: Request, response: Response) => {
  const { name, email, password, role, studentId, courseSection, schoolEmail, contactNumber } = request.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: "user" | "vendor";
    studentId?: string;
    courseSection?: string;
    schoolEmail?: string;
    contactNumber?: string;
  };

  if (!name || !email || !password) {
    response.status(400).json({ message: "name, email, and password are required." });
    return;
  }

  if (password.length < 8) {
    response.status(400).json({ message: "Password must be at least 8 characters long." });
    return;
  }

  try {
    const result = await registerUser({
      name,
      email,
      password,
      role,
      studentId,
      courseSection,
      schoolEmail,
      contactNumber
    });
    response.status(201).json(result);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      response.status(409).json({ message: "An account with that email already exists." });
      return;
    }

    response.status(500).json({ message: "Failed to register user." });
  }
});

authRouter.post("/login", async (request: Request, response: Response) => {
  const { email, password } = request.body as { email?: string; password?: string };

  if (!email || !password) {
    response.status(400).json({ message: "email and password are required." });
    return;
  }

  try {
    const result = await loginUser({ email, password });

    if (!result.success) {
      if (result.reason === "suspended") {
        response.status(403).json({ message: "Your account has been suspended by an administrator." });
      } else {
        response.status(401).json({ message: "Invalid email or password." });
      }
      return;
    }

    response.json(result.data);
  } catch {
    response.status(500).json({ message: "Failed to log in." });
  }
});

authRouter.get("/me", authenticateRequest, (request: Request, response: Response) => {
  response.json({ userId: request.userId, role: request.role });
});

export { authRouter };