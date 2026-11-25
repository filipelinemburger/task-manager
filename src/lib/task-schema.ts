import { z } from "zod";

/**
 * Validation rules shared by the tRPC backend and the form on the client.
 * Keeping them in one place means the UI and the API can never disagree.
 */
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 1000;

export const tituloSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`);

export const descricaoSchema = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters.`);

export const taskIdSchema = z.uuid("Invalid task id.");

export const createTaskSchema = z.object({
  titulo: tituloSchema,
  descricao: descricaoSchema.optional(),
});

export const updateTaskSchema = z.object({
  id: taskIdSchema,
  titulo: tituloSchema.optional(),
  // Send "" to clear the description; omit it to keep the current one.
  descricao: descricaoSchema.optional(),
});

export type TaskFieldErrors = Partial<Record<"titulo" | "descricao", string[]>>;
