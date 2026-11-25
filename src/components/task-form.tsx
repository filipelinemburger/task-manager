"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import {
  createTaskSchema,
  DESCRIPTION_MAX,
  TITLE_MAX,
  type TaskFieldErrors,
} from "@/lib/task-schema";
import { useTRPC } from "@/trpc/client";
import { useToast } from "./toast";

type Props = {
  /** When given, the form edits this task; otherwise it creates a new one. */
  task?: { id: string; titulo: string; descricao?: string };
};

export function TaskForm({ task }: Props) {
  const isEdit = Boolean(task);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [fieldErrors, setFieldErrors] = useState<TaskFieldErrors>({});

  const callbacks = {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.task.pathKey() });
      toast("success", isEdit ? "Task updated." : "Task created.");
      router.push("/");
    },
    onError: (err: { message: string; data?: { fieldErrors?: TaskFieldErrors | null } | null }) => {
      // Validation errors from the backend are shown next to the matching field.
      if (err.data?.fieldErrors) setFieldErrors(err.data.fieldErrors);
      toast("error", isEdit ? `Could not update the task: ${err.message}` : `Could not create the task: ${err.message}`);
    },
  };

  const createTask = useMutation(trpc.task.create.mutationOptions(callbacks));
  const updateTask = useMutation(trpc.task.update.mutationOptions(callbacks));
  const isSaving = createTask.isPending || updateTask.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Same rules as the backend: stop here if the title is empty or a field is too long.
    const parsed = createTaskSchema.safeParse({ titulo, descricao });
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});

    if (task) {
      updateTask.mutate({ id: task.id, ...parsed.data, descricao: parsed.data.descricao ?? "" });
    } else {
      createTask.mutate(parsed.data);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="titulo">
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          value={titulo}
          maxLength={TITLE_MAX}
          autoFocus
          aria-invalid={Boolean(fieldErrors.titulo)}
          aria-describedby={fieldErrors.titulo ? "titulo-error" : undefined}
          onChange={(e) => {
            setTitulo(e.target.value);
            if (fieldErrors.titulo) setFieldErrors((f) => ({ ...f, titulo: undefined }));
          }}
        />
        {fieldErrors.titulo && (
          <p id="titulo-error" className="error-text">
            {fieldErrors.titulo[0]}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="descricao">Description (optional)</label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          value={descricao}
          maxLength={DESCRIPTION_MAX}
          aria-invalid={Boolean(fieldErrors.descricao)}
          aria-describedby={fieldErrors.descricao ? "descricao-error" : undefined}
          onChange={(e) => setDescricao(e.target.value)}
        />
        {fieldErrors.descricao && (
          <p id="descricao-error" className="error-text">
            {fieldErrors.descricao[0]}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={isSaving}>
          {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create task"}
        </button>
        <Link href="/" className="button">
          Cancel
        </Link>
      </div>
    </form>
  );
}
