import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "Faa+1bDnl4+mFyrr9W2R3sL50LrLOq1EHOtqELANAFU=";
const JWT_EXPIRES_IN = "7d";

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token management
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      provider: user.provider 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export async function authenticateToken(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  // Try to get token from Authorization header (Bearer token) or HttpOnly cookie
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.auth_token;
  
  const token = bearerToken || cookieToken;

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Helper function to set secure HttpOnly cookie
export function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

// Helper function to clear auth cookie
export function clearAuthCookie(res: Response): void {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
}

// Generate user ID for different providers
export function generateUserId(provider: string, providerId?: string, email?: string): string {
  if (provider === "email" && email) {
    return `email_${email.replace("@", "_").replace(".", "_")}`;
  }
  if (providerId) {
    return `${provider}_${providerId}`;
  }
  return `${provider}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

// OAuth state management for CSRF protection
const oauthStates = new Map<string, { timestamp: number }>();

export function generateOAuthState(): string {
  const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
  oauthStates.set(state, { timestamp: Date.now() });
  
  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of oauthStates.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      oauthStates.delete(key);
    }
  }
  
  return state;
}

export function verifyOAuthState(state: string): boolean {
  const stateInfo = oauthStates.get(state);
  if (!stateInfo) return false;
  
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (stateInfo.timestamp < fiveMinutesAgo) {
    oauthStates.delete(state);
    return false;
  }
  
  oauthStates.delete(state);
  return true;
}