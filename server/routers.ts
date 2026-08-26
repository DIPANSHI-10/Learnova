import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { dashboardRouter } from "./routers/dashboard";
import { learningRouter } from "./routers/learning";
import { productivityRouter } from "./routers/productivity";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      if (process.env.LOCAL_DEV_BYPASS_AUTH === "true") sdk.endLocalSession();
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  productivity: productivityRouter,
  learning: learningRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
