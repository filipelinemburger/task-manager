/** Settings used by both the server and the browser, so they load the same list. */
export const PAGE_SIZE = 10;

export const getNextPageParam = (lastPage: { nextCursor: number | null }) => lastPage.nextCursor;
