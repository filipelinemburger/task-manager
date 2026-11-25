"use client";

import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { getNextPageParam, PAGE_SIZE } from "@/lib/task-list";
import { useTRPC } from "@/trpc/client";
import { LocalDate } from "./local-date";
import { useToast } from "./toast";

export function TaskList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();

  // The first page was already loaded on the server, so it shows right away.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, error } =
    useSuspenseInfiniteQuery(
      trpc.task.list.infiniteQueryOptions({ limit: PAGE_SIZE }, { getNextPageParam }),
    );

  const listQueryKey = trpc.task.list.infiniteQueryKey({ limit: PAGE_SIZE });

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: async ({ id }) => {
        // Remove the task from the list right away...
        queryClient.setQueryData(listQueryKey, (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((t) => t.id !== id),
            })),
          },
        );
        toast("success", "Task deleted.");
        // ...then reload the list from the server.
        await queryClient.invalidateQueries({ queryKey: trpc.task.list.pathKey() });
      },
      onError: (err) => toast("error", `Could not delete the task: ${err.message}`),
    }),
  );

  // Infinite scroll: when the end of the list is visible, load more tasks.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tasks = data.pages.flatMap((page) => page.items);

  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p>No tasks yet.</p>
        <Link href="/tasks/new" className="button button-primary">
          Create your first task
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="task-list">
        {tasks.map((task) => {
          const isDeleting = deleteTask.isPending && deleteTask.variables?.id === task.id;
          return (
            <li key={task.id} className={`task-card${isDeleting ? " is-deleting" : ""}`}>
              <div className="task-body">
                <h2 className="task-title">{task.titulo}</h2>
                {task.descricao && <p className="task-description">{task.descricao}</p>}
                <p className="muted small">
                  Created <LocalDate date={task.dataCriacao} />
                </p>
              </div>
              <div className="task-actions">
                <Link href={`/tasks/${task.id}/edit`} className="button">
                  Edit
                </Link>
                <button
                  type="button"
                  className="button button-danger"
                  disabled={isDeleting}
                  onClick={() => deleteTask.mutate({ id: task.id })}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div ref={sentinelRef} className="list-footer">
        {isError && <p className="error-text">Could not load more tasks: {error?.message}</p>}
        {isFetchingNextPage && <p className="muted">Loading more tasks…</p>}
        {hasNextPage && !isFetchingNextPage && (
          // Backup button in case the automatic loading does not run.
          <button type="button" className="button" onClick={() => fetchNextPage()}>
            Load more
          </button>
        )}
        {!hasNextPage && <p className="muted small">That&apos;s all your tasks.</p>}
      </div>
    </>
  );
}
