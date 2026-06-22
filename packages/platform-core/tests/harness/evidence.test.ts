import { describe, expect, it } from "vitest";
import { InMemoryEvidenceStore } from "../../src/harness/evidence.js";

describe("InMemoryEvidenceStore", () => {
  it("saves and retrieves evidence records", async () => {
    const store = new InMemoryEvidenceStore();

    await store.save({
      id: "ev-1",
      runId: "run-1",
      type: "agent-result",
      content: { status: "done", summary: "Task completed" },
      timestamp: "2026-06-15T10:00:00Z",
    });

    const results = await store.query({ runId: "run-1" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("ev-1");
    expect(results[0]?.content).toEqual({
      status: "done",
      summary: "Task completed",
    });
  });

  it("filters by type", async () => {
    const store = new InMemoryEvidenceStore();

    await store.save({
      id: "ev-1",
      runId: "run-1",
      type: "agent-result",
      content: "result data",
      timestamp: "2026-06-15T10:00:00Z",
    });
    await store.save({
      id: "ev-2",
      runId: "run-1",
      type: "approval-decision",
      content: "approved",
      timestamp: "2026-06-15T10:01:00Z",
    });

    const results = await store.query({ type: "approval-decision" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("ev-2");
  });

  it("retrieves by id", async () => {
    const store = new InMemoryEvidenceStore();

    await store.save({
      id: "ev-1",
      runId: "run-1",
      type: "agent-result",
      content: "data",
      timestamp: "2026-06-15T10:00:00Z",
    });

    const record = await store.getById("ev-1");
    expect(record).not.toBeNull();
    expect(record!.id).toBe("ev-1");

    const missing = await store.getById("ev-999");
    expect(missing).toBeNull();
  });

  it("deletes records by run id", async () => {
    const store = new InMemoryEvidenceStore();

    await store.save({
      id: "ev-1",
      runId: "run-1",
      type: "agent-result",
      content: "data",
      timestamp: "2026-06-15T10:00:00Z",
    });
    await store.save({
      id: "ev-2",
      runId: "run-1",
      type: "spawn-plan",
      content: "plan",
      timestamp: "2026-06-15T10:01:00Z",
    });
    await store.save({
      id: "ev-3",
      runId: "run-2",
      type: "agent-result",
      content: "other data",
      timestamp: "2026-06-15T11:00:00Z",
    });

    await store.deleteByRun("run-1");

    expect(store.count).toBe(1);
    const remaining = await store.query({ runId: "run-2" });
    expect(remaining).toHaveLength(1);
  });

  it("sorts results by timestamp descending", async () => {
    const store = new InMemoryEvidenceStore();

    await store.save({
      id: "ev-1",
      runId: "run-1",
      type: "agent-result",
      content: "first",
      timestamp: "2026-06-15T09:00:00Z",
    });
    await store.save({
      id: "ev-2",
      runId: "run-1",
      type: "agent-result",
      content: "second",
      timestamp: "2026-06-15T10:00:00Z",
    });
    await store.save({
      id: "ev-3",
      runId: "run-1",
      type: "agent-result",
      content: "third",
      timestamp: "2026-06-15T11:00:00Z",
    });

    const results = await store.query({ runId: "run-1" });
    expect(results.map((r) => r.content)).toEqual(["third", "second", "first"]);
  });

  it("respects maxRecords limit with auto-pruning", async () => {
    const store = new InMemoryEvidenceStore({ maxRecords: 3 });

    await store.save({
      id: "ev-1",
      runId: "run-1",
      type: "agent-result",
      content: "oldest",
      timestamp: "2026-06-15T09:00:00Z",
    });
    await store.save({
      id: "ev-2",
      runId: "run-1",
      type: "agent-result",
      content: "middle",
      timestamp: "2026-06-15T10:00:00Z",
    });
    await store.save({
      id: "ev-3",
      runId: "run-1",
      type: "agent-result",
      content: "newest",
      timestamp: "2026-06-15T11:00:00Z",
    });
    await store.save({
      id: "ev-4",
      runId: "run-1",
      type: "agent-result",
      content: "extra",
      timestamp: "2026-06-15T12:00:00Z",
    });

    // Should have pruned oldest (ev-1)
    const results = await store.query({ runId: "run-1" });
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.id)).toEqual(["ev-4", "ev-3", "ev-2"]);
  });

  it("limits query results", async () => {
    const store = new InMemoryEvidenceStore();

    for (let i = 1; i <= 10; i++) {
      await store.save({
        id: `ev-${i}`,
        runId: "run-1",
        type: "agent-result",
        content: `entry ${i}`,
        timestamp: `2026-06-15T${String(i).padStart(2, "0")}:00:00Z`,
      });
    }

    const results = await store.query({ runId: "run-1", limit: 3 });
    expect(results).toHaveLength(3);
    expect(results[0]?.id).toBe("ev-10");
  });
});
