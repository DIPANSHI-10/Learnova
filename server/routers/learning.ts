import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { chatMessages, documents, flashcards, quizzes, studyPlans } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { buildStudyPlan, coachReply, createFlashcards, createQuiz, createSummary } from "../services/aiService";
import { extractDocumentText, validateDocument } from "../services/documentService";
import { protectedProcedure, router } from "../_core/trpc";

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("The secure data service is currently unavailable.");
  return db;
}

export const learningRouter = router({
  chat: router({
    list: protectedProcedure.input(z.object({ conversationId: z.string().trim().min(1).max(100).default("primary") })).query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      return db.select().from(chatMessages).where(and(eq(chatMessages.userId, ctx.user.id), eq(chatMessages.conversationId, input.conversationId))).orderBy(chatMessages.createdAt);
    }),
    send: protectedProcedure.input(z.object({ message: z.string().trim().min(1).max(4000), attachmentText: z.string().trim().max(10000).optional(), attachment: z.object({ filename: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(1).max(120), base64: z.string().min(1).max(7200000) }).optional(), conversationId: z.string().trim().min(1).max(100).default("primary") })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const history = await db.select().from(chatMessages).where(and(eq(chatMessages.userId, ctx.user.id), eq(chatMessages.conversationId, input.conversationId))).orderBy(desc(chatMessages.createdAt)).limit(8);
      let extractedAttachment = input.attachmentText;
      if (input.attachment) {
        const buffer = Buffer.from(input.attachment.base64, "base64");
        validateDocument(input.attachment.filename, input.attachment.mimeType, buffer.byteLength);
        extractedAttachment = await extractDocumentText(buffer, input.attachment.mimeType);
      }
      const enrichedMessage = extractedAttachment ? `${input.message}\n\nStudy material excerpt:\n${extractedAttachment.slice(0, 10000)}` : input.message;
      const response = await coachReply(enrichedMessage, history.reverse().map((item) => item.message));
      await db.insert(chatMessages).values([{ userId: ctx.user.id, conversationId: input.conversationId, role: "user", message: input.message }, { userId: ctx.user.id, conversationId: input.conversationId, role: "assistant", message: response }]);
      return { response };
    }),
    clear: protectedProcedure.input(z.object({ conversationId: z.string().trim().min(1).max(100).default("primary") })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.delete(chatMessages).where(and(eq(chatMessages.userId, ctx.user.id), eq(chatMessages.conversationId, input.conversationId)));
      return { success: true };
    }),
  }),
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      return db.select().from(documents).where(eq(documents.userId, ctx.user.id)).orderBy(desc(documents.createdAt));
    }),
    upload: protectedProcedure.input(z.object({ filename: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(1).max(120), base64: z.string().min(1).max(7200000) })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      validateDocument(input.filename, input.mimeType, buffer.byteLength);
      const extractedText = await extractDocumentText(buffer, input.mimeType);
      if (!extractedText.trim()) throw new Error("No readable text could be extracted from this file.");
      const upload = await storagePut(`${ctx.user.id}/documents/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`, buffer, input.mimeType);
      const db = await dbOrThrow();
      const result = await db.insert(documents).values({ userId: ctx.user.id, filename: input.filename, mimeType: input.mimeType, fileKey: upload.key, fileUrl: upload.url, extractedText, fileSize: buffer.byteLength });
      return { id: result[0].insertId, extractedCharacters: extractedText.length, extractedText };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.delete(documents).where(and(eq(documents.id, input.id), eq(documents.userId, ctx.user.id)));
      return { success: true };
    }),
    ask: protectedProcedure.input(z.object({ documentId: z.number().int().positive(), question: z.string().trim().min(1).max(1000) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const item = await db.select().from(documents).where(and(eq(documents.id, input.documentId), eq(documents.userId, ctx.user.id))).limit(1);
      if (!item[0]) throw new Error("Document not found.");
      return { response: await coachReply(`${input.question}\n\nStudy material excerpt:\n${item[0].extractedText.slice(0, 10000)}`) };
    }),
  }),
  planner: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      return db.select().from(studyPlans).where(eq(studyPlans.userId, ctx.user.id)).orderBy(desc(studyPlans.updatedAt));
    }),
    generate: protectedProcedure.input(z.object({ subject: z.string().trim().min(1).max(120), topics: z.string().trim().min(1).max(6000), examDate: z.date().nullable().optional(), availableHours: z.number().int().min(1).max(12), preferredTime: z.string().trim().min(1).max(80), knowledgeLevel: z.string().trim().min(1).max(80) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const planData = buildStudyPlan(input);
      const result = await db.insert(studyPlans).values({ ...input, userId: ctx.user.id, planData });
      return { id: result[0].insertId, planData };
    }),
    regenerate: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const existing = await db.select().from(studyPlans).where(and(eq(studyPlans.id, input.id), eq(studyPlans.userId, ctx.user.id))).limit(1);
      if (!existing[0]) throw new Error("Study plan not found.");
      const planData = buildStudyPlan(existing[0]);
      await db.update(studyPlans).set({ planData, progress: 0 }).where(and(eq(studyPlans.id, input.id), eq(studyPlans.userId, ctx.user.id)));
      return { planData };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), planData: z.array(z.object({ day: z.number(), focus: z.string(), duration: z.string(), complete: z.boolean() })), progress: z.number().int().min(0).max(100) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(studyPlans).set({ planData: input.planData, progress: input.progress }).where(and(eq(studyPlans.id, input.id), eq(studyPlans.userId, ctx.user.id)));
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.delete(studyPlans).where(and(eq(studyPlans.id, input.id), eq(studyPlans.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  quiz: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      return db.select().from(quizzes).where(eq(quizzes.userId, ctx.user.id)).orderBy(desc(quizzes.createdAt));
    }),
    generate: protectedProcedure.input(z.object({ topic: z.string().trim().min(1).max(180), difficulty: z.enum(["easy", "medium", "hard"]), questionType: z.enum(["mcq", "true_false"]), count: z.number().int().min(5).max(20) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const questions = await createQuiz(input.topic, input.difficulty, input.count, input.questionType);
      const result = await db.insert(quizzes).values({ userId: ctx.user.id, topic: input.topic, difficulty: input.difficulty, questionType: input.questionType, questions });
      return { id: result[0].insertId, questions };
    }),
    record: protectedProcedure.input(z.object({ id: z.number().int().positive(), answers: z.record(z.string(), z.number().int().min(0).max(3)), score: z.number().int().min(0).max(100) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(quizzes).set({ answers: input.answers, score: input.score }).where(and(eq(quizzes.id, input.id), eq(quizzes.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  flashcards: router({
    list: protectedProcedure.input(z.object({ topic: z.string().trim().max(180).optional() })).query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const condition = input.topic ? and(eq(flashcards.userId, ctx.user.id), eq(flashcards.topic, input.topic)) : eq(flashcards.userId, ctx.user.id);
      return db.select().from(flashcards).where(condition).orderBy(desc(flashcards.createdAt));
    }),
    generate: protectedProcedure.input(z.object({ topic: z.string().trim().min(1).max(180), source: z.string().trim().max(12000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const cards = await createFlashcards(input.topic, input.source);
      await db.delete(flashcards).where(and(eq(flashcards.userId, ctx.user.id), eq(flashcards.topic, input.topic)));
      if (cards.length) await db.insert(flashcards).values(cards.map((card) => ({ userId: ctx.user.id, topic: input.topic, ...card })));
      return { cards };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "known", "review"]) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(flashcards).set({ status: input.status }).where(and(eq(flashcards.id, input.id), eq(flashcards.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  summarize: protectedProcedure.input(z.object({ source: z.string().trim().min(1).max(12000), length: z.enum(["short", "medium", "detailed"]) })).mutation(async ({ input }) => ({ summary: await createSummary(input.source, input.length) })),
});
