import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";
import { getTaskStore, type TaskStore } from "./task-store";

export type Context = { taskStore: TaskStore };

/** Data available to every procedure (here, the task store). */
export async function createContext(): Promise<Context> {
  return { taskStore: getTaskStore() };
}

const t = initTRPC.context<Context>().create({
  // superjson keeps dates as Date objects on the client.
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isValidationError = error.cause instanceof ZodError;
    return {
      ...shape,
      // Turn validation errors into a simple message.
      message: isValidationError
        ? (error.cause as ZodError).issues.map((issue) => issue.message).join(" ")
        : shape.message,
      data: {
        ...shape.data,
        // Errors for each field, so the form can show them under each input.
        fieldErrors:
          isValidationError ? z.flattenError(error.cause as ZodError).fieldErrors : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
