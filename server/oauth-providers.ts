import type { Request, Response } from "express";
import { generateUserId, generateOAuthState, verifyOAuthState, generateToken, setAuthCookie } from "./auth";
import { storage } from "./storage";
import type { UpsertUser } from "@shared/schema";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  "https://mail-smart-chepuralex1991.replit.app/api/auth/google/callback";

// Apple OAuth configuration
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
const APPLE_REDIRECT_URI = process.env.APPLE_REDIRECT_URI || "http://localhost:5000/api/auth/apple/callback";

// Google OAuth implementation
export async function initiateGoogleAuth(req: Request, res: Response): Promise<void> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("Google OAuth credentials missing");
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  const state = generateOAuthState();
  const scope = "openid profile email";
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${state}`;

  console.log("Google OAuth initiated with redirect URI:", GOOGLE_REDIRECT_URI);
  
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });
  
  res.redirect(googleAuthUrl);
}

export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query;
  const storedState = req.cookies.oauth_state;

  console.log("Google OAuth callback received:", { 
    hasCode: !!code, 
    hasState: !!state, 
    hasStoredState: !!storedState,
    error 
  });

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect('/?error=oauth_denied');
  }

  if (!code || !state || !storedState || state !== storedState) {
    console.error('Invalid OAuth state:', { code: !!code, state, storedState });
    return res.redirect('/?error=invalid_state');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code: code as string,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    // Get user profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    // Create or update user
    const userData: UpsertUser = {
      id: generateUserId("google", profile.id),
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      profileImageUrl: profile.picture,
      provider: "google",
      providerId: profile.id,
      emailVerified: profile.verified_email,
    };

    const user = await storage.upsertUser(userData);

    // Create default settings for new users
    const existingSettings = await storage.getUserSettings(user.id);
    if (!existingSettings) {
      await storage.createUserSettings({
        userId: user.id,
        theme: "light",
        notifications: true,
      });
    }

    // Generate JWT token and set secure cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // Redirect to frontend with success indicator
    res.redirect(`/?auth=success&provider=google`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect("/?error=oauth_failed");
  }
}

// Apple OAuth implementation
export async function initiateAppleAuth(req: Request, res: Response): Promise<void> {
  if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    res.status(500).json({ error: "Apple OAuth not configured" });
    return;
  }

  const state = generateOAuthState();
  const scope = "name email";
  
  const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
    `client_id=${APPLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(APPLE_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `response_mode=form_post&` +
    `state=${state}`;

  res.redirect(appleAuthUrl);
}

export async function handleAppleCallback(req: Request, res: Response): Promise<void> {
  const { code, state, user } = req.body;

  if (!code || !state || !verifyOAuthState(state)) {
    res.status(400).json({ error: "Invalid OAuth state or missing authorization code" });
    return;
  }

  try {
    // Apple's implementation requires JWT for client authentication
    // This is a simplified version - in production, implement full Apple Sign In
    const userInfo = user ? JSON.parse(user) : null;
    
    // For now, we'll create a basic user from the available data
    const userData: UpsertUser = {
      id: generateUserId("apple", code),
      email: userInfo?.email,
      firstName: userInfo?.name?.firstName,
      lastName: userInfo?.name?.lastName,
      provider: "apple",
      providerId: code,
      emailVerified: true, // Apple verifies emails
    };

    const dbUser = await storage.upsertUser(userData);

    // Create default settings for new users
    const existingSettings = await storage.getUserSettings(dbUser.id);
    if (!existingSettings) {
      await storage.createUserSettings({
        userId: dbUser.id,
        theme: "light",
        notifications: true,
      });
    }

    const token = generateToken(dbUser);
    setAuthCookie(res, token);
    res.redirect(`/?auth=success&provider=apple`);
  } catch (error) {
    console.error("Apple OAuth error:", error);
    res.redirect("/?error=oauth_failed");
  }
}

// Email authentication helpers
export async function createEmailUser(email: string, password: string, firstName: string, lastName: string): Promise<{ user: any; token: string }> {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);
  
  const userData: UpsertUser = {
    id: generateUserId("email", undefined, email),
    email,
    firstName,
    lastName,
    provider: "email",
    passwordHash,
    emailVerified: false,
  };

  const user = await storage.upsertUser(userData);

  // Create default settings
  await storage.createUserSettings({
    userId: user.id,
    theme: "light",
    notifications: true,
  });

  const token = generateToken(user);
  return { user, token };
}

export async function authenticateEmailUser(email: string, password: string): Promise<{ user: any; token: string } | null> {
  const user = await storage.getUserByEmail(email);
  
  if (!user || user.provider !== "email" || !user.passwordHash) {
    return null;
  }

  const bcrypt = await import("bcryptjs");
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValidPassword) {
    return null;
  }

  const token = generateToken(user);
  return { user, token };
}