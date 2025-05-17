import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Conversation History schema
export const conversationHistory = pgTable("conversation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversationHistory.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  modelUsed: text("model_used"),
  tokens: integer("tokens"),
  latency: integer("latency"),
});

// AI Request schema
export const aiRequests = pgTable("ai_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  modelType: text("model_type").notNull(), // primary, code, embeddings
  prompt: text("prompt").notNull(),
  context: jsonb("context"),
  maxTokens: integer("max_tokens").default(1000),
  temperature: text("temperature").default("0.7"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiRequestSchema = createInsertSchema(aiRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertAiRequest = z.infer<typeof insertAiRequestSchema>;
export type AiRequest = typeof aiRequests.$inferSelect;

// AI Response schema
export const aiResponses = pgTable("ai_responses", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => aiRequests.id),
  text: text("text").notNull(),
  modelUsed: text("model_used").notNull(),
  tokensUsed: integer("tokens_used"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiResponseSchema = createInsertSchema(aiResponses).omit({
  id: true,
  createdAt: true,
});

export type InsertAiResponse = z.infer<typeof insertAiResponseSchema>;
export type AiResponse = typeof aiResponses.$inferSelect;

// Model schemas and types for the frontend
export const modelRequestSchema = z.object({
  prompt: z.string(),
  modelType: z.enum(["primary", "code", "embeddings"]).default("primary"),
  context: z.record(z.any()).optional(),
  maxTokens: z.number().default(1000),
  temperature: z.number().default(0.7),
});

export type ModelRequest = z.infer<typeof modelRequestSchema>;

export const modelResponseSchema = z.object({
  text: z.string(),
  modelUsed: z.string(),
  tokensUsed: z.number(),
  latencyMs: z.number(),
});

export type ModelResponse = z.infer<typeof modelResponseSchema>;

// Conversation schema
export const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    timestamp: z.date(),
    modelUsed: z.string().optional(),
    tokens: z.number().optional(),
    latency: z.number().optional(),
  }))
});

export type Conversation = z.infer<typeof conversationSchema>;

// Message schema for UI
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.date(),
  modelUsed: z.string().optional(),
  tokens: z.number().optional(),
  latency: z.number().optional(),
});

export type Message = z.infer<typeof messageSchema>;

// Task type schema
export const taskTypeSchema = z.enum([
  "code_generation",
  "code_completion",
  "code_explanation",
  "general"
]);

export type TaskType = z.infer<typeof taskTypeSchema>;
