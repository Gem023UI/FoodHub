import { type NextFunction, type Request, type Response } from "express";
import { getConfig } from "../env";
import { verifyAccessToken } from "../../utils/jwt";

export function authenticateRequest(request: Request, response: Response, next: NextFunction): void {
  const authorizationHeader = request.header("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Missing or invalid authorization token." });
    return;
  }

  const token = authorizationHeader.slice(7).trim();

  try {
    const config = getConfig();
    const payload = verifyAccessToken(token, config.jwtSecret);

    request.userId = payload.userId;
    request.role = payload.role;
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired authorization token." });
  }
}

export function authorizeRoles(...allowedRoles: Array<"user" | "vendor" | "admin">) {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!request.role || !allowedRoles.includes(request.role)) {
      response.status(403).json({ message: "You do not have permission to access this resource." });
      return;
    }

    next();
  };
}