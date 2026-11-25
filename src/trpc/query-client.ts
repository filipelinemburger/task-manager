import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

/**
 * Creates the React Query client. Used by both the server (for SSR) and the browser.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't fetch again right after the page loads with data from the server.
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // Keep dates as Date objects when sending data from the server to the browser.
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
