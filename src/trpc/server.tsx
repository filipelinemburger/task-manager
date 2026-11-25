import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";
import { makeQueryClient } from "./query-client";

/** One React Query client per server request. */
export const getQueryClient = cache(makeQueryClient);

/**
 * tRPC for Server Components. It calls the backend directly (no HTTP request),
 * and <HydrateClient> sends the loaded data to the browser.
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>;
}
