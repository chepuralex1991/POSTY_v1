import {
  mailItems,
  users,
  userSettings,
  type MailItem,
  type InsertMailItem,
  type User,
  type InsertUser,
  type UpsertUser,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // User settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<UserSettings | undefined>;
  
  // Profile methods
  updateUserProfile(userId: string, updates: { firstName?: string; lastName?: string; email?: string }): Promise<User | undefined>;
  changeUserPassword(userId: string, hashedPassword: string): Promise<boolean>;
  deleteUserAccount(userId: string): Promise<boolean>;
  
  // Mail item methods (now user-scoped)
  getAllMailItems(userId: string): Promise<MailItem[]>;
  getMailItem(id: number, userId: string): Promise<MailItem | undefined>;
  createMailItem(mailItem: InsertMailItem): Promise<MailItem>;
  updateMailItem(id: number, userId: string, updates: Partial<InsertMailItem>): Promise<MailItem | undefined>;
  deleteMailItem(id: number, userId: string): Promise<boolean>;
  deleteAllMailItems(userId: string): Promise<number>;
  searchMailItems(query: string, userId: string): Promise<MailItem[]>;
  getMailItemsByCategory(category: string, userId: string): Promise<MailItem[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // User settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(settingsData)
      .returning();
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<UserSettings | undefined> {
    const [updated] = await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Mail item methods (now user-scoped)
  async getAllMailItems(userId: string): Promise<MailItem[]> {
    return await db
      .select()
      .from(mailItems)
      .where(eq(mailItems.userId, userId))
      .orderBy(desc(mailItems.uploadDate));
  }

  async getMailItem(id: number, userId: string): Promise<MailItem | undefined> {
    const [item] = await db
      .select()
      .from(mailItems)
      .where(and(eq(mailItems.id, id), eq(mailItems.userId, userId)));
    return item || undefined;
  }

  async createMailItem(insertMailItem: InsertMailItem): Promise<MailItem> {
    const [item] = await db
      .insert(mailItems)
      .values(insertMailItem)
      .returning();
    return item;
  }

  async updateMailItem(id: number, userId: string, updates: Partial<InsertMailItem>): Promise<MailItem | undefined> {
    const [updated] = await db
      .update(mailItems)
      .set(updates)
      .where(and(eq(mailItems.id, id), eq(mailItems.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteMailItem(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(mailItems)
      .where(and(eq(mailItems.id, id), eq(mailItems.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async deleteAllMailItems(userId: string): Promise<number> {
    const result = await db.delete(mailItems).where(eq(mailItems.userId, userId));
    return result.rowCount || 0;
  }

  async searchMailItems(query: string, userId: string): Promise<MailItem[]> {
    return await db
      .select()
      .from(mailItems)
      .where(
        and(
          eq(mailItems.userId, userId),
          or(
            ilike(mailItems.title, `%${query}%`),
            ilike(mailItems.summary, `%${query}%`),
            ilike(mailItems.category, `%${query}%`),
            ilike(mailItems.extractedText, `%${query}%`)
          )
        )
      )
      .orderBy(desc(mailItems.uploadDate));
  }

  async getMailItemsByCategory(category: string, userId: string): Promise<MailItem[]> {
    return await db
      .select()
      .from(mailItems)
      .where(and(eq(mailItems.category, category), eq(mailItems.userId, userId)))
      .orderBy(desc(mailItems.uploadDate));
  }

  // Profile methods
  async updateUserProfile(userId: string, updates: { firstName?: string; lastName?: string; email?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async changeUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return result.rowCount > 0;
  }

  async deleteUserAccount(userId: string): Promise<boolean> {
    // Delete user (cascades to mail items and settings)
    const result = await db
      .delete(users)
      .where(eq(users.id, userId));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
