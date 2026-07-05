import { randomUUID } from "node:crypto";
import { afterEach, expect, it } from "vitest";
import {
  agentRunEvents,
  agentRunStates,
  db,
  eq,
} from "@drenyra/infrastructure";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("Observability API (DB integration)", () => {
  const companyId = randomUUID();
  const runIds: string[] = [];

  afterEach(async () => {
    for (const runId of runIds) {
      await db
        .delete(agentRunEvents)
        .where(eq(agentRunEvents.runId, runId));
      await db
        .delete(agentRunStates)
        .where(eq(agentRunStates.runId, runId));
    }
    runIds.length = 0;
  });

  const insertRun = async (
    overrides: Partial<typeof agentRunStates.$inferInsert> = {},
  ) => {
    const runId = `obs-test-${randomUUID()}`;
    runIds.push(runId);
    await db.insert(agentRunStates).values({
      runId,
      companyId,
      status: "running",
      ...overrides,
    });
    return runId;
  };

  const insertEvent = async (
    runId: string,
    eventType: string,
    payload: Record<string, unknown> = {},
  ) => {
    await db.insert(agentRunEvents).values({
      runId,
      eventType,
      companyId,
      payload,
    });
  };

  it("should query run states by companyId", async () => {
    await insertRun({ status: "running", workflowState: "IDLE" });
    await insertRun({ status: "completed", workflowState: "COMPLETED" });

    const result = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, companyId))
      .orderBy(agentRunStates.createdAt);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.status).sort()).toEqual([
      "completed",
      "running",
    ]);
  });

  it("should return correct status counts", async () => {
    await insertRun({ status: "running" });
    await insertRun({ status: "completed" });
    await insertRun({ status: "completed" });
    await insertRun({ status: "failed" });

    const all = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, companyId));

    const statusCounts = all.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    expect(statusCounts.running).toBe(1);
    expect(statusCounts.completed).toBe(2);
    expect(statusCounts.failed).toBe(1);
  });

  it("should filter runs by status", async () => {
    await insertRun({ status: "running" });
    await insertRun({ status: "completed" });

    const failed = await db
      .select()
      .from(agentRunStates)
      .where(
        eq(agentRunStates.status, "failed"),
      );

    // Our test data has no failed runs with the same company
    // (the earlier failed run exists but let's just verify it works)
    const running = await db
      .select()
      .from(agentRunStates)
      .where(
        eq(agentRunStates.status, "running"),
      );

    expect(running.length).toBeGreaterThanOrEqual(1);
    expect(failed).toHaveLength(0); // no failed in this scope
  });

  it("should paginate runs with limit", async () => {
    await insertRun({ status: "running" });
    await insertRun({ status: "running" });
    await insertRun({ status: "running" });

    const limited = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, companyId))
      .limit(2);

    expect(limited).toHaveLength(2);
  });

  it("should retrieve events for a specific run ordered by createdAt", async () => {
    const id = await insertRun({ status: "running" });
    await insertEvent(id, "PROCESS_STARTED", { phase: "init" });
    await insertEvent(id, "EXTRACTION_STARTED", { agent: "reader" });
    await insertEvent(id, "PROCESS_COMPLETED", { result: "ok" });

    const events = await db
      .select()
      .from(agentRunEvents)
      .where(eq(agentRunEvents.runId, id))
      .orderBy(agentRunEvents.createdAt);

    expect(events).toHaveLength(3);
    expect(events[0].eventType).toBe("PROCESS_STARTED");
    expect(events[1].eventType).toBe("EXTRACTION_STARTED");
    expect(events[2].eventType).toBe("PROCESS_COMPLETED");
  });

  it("should return empty events for non-existent run", async () => {
    const events = await db
      .select()
      .from(agentRunEvents)
      .where(eq(agentRunEvents.runId, "non-existent-run"));

    expect(events).toHaveLength(0);
  });

  it("should persist event payload as JSONB", async () => {
    const id = await insertRun({ status: "running" });
    const payload = {
      tokens: 1500,
      model: "gemini-2.5-flash",
      durationMs: 3200,
    };

    await insertEvent(id, "context_usage_snapshot", payload);

    const events = await db
      .select()
      .from(agentRunEvents)
      .where(eq(agentRunEvents.runId, id));

    expect(events[0].payload).toEqual(payload);
  });

  it("should handle concurrent event appends without collision", async () => {
    const id = await insertRun({ status: "running" });

    const promises = Array.from({ length: 5 }, (_, i) =>
      insertEvent(id, `event_${i}`, { index: i }),
    );

    await Promise.all(promises);

    const events = await db
      .select()
      .from(agentRunEvents)
      .where(eq(agentRunEvents.runId, id));

    // serial PK — no collision even with race condition
    expect(events).toHaveLength(5);
  });
});
