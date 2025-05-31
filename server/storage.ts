import {
  users,
  posts,
  likes,
  shareLogs,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type PostWithDetails,
  type InsertLike,
  type InsertShareLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost & { userId: string }): Promise<Post>;
  getPosts(limit?: number, offset?: number): Promise<PostWithDetails[]>;
  getPost(id: number): Promise<PostWithDetails | undefined>;
  deletePost(id: number, userId: string): Promise<boolean>;
  
  // Like operations
  toggleLike(postId: number, userId: string): Promise<{ isLiked: boolean; likesCount: number }>;
  
  // Share operations
  logShare(shareData: InsertShareLog): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // Post operations
  async createPost(postData: InsertPost & { userId: string }): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async getPosts(limit = 20, offset = 0): Promise<PostWithDetails[]> {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        description: posts.description,
        hashtags: posts.hashtags,
        imageUrl: posts.imageUrl,
        link: posts.link,
        notifyEmail: posts.notifyEmail,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        likesCount: sql<number>`CAST(COUNT(${likes.id}) AS INTEGER)`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row,
      user: row.user!,
    }));
  }

  async getPost(id: number): Promise<PostWithDetails | undefined> {
    const [result] = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        description: posts.description,
        hashtags: posts.hashtags,
        imageUrl: posts.imageUrl,
        link: posts.link,
        notifyEmail: posts.notifyEmail,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        likesCount: sql<number>`CAST(COUNT(${likes.id}) AS INTEGER)`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .where(eq(posts.id, id))
      .groupBy(posts.id, users.id);

    if (!result) return undefined;

    return {
      ...result,
      user: result.user!,
    };
  }

  async deletePost(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Like operations
  async toggleLike(postId: number, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    // Check if like exists
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    if (existingLike) {
      // Remove like
      await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    } else {
      // Add like
      await db
        .insert(likes)
        .values({ postId, userId });
    }

    // Get updated likes count
    const [{ likesCount }] = await db
      .select({
        likesCount: sql<number>`CAST(COUNT(${likes.id}) AS INTEGER)`,
      })
      .from(likes)
      .where(eq(likes.postId, postId));

    return {
      isLiked: !existingLike,
      likesCount,
    };
  }

  // Share operations
  async logShare(shareData: InsertShareLog): Promise<void> {
    await db.insert(shareLogs).values(shareData);
  }
}

export const storage = new DatabaseStorage();
