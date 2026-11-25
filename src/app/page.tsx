import { Suspense } from "react";
import { TaskList } from "@/components/task-list";
import { getNextPageParam, PAGE_SIZE } from "@/lib/task-list";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

// The tasks change all the time, so build this page on every request (SSR).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Load the first page on the server, so the list is already in the HTML
  // and the user does not see a loading state.
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions({ limit: PAGE_SIZE }, { getNextPageParam }),
  );

  return (
    <>
      <h1>Tasks</h1>
      <HydrateClient>
        <Suspense fallback={<p className="muted">Loading tasks…</p>}>
          <TaskList />
        </Suspense>
      </HydrateClient>
    </>
  );
}
