# task-manager

A simple task manager. The backend keeps the tasks **in memory** and exposes them through **tRPC**. The frontend is a **Next.js 15** (App Router) app that renders the task list on the server (SSR).

> All data in this project is fictitious. There are no secrets, tokens or environment variables to configure.

## How to run

Requirements: Node.js 18.18+ (tested with Node 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Other scripts:

```bash
npm test           # unit tests for the tRPC router (Vitest)
npm run typecheck  # TypeScript, no emit
npm run lint
```

The app starts with 25 fictitious sample tasks, so infinite scroll can be seen right away. To start with an empty list, run it with `SEED_SAMPLE_TASKS=false`.

Because storage is in memory, **all changes are lost when the server restarts**. This keeps the project small: there's no database to set up.

## Features

| Feature | Where |
|---|---|
| Task model: `id`, `titulo`, `descricao?`, `dataCriacao` | `src/server/task-store.ts` |
| CRUD through tRPC: `task.create`, `task.list`, `task.byId`, `task.update`, `task.delete` | `src/server/routers/task.ts` |
| Tasks cannot be created without a title; clear errors (e.g. `NOT_FOUND` when updating a missing task) | `src/lib/task-schema.ts`, `src/server/routers/task.ts` |
| List page with **SSR**: the first page is fetched on the server and sent in the HTML | `src/app/page.tsx` |
| Delete from the list with success/error feedback | `src/components/task-list.tsx` |
| Create/edit form with functional components, hooks and validation | `src/components/task-form.tsx` |
| Loading, success and error states | buttons ("Saving…", "Deleting…"), toasts, `error.tsx`, `not-found.tsx` |
| Infinite scroll | `src/components/task-list.tsx` (`IntersectionObserver` + `useInfiniteQuery`) |

## How it works

```
Browser ──HTTP (batched)──► /api/trpc/[trpc]  ─┐
                                               ├─► appRouter (task router) ─► TaskStore (Map in memory)
Server Component (SSR) ──direct call──────────┘
```

- **Backend.** `TaskStore` is a small class around a `Map`. It lives on `globalThis`, so it is shared by every request and survives hot reloads in dev. The tRPC router validates every input with Zod and turns "not found" cases into `TRPCError({ code: "NOT_FOUND" })`. A custom `errorFormatter` turns validation errors into readable messages and adds `fieldErrors` to the response, so the form can show each error under the right field.
- **Shared validation.** The Zod schemas in `src/lib/task-schema.ts` are used both by the API and by the form. The client and server rules cannot drift apart, and the browser never imports server code.
- **SSR.** `src/app/page.tsx` is a Server Component. It calls the router directly (no HTTP hop) with `prefetchInfiniteQuery`, then passes the React Query cache to the client through `HydrationBoundary`. The list is in the HTML on first load, and the client takes over for deletes and infinite scroll without fetching the same data again.
- **Pagination.** The list is newest-first, with a cursor instead of an offset. Each task has an increasing sequence number, and the cursor means "tasks older than this one". Deleting or creating tasks while scrolling does not skip or repeat items (this is covered by a test).
- **Type safety.** The client only imports the `AppRouter` *type*. Inputs and outputs are typed end to end, and `superjson` keeps `dataCriacao` as a real `Date` on the client.
- **Dates and hydration.** The server doesn't know the visitor's time zone. Dates are first rendered in UTC and switched to local time after hydration, which avoids a hydration mismatch.

## Project structure

```
src/
  app/
    api/trpc/[trpc]/route.ts   tRPC HTTP endpoint
    page.tsx                   task list (SSR)
    tasks/new/page.tsx         create form
    tasks/[id]/edit/page.tsx   edit form (task loaded on the server; 404 if missing)
    layout.tsx, error.tsx, not-found.tsx, globals.css
  components/
    task-list.tsx              list, delete, infinite scroll
    task-form.tsx              create/edit form
    toast.tsx, local-date.tsx
  lib/
    task-schema.ts             Zod schemas shared by client and server
    task-list.ts               page size / cursor helper shared by SSR and client
  server/
    task-store.ts              in-memory storage
    trpc.ts                    tRPC init, context, error formatter
    routers/_app.ts, task.ts   routers (+ task.test.ts)
  trpc/
    client.tsx                 React provider (browser)
    server.tsx                 helpers for Server Components
    query-client.ts            shared QueryClient settings
```

## Decisions and trade-offs

- **In memory on purpose.** In a real app the `TaskStore` would be swapped for a database repository with the same methods. The router would not need to change.
- **No UI library.** To keep things simple, all styling is one plain CSS file.
- **Single instance.** In-memory data is per server process. With several instances or serverless functions, each one would have its own list. That's fine for a single local server, but it's another reason a production version needs a database.
