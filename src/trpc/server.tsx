import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";
import { makeQueryClient } from "./query-client";

/** One QueryClient per server request (React `cache` scopes it to the request). */
export const getQueryClient = cache(makeQueryClient);

/**
 * tRPC helpers for Server Components. Calls go straight to the router in the
 * same process (no HTTP round trip), and the results land in the QueryClient
 * so they can be sent to the browser with <HydrateClient>.
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>;
}
