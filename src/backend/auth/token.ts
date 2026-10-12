import jwt from "jsonwebtoken";
import { config } from "../config";
import { SafeUser } from "../database/types";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  sessionId?: string;
}

export function generateToken(user: SafeUser, sessionId?: string): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    sessionId
  };

  return jwt.sign(payload, config.authSecret, {
    expiresIn: config.jwtExpiresIn as any
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.authSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
