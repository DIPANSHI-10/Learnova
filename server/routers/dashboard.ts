import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { activityLogs, calendarEvents, notes, quizzes, tasks } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("The secure data service is currently unavailable.");
  return db;
}

function daysFromToday(days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (days - 1 - index)); date.setHours(0, 0, 0, 0);
    return date;
  });
}

function calculateStreak(logs: { createdAt: Date }[]) {
  const keys = new Set(logs.map((item) => item.createdAt.toISOString().slice(0, 10)));
  let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  let streak = 0;
  while (keys.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export const dashboardRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const [userTasks, recentNotes, upcomingEvents, userQuizzes, activity] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.userId, ctx.user.id)).orderBy(desc(tasks.createdAt)),
      db.select().from(notes).where(eq(notes.userId, ctx.user.id)).orderBy(desc(notes.updatedAt)).limit(4),
      db.select().from(calendarEvents).where(eq(calendarEvents.userId, ctx.user.id)).orderBy(calendarEvents.startsAt).limit(5),
      db.select().from(quizzes).where(eq(quizzes.userId, ctx.user.id)).orderBy(desc(quizzes.createdAt)),
      db.select().from(activityLogs).where(eq(activityLogs.userId, ctx.user.id)).orderBy(desc(activityLogs.createdAt)).limit(60),
    ]);
    const studyMinutes = activity.filter((item) => item.activityType === "study_session").reduce((sum, item) => sum + item.durationMinutes, 0);
    const completed = userTasks.filter((task) => task.status === "completed").length;
    const scored = userQuizzes.filter((quiz) => quiz.score !== null);
    const quizScore = scored.length ? Math.round(scored.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / scored.length) : 0;
    const upcomingTasks = userTasks.filter((task) => task.status !== "completed").filter((task) => task.deadline && task.deadline >= new Date()).sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0)).slice(0, 5);
    const progress = daysFromToday().map((date) => ({ label: date.toLocaleDateString("en-US", { weekday: "short" }), minutes: activity.filter((item) => item.activityType === "study_session" && item.createdAt.toDateString() === date.toDateString()).reduce((sum, item) => sum + item.durationMinutes, 0) }));
    return {
      metrics: { studyHours: Math.round((studyMinutes / 60) * 10) / 10, completedTasks: completed, totalTasks: userTasks.length, quizScore, streak: calculateStreak(activity) },
      tasks: upcomingTasks,
      notes: recentNotes,
      deadlines: upcomingEvents.filter((event) => event.startsAt >= new Date()).slice(0, 4),
      progress,
      recommendation: upcomingTasks[0] ? `“${upcomingTasks[0].title}” is the next priority. Block a focused ${upcomingTasks[0].priority === "high" ? "45" : "30"}-minute session to make a clear start.` : "Capture one small learning goal for today, then use active recall to turn study time into progress.",
    };
  }),
  analytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const [userTasks, userQuizzes, activity, events] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.userId, ctx.user.id)),
      db.select().from(quizzes).where(eq(quizzes.userId, ctx.user.id)),
      db.select().from(activityLogs).where(eq(activityLogs.userId, ctx.user.id)).orderBy(desc(activityLogs.createdAt)).limit(120),
      db.select().from(calendarEvents).where(eq(calendarEvents.userId, ctx.user.id)).orderBy(calendarEvents.startsAt),
    ]);
    const trend = daysFromToday(14).map((date) => ({ label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), minutes: activity.filter((item) => item.createdAt.toDateString() === date.toDateString() && item.activityType === "study_session").reduce((sum, item) => sum + item.durationMinutes, 0) }));
    const subjectMap = new Map<string, number>();
    activity.filter((item) => item.subject).forEach((item) => subjectMap.set(item.subject || "General", (subjectMap.get(item.subject || "General") || 0) + item.durationMinutes));
    const taskCompletion = userTasks.length ? Math.round((userTasks.filter((task) => task.status === "completed").length / userTasks.length) * 100) : 0;
    const quizAverage = userQuizzes.filter((quiz) => quiz.score !== null).length ? Math.round(userQuizzes.filter((quiz) => quiz.score !== null).reduce((sum, quiz) => sum + (quiz.score || 0), 0) / userQuizzes.filter((quiz) => quiz.score !== null).length) : 0;
    return { trend, subjects: Array.from(subjectMap.entries()).map(([name, minutes]) => ({ name, minutes })), taskCompletion, quizAverage, streak: calculateStreak(activity), scheduledStudyMinutes: events.filter((event) => event.category === "study").reduce((sum, event) => sum + event.durationMinutes, 0) };
  }),
});
