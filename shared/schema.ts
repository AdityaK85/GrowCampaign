import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  hashtags: text("hashtags"), // comma-separated string
  imageUrl: text("image_url").notNull(),
  link: text("link"),
  notifyEmail: varchar("notify_email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Share logs table
export const shareLogs = pgTable("share_logs", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: varchar("user_id").references(() => users.id), // nullable for anonymous shares
  shareType: varchar("share_type", { length: 50 }).notNull(), // 'copy_link', 'external', etc.
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  likes: many(likes),
  shareLogs: many(shareLogs),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  likes: many(likes),
  shareLogs: many(shareLogs),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

export const shareLogsRelations = relations(shareLogs, ({ one }) => ({
  post: one(posts, {
    fields: [shareLogs.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [shareLogs.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  hashtags: z.string().optional(),
  notifyEmail: z.string().email().optional().or(z.literal("")),
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertShareLogSchema = createInsertSchema(shareLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type ShareLog = typeof shareLogs.$inferSelect;
export type InsertShareLog = z.infer<typeof insertShareLogSchema>;

// Extended types for API responses
export type PostWithDetails = Post & {
  user: User;
  likesCount: number;
  isLiked?: boolean;
};
