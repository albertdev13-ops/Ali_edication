import { pgTable, text, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Conversations
export const conversationsTable = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("New Conversation"),
  model: text("model").notNull().default("groq"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;

// Chat Messages
export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversationsTable.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // user | assistant | system
  content: text("content").notNull(),
  model: text("model"),
  fromCache: boolean("from_cache").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;

// Memory Cache (stores AI responses for reuse)
export const memoryCacheTable = pgTable("memory_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptHash: text("prompt_hash").notNull().unique(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  model: text("model").notNull().default("groq"),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
});

export const insertMemoryCacheSchema = createInsertSchema(memoryCacheTable).omit({ id: true, createdAt: true, lastAccessedAt: true });
export type InsertMemoryCache = z.infer<typeof insertMemoryCacheSchema>;
export type MemoryCache = typeof memoryCacheTable.$inferSelect;

// Settings
export const settingsTable = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  defaultModel: text("default_model").notNull().default("groq"),
  defaultVoiceId: text("default_voice_id").notNull().default("fr-FR-HenriNeural"),
  streamingEnabled: boolean("streaming_enabled").notNull().default(true),
  autoSave: boolean("auto_save").notNull().default(true),
  systemPrompt: text("system_prompt").notNull().default("Tu es un assistant IA avancé, expert en code, analyse, et création. Tu réponds toujours avec précision et professionnalisme."),
  fontSize: text("font_size").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Settings = typeof settingsTable.$inferSelect;

// Generated Files tracking
export const generatedFilesTable = pgTable("generated_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // pdf | zip
  filePath: text("file_path").notNull(),
  size: integer("size").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGeneratedFileSchema = createInsertSchema(generatedFilesTable).omit({ id: true, createdAt: true });
export type InsertGeneratedFile = z.infer<typeof insertGeneratedFileSchema>;
export type GeneratedFile = typeof generatedFilesTable.$inferSelect;
