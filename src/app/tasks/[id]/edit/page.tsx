import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { getQueryClient, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Edit task · Task Manager" };
export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Load the task on the server so the form opens already filled in.
  let task;
  try {
    task = await getQueryClient().fetchQuery(trpc.task.byId.queryOptions({ id }));
  } catch (error) {
    // Unknown id, or an id that is not a valid UUID: show the 404 page.
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <h1>Edit task</h1>
      <TaskForm task={{ id: task.id, titulo: task.titulo, descricao: task.descricao }} />
    </>
  );
}
