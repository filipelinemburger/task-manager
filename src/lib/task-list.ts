/** Settings shared by the server prefetch and the client infinite query, so both use the same cache key. */
export const PAGE_SIZE = 10;

export const getNextPageParam = (lastPage: { nextCursor: number | null }) => lastPage.nextCursor;
