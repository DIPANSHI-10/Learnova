import { int, json, mysqlEnum, mysqlTable, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarKey: varchar("avatarKey", { length: 500 }),
  avatarUrl: varchar("avatarUrl", { length: 700 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 80 }).default("General").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  subject: varchar("subject", { length: 100 }).default("General").notNull(),
  content: text("content").notNull(),
  tags: varchar("tags", { length: 500 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 700 }).notNull(),
  extractedText: text("extractedText").notNull(),
  fileSize: int("fileSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const studyPlans = mysqlTable("studyPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 120 }).notNull(),
  topics: text("topics").notNull(),
  examDate: timestamp("examDate"),
  availableHours: int("availableHours").default(1).notNull(),
  preferredTime: varchar("preferredTime", { length: 80 }).default("Flexible").notNull(),
  knowledgeLevel: varchar("knowledgeLevel", { length: 80 }).default("Developing").notNull(),
  planData: json("planData").notNull(),
  progress: int("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: varchar("conversationId", { length: 100 }).default("primary").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 180 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  questionType: mysqlEnum("questionType", ["mcq", "true_false"]).default("mcq").notNull(),
  questions: json("questions").notNull(),
  answers: json("answers"),
  score: int("score"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const flashcards = mysqlTable("flashcards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 180 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  status: mysqlEnum("status", ["new", "known", "review"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["task", "study", "exam", "deadline", "other"]).default("other").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  durationMinutes: int("durationMinutes").default(60).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activityType", { length: 80 }).notNull(),
  subject: varchar("subject", { length: 120 }),
  durationMinutes: int("durationMinutes").default(0).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: mysqlEnum("theme", ["dark", "light", "system"]).default("dark").notNull(),
  notificationsEnabled: mysqlEnum("notificationsEnabled", ["yes", "no"]).default("yes").notNull(),
  reminderTime: varchar("reminderTime", { length: 10 }).default("18:00").notNull(),
  aiResponseStyle: mysqlEnum("aiResponseStyle", ["concise", "balanced", "detailed"]).default("balanced").notNull(),
  preferredDifficulty: mysqlEnum("preferredDifficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [unique("userSettings_userId_unique").on(table.userId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
