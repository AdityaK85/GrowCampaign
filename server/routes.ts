import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertShareLogSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });
  app.use("/uploads", express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const posts = await storage.getPosts(limit, offset, search);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Post routes
  app.get("/api/my_post", async (req, res) => {
    try {
      const userIdParam = req.query.userId;
      const user_id = typeof userIdParam === 'string' ? userIdParam : '';
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const posts = await storage.getPostsByUserId(user_id, limit, offset, search);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/trending_hashtags", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const trendingHashtags = await storage.getTrendingHashtags(limit);
      res.json(trendingHashtags);
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
      res.status(500).json({ message: "Failed to fetch trending hashtags" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userIdParam = req.query.userId;

      const userId = typeof userIdParam === 'string' ? userIdParam : null;
      if (!userId) {
        return res.status(400).json({ message: "Missing or invalid userId" });
      }

      // Optional: Check if the post exists
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Perform the deletion with user check
      const deleted = await storage.deletePost(id, userId);
      if (!deleted) {
        return res.status(403).json({ message: "You are not authorized to delete this post" });
      }

      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/posts", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub;
      const userId = req.user?.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const newPath = path.join(uploadDir, fileName);
      
      // Move file to final location
      fs.renameSync(req.file.path, newPath);
      
      const imageUrl = `/uploads/${fileName}`;
      
      // Validate request body
      const validatedData = insertPostSchema.parse({
        ...req.body,
        imageUrl,
      });

      const post = await storage.createPost({
        ...validatedData,
        userId,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub;
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      const success = await storage.deletePost(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like routes
  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub;
      const userId = req.user?.id;
      const postId = parseInt(req.params.id);
      
      const result = await storage.toggleLike(postId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Share routes
  app.post("/api/posts/:id/share", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req as any).user?.id || null;
      
      const shareData = insertShareLogSchema.parse({
        postId,
        userId,
        shareType: req.body.shareType || "copy_link",
        referrer: req.body.referrer,
      });

      await storage.logShare(shareData);
      
      const baseUrl = req.protocol + "://" + req.get("host");
      const shareUrl = `${baseUrl}/posts/${postId}?ref=growcampaign`;
      
      res.json({ shareUrl });
    } catch (error) {
      console.error("Error logging share:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log share" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
