import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

/**
 * One factory used on both sides: the server creates a client per request to
 * prefetch data for SSR, and the browser creates a single long-lived client.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data rendered on the server is considered fresh for a moment, so the
        // browser does not immediately refetch what it just received.
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // Dates (dataCriacao) must survive the trip from server HTML to client cache.
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
