import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it } from "vitest";
import { TaskStore } from "../task-store";
import { createCaller } from "./_app";

let caller: ReturnType<typeof createCaller>;

beforeEach(() => {
  // A new empty store for each test.
  caller = createCaller({ taskStore: new TaskStore() });
});

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

async function expectTrpcError(promise: Promise<unknown>, code: TRPCError["code"]) {
  await expect(promise).rejects.toBeInstanceOf(TRPCError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("task router", () => {
  it("creates a task with the required fields", async () => {
    const task = await caller.task.create({ titulo: "  Write tests  ", descricao: "With vitest" });

    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(task.titulo).toBe("Write tests"); // spaces removed
    expect(task.descricao).toBe("With vitest");
    expect(task.dataCriacao).toBeInstanceOf(Date);
  });

  it("rejects a task without a title", async () => {
    await expectTrpcError(caller.task.create({ titulo: "" }), "BAD_REQUEST");
    await expectTrpcError(caller.task.create({ titulo: "   " }), "BAD_REQUEST");
  });

  it("lists tasks newest first with cursor pagination", async () => {
    for (let i = 1; i <= 5; i++) await caller.task.create({ titulo: `Task ${i}` });

    const first = await caller.task.list({ limit: 2 });
    expect(first.items.map((t) => t.titulo)).toEqual(["Task 5", "Task 4"]);
    expect(first.nextCursor).not.toBeNull();

    const second = await caller.task.list({ limit: 2, cursor: first.nextCursor });
    expect(second.items.map((t) => t.titulo)).toEqual(["Task 3", "Task 2"]);

    const third = await caller.task.list({ limit: 2, cursor: second.nextCursor });
    expect(third.items.map((t) => t.titulo)).toEqual(["Task 1"]);
    expect(third.nextCursor).toBeNull();
  });

  it("does not skip tasks when one is deleted between pages", async () => {
    const created = [];
    for (let i = 1; i <= 4; i++) created.push(await caller.task.create({ titulo: `Task ${i}` }));

    const first = await caller.task.list({ limit: 2 }); // Task 4, Task 3
    await caller.task.delete({ id: created[3].id }); // delete Task 4 (already shown)

    const second = await caller.task.list({ limit: 2, cursor: first.nextCursor });
    expect(second.items.map((t) => t.titulo)).toEqual(["Task 2", "Task 1"]);
  });

  it("updates a task and can clear its description", async () => {
    const task = await caller.task.create({ titulo: "Old", descricao: "Something" });

    const updated = await caller.task.update({ id: task.id, titulo: "New", descricao: "" });
    expect(updated.titulo).toBe("New");
    expect(updated.descricao).toBeUndefined();
    expect(updated.dataCriacao).toEqual(task.dataCriacao);

    const kept = await caller.task.update({ id: task.id, titulo: "Newer" });
    expect(kept.titulo).toBe("Newer");
  });

  it("rejects an update that empties the title", async () => {
    const task = await caller.task.create({ titulo: "Keep me" });
    await expectTrpcError(caller.task.update({ id: task.id, titulo: "" }), "BAD_REQUEST");
    expect((await caller.task.byId({ id: task.id })).titulo).toBe("Keep me");
  });

  it("returns NOT_FOUND for unknown tasks", async () => {
    await expectTrpcError(caller.task.byId({ id: MISSING_ID }), "NOT_FOUND");
    await expectTrpcError(caller.task.update({ id: MISSING_ID, titulo: "x" }), "NOT_FOUND");
    await expectTrpcError(caller.task.delete({ id: MISSING_ID }), "NOT_FOUND");
  });

  it("returns BAD_REQUEST for a malformed id", async () => {
    await expectTrpcError(caller.task.byId({ id: "not-a-uuid" }), "BAD_REQUEST");
  });

  it("deletes a task", async () => {
    const task = await caller.task.create({ titulo: "Temporary" });
    await expect(caller.task.delete({ id: task.id })).resolves.toEqual({ id: task.id });
    expect((await caller.task.list({ limit: 10 })).items).toHaveLength(0);
  });
});
