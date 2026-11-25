import { Suspense } from "react";
import { TaskList } from "@/components/task-list";
import { getNextPageParam, PAGE_SIZE } from "@/lib/task-list";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

// The list lives in memory and changes at runtime, so render it on every request (SSR), never at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // SSR: load the first page on the server. It is embedded in the HTML and handed
  // to React Query on the client, so the list is visible without a loading state.
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
