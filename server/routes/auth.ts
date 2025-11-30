import type { Express } from "express";
import { storage } from "../storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";
import crypto from "crypto";

// Simple password hashing (for development - use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function registerAuthRoutes(app: Express) {
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Create user with hashed password
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: role || 'BARISTA',
        approved: false, // New users need admin approval
      });

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Get user by email
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (user.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const foundUser = user[0];

      // Check if user has a password set
      if (!foundUser.password) {
        return res.status(401).json({ error: "Password not set. Please contact admin." });
      }

      // Verify password
      if (!verifyPassword(password, foundUser.password)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session
      (req.session as any).userId = foundUser.id;
      (req.session as any).userRole = foundUser.role;

      res.json({ user: { ...foundUser, password: undefined } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get user" });
    }
  });
}

