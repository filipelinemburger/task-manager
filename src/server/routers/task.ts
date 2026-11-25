import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "@/lib/task-schema";
import { publicProcedure, router } from "../trpc";

function notFound(id: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `Task "${id}" was not found.` });
}

export const taskRouter = router({
  /** Paginated list, newest first. `cursor` is managed by useInfiniteQuery on the client. */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.number().int().nullish(),
      }),
    )
    .query(({ ctx, input }) => ctx.taskStore.list(input)),

  byId: publicProcedure
    .input(z.object({ id: taskIdSchema }))
    .query(({ ctx, input }) => ctx.taskStore.findById(input.id) ?? notFound(input.id)),

  create: publicProcedure
    .input(createTaskSchema)
    .mutation(({ ctx, input }) => ctx.taskStore.create(input)),

  update: publicProcedure.input(updateTaskSchema).mutation(({ ctx, input }) => {
    const { id, ...changes } = input;
    return ctx.taskStore.update(id, changes) ?? notFound(id);
  }),

  delete: publicProcedure.input(z.object({ id: taskIdSchema })).mutation(({ ctx, input }) => {
    if (!ctx.taskStore.delete(input.id)) notFound(input.id);
    return { id: input.id };
  }),
});
