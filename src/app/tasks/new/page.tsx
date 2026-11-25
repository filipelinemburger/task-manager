import type { Metadata } from "next";
import { TaskForm } from "@/components/task-form";

export const metadata: Metadata = { title: "New task · Task Manager" };

export default function NewTaskPage() {
  return (
    <>
      <h1>New task</h1>
      <TaskForm />
    </>
  );
}
