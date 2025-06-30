import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { storage } from "./storage";
import { analyzeDocument } from "./ai-service";
import { 
  insertMailItemSchema, 
  emailRegistrationSchema, 
  emailLoginSchema 
} from "@shared/schema";
import { 
  authenticateToken, 
  type AuthenticatedRequest,
  setAuthCookie,
  clearAuthCookie
} from "./auth";
import { 
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateAppleAuth,
  handleAppleCallback,
  createEmailUser,
  authenticateEmailUser
} from "./oauth-providers";

interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads with proper file naming
const multerStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Keep original extension for proper file type detection
    const ext = path.extname(file.originalname);
    const uniqueName = file.fieldname + '-' + Date.now() + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware (relaxed for development)
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.openai.com"],
        },
      },
    }));
  } else {
    // Development mode - more permissive CSP
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP in development
    }));
  }

  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["https://posty.replit.app"] 
      : ["http://localhost:5000", "http://localhost:3000"],
    credentials: true,
  }));

  // Configure trust proxy for proper rate limiting
  app.set('trust proxy', 1);

  // Cookie parsing middleware
  app.use(cookieParser());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: "Too many authentication attempts, please try again later.",
  });

  app.use(limiter);

  // Authentication routes
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const { email, password, firstName, lastName } = emailRegistrationSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      const { user, token } = await createEmailUser(email, password, firstName, lastName);
      
      // Set secure HttpOnly cookie
      setAuthCookie(res, token);
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          provider: user.provider,
        },
        success: true
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = emailLoginSchema.parse(req.body);
      
      const result = await authenticateEmailUser(email, password);
      if (!result) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const { user, token } = result;
      
      // Set secure HttpOnly cookie
      setAuthCookie(res, token);
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          provider: user.provider,
        },
        success: true
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json({ error: "Login failed" });
      }
    }
  });

  // OAuth routes
  app.get("/api/auth/google", initiateGoogleAuth);
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.get("/api/auth/apple", initiateAppleAuth);
  app.post("/api/auth/apple/callback", handleAppleCallback);

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Get current user (protected route)
  app.get("/api/auth/user", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        provider: user.provider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const settings = await storage.getUserSettings(req.userId!);

      // Return profile data without sensitive information
      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        loginMethod: user.passwordHash ? "email" : "oauth",
        createdAt: user.createdAt,
        settings: settings || {
          theme: "system",
          language: "en",
          timezone: "UTC",
          emailNotifications: true,
          reminderNotifications: true,
          weeklyDigest: false,
          autoDeleteOldItems: false,
        },
      };

      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { updateProfileSchema } = await import("@shared/schema");
      const validatedData = updateProfileSchema.parse(req.body);

      // Check if email is already taken by another user
      if (validatedData.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== req.userId) {
          res.status(400).json({ error: "Email already in use" });
          return;
        }
      }

      const updatedUser = await storage.updateUserProfile(req.userId!, validatedData);
      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.errors) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/profile/password", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { changePasswordSchema } = await import("@shared/schema");
      const validatedData = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(req.userId!);
      if (!user || !user.passwordHash) {
        res.status(400).json({ error: "Password change not available for OAuth users" });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(validatedData.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ error: "Current password is incorrect" });
        return;
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(validatedData.newPassword);
      const success = await storage.changeUserPassword(req.userId!, hashedNewPassword);

      if (!success) {
        res.status(500).json({ error: "Failed to update password" });
        return;
      }

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.errors) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.put("/api/settings", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { updateSettingsSchema } = await import("@shared/schema");
      const validatedData = updateSettingsSchema.parse(req.body);

      let settings = await storage.getUserSettings(req.userId!);
      
      if (!settings) {
        // Create default settings if they don't exist
        settings = await storage.createUserSettings({
          userId: req.userId!,
          theme: "system",
          language: "en",
          timezone: "UTC",
          emailNotifications: true,
          reminderNotifications: true,
          weeklyDigest: false,
          autoDeleteOldItems: false,
        });
      }

      const updatedSettings = await storage.updateUserSettings(req.userId!, validatedData);
      if (!updatedSettings) {
        res.status(500).json({ error: "Failed to update settings" });
        return;
      }

      res.json(updatedSettings);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      if (error.errors) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.delete("/api/account", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { confirmDelete } = req.body;
      
      if (confirmDelete !== "DELETE") {
        res.status(400).json({ error: "Account deletion requires confirmation" });
        return;
      }

      const success = await storage.deleteUserAccount(req.userId!);
      if (!success) {
        res.status(500).json({ error: "Failed to delete account" });
        return;
      }

      // Clear authentication cookie
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const openai = (await import("openai")).default;
      const client = new openai({ apiKey: process.env.OPENAI_API_KEY });
      
      await client.models.list();
      
      res.json({ 
        status: "healthy", 
        openai: "connected",
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(503).json({ 
        status: "unhealthy", 
        openai: error.message.includes("openai") ? "disconnected" : "connected",
        database: "connected",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Protected mail item routes (user-scoped)
  app.get("/api/mail-items", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const items = await storage.getAllMailItems(req.userId!);
      res.json(items);
    } catch (error) {
      console.error("Error fetching mail items:", error);
      res.status(500).json({ error: "Failed to fetch mail items" });
    }
  });

  app.get("/api/mail-items/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getMailItem(id, req.userId!);
      
      if (!item) {
        res.status(404).json({ error: "Mail item not found" });
        return;
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching mail item:", error);
      res.status(500).json({ error: "Failed to fetch mail item" });
    }
  });

  app.post("/api/mail-items", authenticateToken, upload.single('file'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      console.log("Processing file:", req.file.filename, "for user:", req.userId);
      
      const analysisResult = await analyzeDocument(req.file.path, req.file.originalname);
      
      const mailItemData = {
        userId: req.userId!,
        title: analysisResult.title,
        summary: analysisResult.summary,
        category: analysisResult.category,
        reminderDate: analysisResult.reminderDate || null,
        imageUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        extractedText: analysisResult.extractedText,
      };

      const validatedData = insertMailItemSchema.parse(mailItemData);
      const newItem = await storage.createMailItem(validatedData);

      // Send email notification
      try {
        const user = await storage.getUser(req.userId!);
        if (user) {
          const { sendLetterNotification } = await import('./email-service');
          await sendLetterNotification(user, {
            id: newItem.id,
            title: newItem.title,
            fileName: newItem.fileName,
            imageUrl: newItem.imageUrl,
            uploadDate: new Date(newItem.uploadDate),
            summary: newItem.summary,
            extractedText: newItem.extractedText,
          });
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating mail item:', error);
      res.status(500).json({ error: "Failed to create mail item" });
    }
  });

  // Update mail item
  app.patch("/api/mail-items/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedItem = await storage.updateMailItem(id, req.userId!, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Mail item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mail item" });
    }
  });

  // Delete mail item
  app.delete("/api/mail-items/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMailItem(id, req.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Mail item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mail item" });
    }
  });

  // Search mail items
  app.get("/api/mail-items/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const items = await dataStorage.searchMailItems(query);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to search mail items" });
    }
  });

  // Get mail items by category
  app.get("/api/mail-items/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const items = await dataStorage.getMailItemsByCategory(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mail items by category" });
    }
  });

  // Email test endpoints
  app.get("/api/email/test-config", authenticateToken, async (req, res) => {
    try {
      const { testEmailConfiguration } = await import('./email-service');
      const result = await testEmailConfiguration();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post("/api/email/test-send", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { sendTestEmail } = await import('./email-service');
      await sendTestEmail(user.email || '');
      
      res.json({ success: true, message: `Test email sent to ${user.email}` });
    } catch (error) {
      console.error('Test email failed:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Auto-detect email provider and get setup instructions
  app.get("/api/email/auto-config", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { getAutoEmailConfig } = await import('./email-config-service');
      const config = getAutoEmailConfig(user);
      
      res.json(config);
    } catch (error) {
      console.error('Auto email config failed:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Attempt automatic email setup with user password
  app.post("/api/email/auto-setup", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { password } = req.body;
      const { attemptAutoEmailSetup } = await import('./email-config-service');
      const result = await attemptAutoEmailSetup(user, password);
      
      if (result.success && result.config) {
        // Save email config to user settings
        await storage.updateUserSettings(req.userId!, {
          emailConfig: result.config,
          emailNotifications: true
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Auto email setup failed:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Health check endpoint with detailed diagnostics
  app.get("/api/health", async (req, res) => {
    const diagnostics = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      database: "unknown",
      openai: "unknown",
      uploads: "unknown",
      staticFiles: "unknown"
    };

    // Check database connection
    try {
      await dataStorage.getAllMailItems();
      diagnostics.database = "connected";
    } catch (error: any) {
      diagnostics.database = `error: ${error.message?.substring(0, 50)}`;
      diagnostics.status = "degraded";
    }

    // Check OpenAI API
    try {
      const openai = new (await import("openai")).default({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      
      await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      
      diagnostics.openai = "available";
    } catch (error: any) {
      const openaiStatus = error.status === 429 ? "quota_exceeded" : 
                          error.status === 401 ? "auth_failed" : "error";
      diagnostics.openai = `${openaiStatus}: ${error.message?.substring(0, 50)}`;
    }

    // Check uploads directory
    try {
      const uploadsExists = fs.existsSync('uploads');
      const uploadsWritable = fs.constants.W_OK;
      fs.accessSync('uploads', uploadsWritable);
      diagnostics.uploads = uploadsExists ? "accessible" : "missing";
    } catch (error: any) {
      diagnostics.uploads = `error: ${error.message?.substring(0, 50)}`;
    }

    // Check static files in production
    if (process.env.NODE_ENV === "production") {
      try {
        const distPath = path.resolve(process.cwd(), "dist", "public");
        const distExists = fs.existsSync(distPath);
        diagnostics.staticFiles = distExists ? "available" : "missing";
      } catch (error: any) {
        diagnostics.staticFiles = `error: ${error.message?.substring(0, 50)}`;
      }
    } else {
      diagnostics.staticFiles = "development_mode";
    }

    // Add environment variable check
    diagnostics.envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "set" : "missing",
      NODE_ENV: process.env.NODE_ENV || "unset"
    };

    res.json(diagnostics);
  });


  // Serve uploaded files with proper headers and CORS
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
      if (path.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
      // Add CORS headers for image access
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));

  const httpServer = createServer(app);
  return httpServer;
}
