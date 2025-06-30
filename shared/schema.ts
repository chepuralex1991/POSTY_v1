import { pgTable, text, serial, integer, timestamp, varchar, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  provider: varchar("provider").notNull(), // 'google', 'apple', 'email'
  providerId: varchar("provider_id"),
  passwordHash: text("password_hash"), // only for email auth
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for secure authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Updated mail items table with user association and security
export const mailItems = pgTable("mail_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  category: text("category").notNull(),
  reminderDate: text("reminder_date"),
  imageUrl: text("image_url").notNull(),
  fileName: text("file_name").notNull(),
  extractedText: text("extracted_text"),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
}, (table) => [
  index("idx_mail_items_user_id").on(table.userId),
  index("idx_mail_items_category").on(table.category),
  index("idx_mail_items_upload_date").on(table.uploadDate),
]);

// User settings table
export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).primaryKey(),
  theme: varchar("theme").default("system"),
  language: varchar("language").default("en"),
  timezone: varchar("timezone").default("UTC"),
  emailNotifications: boolean("email_notifications").default(true),
  reminderNotifications: boolean("reminder_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(false),
  autoDeleteOldItems: boolean("auto_delete_old_items").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  mailItems: many(mailItems),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const mailItemsRelations = relations(mailItems, ({ one }) => ({
  user: one(users, {
    fields: [mailItems.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Schema validation for inserts
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertMailItemSchema = createInsertSchema(mailItems).omit({
  id: true,
  uploadDate: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email format"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  reminderNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  autoDeleteOldItems: z.boolean().optional(),
});

// Email registration schema with validation
export const emailRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Email login schema
export const emailLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// User upsert schema for OAuth providers
export const upsertUserSchema = insertUserSchema.partial().extend({
  id: z.string(),
  email: z.string().email().optional(),
  provider: z.string(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertMailItem = z.infer<typeof insertMailItemSchema>;
export type MailItem = typeof mailItems.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type EmailRegistration = z.infer<typeof emailRegistrationSchema>;
export type EmailLogin = z.infer<typeof emailLoginSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

export const categories = [
  "bill",
  "appointment", 
  "personal",
  "promotional",
  "government",
  "insurance",
  "nhs"
] as const;

export type Category = typeof categories[number];
