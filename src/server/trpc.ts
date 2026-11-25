import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";
import { getTaskStore, type TaskStore } from "./task-store";

export type Context = { taskStore: TaskStore };

/** Builds the context for each call (HTTP request or server-side caller). */
export async function createContext(): Promise<Context> {
  return { taskStore: getTaskStore() };
}

const t = initTRPC.context<Context>().create({
  // superjson keeps `Date` values as real Dates on the client (dataCriacao).
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isValidationError = error.cause instanceof ZodError;
    return {
      ...shape,
      // Replace the raw JSON dump of Zod issues with a readable sentence.
      message: isValidationError
        ? (error.cause as ZodError).issues.map((issue) => issue.message).join(" ")
        : shape.message,
      data: {
        ...shape.data,
        // Field-level validation errors, so the form can show them next to each input.
        fieldErrors:
          isValidationError ? z.flattenError(error.cause as ZodError).fieldErrors : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
