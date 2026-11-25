import { createCallerFactory, router } from "../trpc";
import { taskRouter } from "./task";

export const appRouter = router({
  task: taskRouter,
});

// The client only uses this type, so no server code goes to the browser.
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
