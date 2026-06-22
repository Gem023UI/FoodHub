import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  role: "user" | "vendor" | "admin";
}

export function signAccessToken(payload: AccessTokenPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  return jwt.verify(token, secret) as AccessTokenPayload;
}