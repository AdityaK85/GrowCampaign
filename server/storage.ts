import {
  users,
  posts,
  likes,
  shareLogs,
  notifications,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type PostWithDetails,
  type InsertLike,
  type InsertShareLog,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, like } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost & { userId: string }): Promise<Post>;
  getPosts(limit?: number, offset?: number, search?: string): Promise<PostWithDetails[]>;
  getPost(id: number): Promise<PostWithDetails | undefined>;
  deletePost(id: number, userId: string): Promise<boolean>;
  
  // Like operations
  toggleLike(postId: number, userId: string): Promise<{ isLiked: boolean; likesCount: number }>;
  
  // Share operations
  logShare(shareData: InsertShareLog): Promise<void>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number, userId: string): Promise<boolean>;
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

  async getPosts(limit = 20, offset = 0, search?: string): Promise<PostWithDetails[]> {
    let baseQuery = db
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
      .leftJoin(likes, eq(posts.id, likes.postId));

    if (search) {
      baseQuery = baseQuery.where(
        or(
          like(posts.title, `%${search}%`),
          like(posts.description, `%${search}%`),
          like(posts.hashtags, `%${search}%`)
        )
      );
    }

    const result = await baseQuery
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row,
      user: row.user!,
    }));
  }

  async getPostsByUserId(
      userId: string,
      limit = 20,
      offset = 0,
      search?: string
    ): Promise<PostWithDetails[]> {
      let baseQuery = db
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
        .where(eq(posts.userId, userId)); // Filter by userId

      if (search) {
        baseQuery = baseQuery.where(
          and(
            eq(posts.userId, userId),
            or(
              like(posts.title, `%${search}%`),
              like(posts.description, `%${search}%`),
              like(posts.hashtags, `%${search}%`)
            )
          )
        );
      }

      const result = await baseQuery
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
    // First, delete likes associated with the post
    const likesDeleteResult = await db
      .delete(likes)
      .where(eq(likes.postId, id));

    // Now, delete the post itself
    const postDeleteResult = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));

    // If both the post and likes are deleted, return true
    return (likesDeleteResult.rowCount ?? 0) > 0 || (postDeleteResult.rowCount ?? 0) > 0;
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
