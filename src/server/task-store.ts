import { randomUUID } from "node:crypto";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
};

export type CreateTaskInput = { titulo: string; descricao?: string };
export type UpdateTaskInput = { titulo?: string; descricao?: string };

export type TaskPage = {
  items: Task[];
  /** Cursor to fetch the next page, or null when there are no more tasks. */
  nextCursor: number | null;
};

/**
 * In-memory task repository.
 *
 * Each task gets a monotonically increasing sequence number (`seq`). Listing is
 * ordered newest-first and paginated with `seq` as the cursor ("give me tasks
 * older than X"). Unlike offset pagination, this stays correct when tasks are
 * created or deleted between page loads (no skipped or duplicated items).
 */
export class TaskStore {
  private readonly tasks = new Map<string, { task: Task; seq: number }>();
  private nextSeq = 1;

  create(input: CreateTaskInput): Task {
    const task: Task = {
      id: randomUUID(),
      titulo: input.titulo,
      descricao: emptyToUndefined(input.descricao),
      dataCriacao: new Date(),
    };
    this.tasks.set(task.id, { task, seq: this.nextSeq++ });
    return task;
  }

  list({ limit, cursor }: { limit: number; cursor?: number | null }): TaskPage {
    // Newest first. A Map keeps insertion order, so reversing gives descending seq.
    const ordered = [...this.tasks.values()].reverse();
    const start = cursor == null ? ordered : ordered.filter((e) => e.seq < cursor);
    const page = start.slice(0, limit);
    const hasMore = start.length > limit;

    return {
      items: page.map((e) => e.task),
      nextCursor: hasMore ? page[page.length - 1].seq : null,
    };
  }

  findById(id: string): Task | undefined {
    return this.tasks.get(id)?.task;
  }

  /** Returns the updated task, or undefined if it does not exist. */
  update(id: string, input: UpdateTaskInput): Task | undefined {
    const entry = this.tasks.get(id);
    if (!entry) return undefined;

    const updated: Task = {
      ...entry.task,
      ...(input.titulo !== undefined && { titulo: input.titulo }),
      // An explicit empty string clears the description; undefined leaves it unchanged.
      ...(input.descricao !== undefined && { descricao: emptyToUndefined(input.descricao) }),
    };
    this.tasks.set(id, { task: updated, seq: entry.seq });
    return updated;
  }

  /** Returns true if a task was removed. */
  delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  count(): number {
    return this.tasks.size;
  }
}

function emptyToUndefined(value?: string): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

const SAMPLE_TASKS: CreateTaskInput[] = [
  { titulo: "Set up project repository", descricao: "Create the repo and add the base Next.js app." },
  { titulo: "Write onboarding checklist", descricao: "List the first-week steps for a fictional new hire." },
  { titulo: "Review pull request #12" },
  { titulo: "Plan sprint backlog", descricao: "Pick the top items for the next two weeks." },
  { titulo: "Update dependencies" },
  { titulo: "Prepare demo for Friday", descricao: "Short walkthrough of the task list and form." },
  { titulo: "Fix typo on settings page" },
  { titulo: "Draft API documentation", descricao: "Describe each tRPC procedure and its input." },
  { titulo: "Add loading skeletons" },
  { titulo: "Book meeting room", descricao: "Room B, Thursday afternoon." },
  { titulo: "Clean up unused CSS" },
  { titulo: "Write unit tests for the router" },
  { titulo: "Research caching options", descricao: "Compare in-memory vs Redis for later." },
  { titulo: "Reply to support ticket #348" },
  { titulo: "Organize team retrospective" },
  { titulo: "Refactor form validation" },
  { titulo: "Check accessibility of buttons", descricao: "Labels, focus states and contrast." },
  { titulo: "Archive old design files" },
  { titulo: "Measure page load time" },
  { titulo: "Order new notebooks for the office" },
  { titulo: "Rename confusing variables" },
  { titulo: "Schedule 1:1 meetings" },
  { titulo: "Test the app on mobile" },
  { titulo: "Write release notes", descricao: "Summarize what changed in this version." },
  { titulo: "Celebrate the release" },
];

/**
 * Store shared by every request. It is kept on `globalThis` so that it survives
 * Next.js hot reloads in development (otherwise each edit would wipe the data).
 * All sample data is fictitious.
 */
const globalForStore = globalThis as unknown as { taskStore?: TaskStore };

export function getTaskStore(): TaskStore {
  if (!globalForStore.taskStore) {
    const store = new TaskStore();
    if (process.env.SEED_SAMPLE_TASKS !== "false") {
      SAMPLE_TASKS.forEach((t) => store.create(t));
    }
    globalForStore.taskStore = store;
  }
  return globalForStore.taskStore;
}
