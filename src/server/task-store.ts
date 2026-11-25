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
  /** Where the next page starts, or null if there are no more tasks. */
  nextCursor: number | null;
};

/**
 * Keeps the tasks in memory.
 *
 * Each task gets a number that only goes up (`seq`). The list shows the newest
 * tasks first, and each page asks for "tasks older than X". This way no task is
 * skipped or repeated when tasks are added or deleted while scrolling.
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
    // Newest first: a Map keeps the order tasks were added, so we reverse it.
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
      // An empty string clears the description. If not sent, it stays the same.
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
 * One store for the whole app. It is saved on `globalThis` so the data is not
 * lost when the code reloads during development. The sample tasks are fake.
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
