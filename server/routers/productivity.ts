import { and, desc, eq, like, sql } from "drizzle-orm";
import { z } from "zod";
import { activityLogs, calendarEvents, notes, tasks, userSettings, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const taskInput = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(4000).optional(),
  category: z.string().trim().min(1).max(80).default("General"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  deadline: z.date().nullable().optional(),
});

const noteInput = z.object({
  title: z.string().trim().min(1).max(180),
  subject: z.string().trim().min(1).max(100).default("General"),
  content: z.string().trim().min(1).max(20000),
  tags: z.string().trim().max(500).default(""),
});

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("The secure data service is currently unavailable.");
  return db;
}

async function logActivity(userId: number, activityType: string, subject?: string | null, durationMinutes = 0) {
  const db = await dbOrThrow();
  await db.insert(activityLogs).values({ userId, activityType, subject: subject || null, durationMinutes });
}

export const productivityRouter = router({
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      const profile = await db.select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return profile[0];
    }),
    updateName: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(users).set({ name: input.name }).where(eq(users.id, ctx.user.id));
      return { success: true, name: input.name };
    }),
    uploadAvatar: protectedProcedure.input(z.object({ filename: z.string().trim().min(1).max(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(1).max(3000000) })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      if (!buffer.byteLength || buffer.byteLength > 2 * 1024 * 1024) throw new Error("Profile images must be between 1 byte and 2 MB.");
      const extension = input.filename.toLowerCase().split(".").pop();
      if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) throw new Error("Use a JPG, PNG, or WEBP profile image.");
      const upload = await storagePut(`${ctx.user.id}/avatars/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`, buffer, input.mimeType);
      const db = await dbOrThrow();
      await db.update(users).set({ avatarKey: upload.key, avatarUrl: upload.url }).where(eq(users.id, ctx.user.id));
      return { url: upload.url };
    }),
  }),
  activity: router({
    list: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(90).default(30) })).query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      return db.select().from(activityLogs).where(eq(activityLogs.userId, ctx.user.id)).orderBy(desc(activityLogs.createdAt)).limit(input.limit);
    }),
    logStudy: protectedProcedure.input(z.object({ subject: z.string().trim().min(1).max(120), durationMinutes: z.number().int().min(5).max(720) })).mutation(async ({ ctx, input }) => {
      await logActivity(ctx.user.id, "study_session", input.subject, input.durationMinutes);
      return { success: true };
    }),
  }),
  tasks: router({
    list: protectedProcedure.input(z.object({ filter: z.enum(["all", "today", "upcoming", "completed"]).default("all") })).query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const all = await db.select().from(tasks).where(eq(tasks.userId, ctx.user.id)).orderBy(desc(tasks.createdAt));
      if (input.filter === "completed") return all.filter((task) => task.status === "completed");
      if (input.filter === "today") {
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return all.filter((task) => task.deadline && task.deadline <= end && task.status !== "completed");
      }
      if (input.filter === "upcoming") return all.filter((task) => task.deadline && task.deadline > new Date() && task.status !== "completed");
      return all;
    }),
    create: protectedProcedure.input(taskInput).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const completed = input.status === "completed";
      const result = await db.insert(tasks).values({ ...input, userId: ctx.user.id, completedAt: completed ? new Date() : null });
      await logActivity(ctx.user.id, "task_created", input.category);
      return { id: result[0].insertId };
    }),
    update: protectedProcedure.input(taskInput.partial().extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const { id, ...patch } = input;
      const values: Record<string, unknown> = { ...patch };
      if (patch.status === "completed") values.completedAt = new Date();
      if (patch.status && patch.status !== "completed") values.completedAt = null;
      await db.update(tasks).set(values).where(and(eq(tasks.id, id), eq(tasks.userId, ctx.user.id)));
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.delete(tasks).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
      return { success: true };
    }),
    toggle: protectedProcedure.input(z.object({ id: z.number().int().positive(), complete: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(tasks).set({ status: input.complete ? "completed" : "pending", completedAt: input.complete ? new Date() : null }).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
      if (input.complete) await logActivity(ctx.user.id, "task_completed");
      return { success: true };
    }),
  }),
  notes: router({
    list: protectedProcedure.input(z.object({ query: z.string().trim().max(180).default("") })).query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const condition = input.query ? and(eq(notes.userId, ctx.user.id), like(notes.title, `%${input.query}%`)) : eq(notes.userId, ctx.user.id);
      return db.select().from(notes).where(condition).orderBy(desc(notes.updatedAt));
    }),
    create: protectedProcedure.input(noteInput).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(notes).values({ ...input, userId: ctx.user.id });
      await logActivity(ctx.user.id, "note_created", input.subject);
      return { id: result[0].insertId };
    }),
    update: protectedProcedure.input(noteInput.partial().extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const { id, ...values } = input;
      await db.update(notes).set(values).where(and(eq(notes.id, id), eq(notes.userId, ctx.user.id)));
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.delete(notes).where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  calendar: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      return db.select().from(calendarEvents).where(eq(calendarEvents.userId, ctx.user.id)).orderBy(calendarEvents.startsAt);
    }),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(180), category: z.enum(["task", "study", "exam", "deadline", "other"]), startsAt: z.date(), durationMinutes: z.number().int().min(15).max(720).default(60), notes: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const result = await db.insert(calendarEvents).values({ ...input, userId: ctx.user.id });
      await logActivity(ctx.user.id, input.category === "study" ? "study_session" : "calendar_event", null, input.category === "study" ? input.durationMinutes : 0);
      return { id: result[0].insertId };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.delete(calendarEvents).where(and(eq(calendarEvents.id, input.id), eq(calendarEvents.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      const result = await db.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      if (result[0]) return result[0];
      await db.insert(userSettings).values({ userId: ctx.user.id });
      const created = await db.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      return created[0];
    }),
    update: protectedProcedure.input(z.object({ theme: z.enum(["dark", "light", "system"]).optional(), notificationsEnabled: z.enum(["yes", "no"]).optional(), reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), aiResponseStyle: z.enum(["concise", "balanced", "detailed"]).optional(), preferredDifficulty: z.enum(["easy", "medium", "hard"]).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.insert(userSettings).values({ userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: input });
      return { success: true };
    }),
  }),
});
