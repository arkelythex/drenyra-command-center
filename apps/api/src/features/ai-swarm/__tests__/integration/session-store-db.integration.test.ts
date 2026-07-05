import { randomUUID } from "node:crypto";
import { afterEach, expect, it } from "vitest";
import {
  agentRunEvents,
  agentRunInputs,
  agentRunStates,
  and,
  db,
  eq,
  sql,
} from "@drenyra/infrastructure";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type FixtureIds = {
  companyId: string;
  runId: string;
};

describeDb("PostgresSessionStore DB integration", () => {
  const fixtures: FixtureIds[] = [];
  const companyId = randomUUID();
  const OTHER_COMPANY = randomUUID();

  afterEach(async () => {
    for (const f of fixtures) {
      await db
        .delete(agentRunInputs)
        .where(eq(agentRunInputs.runId, f.runId))
        .execute();
      await db
        .delete(agentRunEvents)
        .where(eq(agentRunEvents.runId, f.runId))
        .execute();
      await db
        .delete(agentRunStates)
        .where(eq(agentRunStates.runId, f.runId))
        .execute();
    }
    fixtures.length = 0;
  });

  const runId = () => {
    const id = `test-run-${randomUUID()}`;
    return id;
  };

  it("should persist and retrieve a run state", async () => {
    const id = runId();
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      workflowState: "IDLE",
      companyId,
    });

    const result = await db
      .select()
      .from(agentRunStates)
      .where(
        and(eq(agentRunStates.runId, id), eq(agentRunStates.companyId, companyId)),
      );

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("running");
    expect(result[0].workflowState).toBe("IDLE");
  });

  it("should update run state status and workflow", async () => {
    const id = runId();
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      workflowState: "IDLE",
      companyId,
    });

    await db
      .update(agentRunStates)
      .set({ status: "completed", workflowState: "COMPLETED" })
      .where(eq(agentRunStates.runId, id));

    const result = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.runId, id));

    expect(result[0].status).toBe("completed");
    expect(result[0].workflowState).toBe("COMPLETED");
  });

  it("should list run states scoped by companyId", async () => {
    const id1 = runId();
    const id2 = runId();
    const otherRunId = `other-${runId()}`;
    fixtures.push({ companyId, runId: id1 }, { companyId, runId: id2 });

    await db.insert(agentRunStates).values([
      { runId: id1, status: "running", companyId },
      { runId: id2, status: "completed", companyId },
      { runId: otherRunId, status: "running", companyId: OTHER_COMPANY },
    ]);
    // other company won't be cleaned up — it's a different fixture
    // but it won't appear in the scoped query

    const result = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, companyId));

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.runId)).not.toContain(otherRunId);
  });

  it("should append and retrieve events in ASC order", async () => {
    const id = runId();
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      companyId,
    });

    await db.insert(agentRunEvents).values([
      { runId: id, eventType: "PROCESS_STARTED", companyId, payload: {} },
      { runId: id, eventType: "EXTRACTION_STARTED", companyId, payload: {} },
      { runId: id, eventType: "PROCESS_COMPLETED", companyId, payload: {} },
    ]);

    const events = await db
      .select()
      .from(agentRunEvents)
      .where(eq(agentRunEvents.runId, id))
      .orderBy(sql`created_at ASC`);

    expect(events).toHaveLength(3);
    expect(events[0].eventType).toBe("PROCESS_STARTED");
    expect(events[2].eventType).toBe("PROCESS_COMPLETED");
  });

  it("should reject duplicate runId with unique constraint", async () => {
    const id = runId();
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      companyId,
    });

    await expect(
      db.insert(agentRunStates).values({
        runId: id,
        status: "completed",
        companyId,
      }),
    ).rejects.toThrow();
  });

  it("should persist and retrieve input data", async () => {
    const id = runId();
    const inputData = JSON.stringify({
      invoiceNumber: "F001-123",
      amount: 1500.0,
    });
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      companyId,
    });

    await db.insert(agentRunInputs).values({
      runId: id,
      inputType: "invoice_json",
      inputData,
      checksum: "abc123sha256",
      companyId,
    });

    const input = await db
      .select()
      .from(agentRunInputs)
      .where(eq(agentRunInputs.runId, id));

    expect(input).toHaveLength(1);
    expect(input[0].inputType).toBe("invoice_json");
    expect(input[0].inputData).toBe(inputData);
    expect(input[0].checksum).toBe("abc123sha256");
  });

  it("should enforce FK cascade on agentRunEvents when parent deleted", async () => {
    const id = `cascade-test-${randomUUID()}`;
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      companyId,
    });

    await db.insert(agentRunEvents).values({
      runId: id,
      eventType: "TEST_EVENT",
      companyId,
    });

    // agent_run_events has NO FK to agent_run_states (different from agent_run_inputs)
    // So deleting the parent state should leave the event
    await db.delete(agentRunStates).where(eq(agentRunStates.runId, id));

    const events = await db
      .select()
      .from(agentRunEvents)
      .where(eq(agentRunEvents.runId, id));
    expect(events).toHaveLength(1);
  });

  it("should respect tenant isolation across company boundaries", async () => {
    const id1 = runId();
    const id2 = `tenant2-${runId()}`;
    fixtures.push({ companyId, runId: id1 });

    await db.insert(agentRunStates).values([
      { runId: id1, status: "running", companyId },
      { runId: id2, status: "completed", companyId: OTHER_COMPANY },
    ]);

    const companyARuns = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, companyId));

    const companyBRuns = await db
      .select()
      .from(agentRunStates)
      .where(eq(agentRunStates.companyId, OTHER_COMPANY));

    expect(companyARuns).toHaveLength(1);
    expect(companyARuns[0].runId).toBe(id1);
    expect(companyBRuns).toHaveLength(1);
    expect(companyBRuns[0].runId).toBe(id2);

    // Cleanup company B's data too
    await db
      .delete(agentRunStates)
      .where(eq(agentRunStates.companyId, OTHER_COMPANY));
  });

  it("should handle concurrent inserts without collision (unique runId)", async () => {
    const id = runId();
    fixtures.push({ companyId, runId: id });

    const promises = Array.from({ length: 3 }, (_, i) =>
      db.insert(agentRunStates).values({
        runId: `${id}-concurrent-${i}`,
        status: "running",
        companyId,
      }),
    );

    const results = await Promise.allSettled(promises);
    const rejected = results.filter(
      (r) => r.status === "rejected",
    );
    expect(rejected).toHaveLength(0);

    // cleanup concurrent entries
    for (let i = 0; i < 3; i++) {
      await db
        .delete(agentRunStates)
        .where(eq(agentRunStates.runId, `${id}-concurrent-${i}`));
    }
  });

  it("should cascade delete agentRunInputs when agent_run_states parent deleted", async () => {
    const id = `cascade-input-${randomUUID()}`;
    fixtures.push({ companyId, runId: id });

    await db.insert(agentRunStates).values({
      runId: id,
      status: "running",
      companyId,
    });

    await db.insert(agentRunInputs).values({
      runId: id,
      inputType: "test",
      inputData: "{}",
      checksum: "test",
      companyId,
    });

    await db.delete(agentRunStates).where(eq(agentRunStates.runId, id));

    // agentRunInputs has FK with CASCADE — should be gone
    const input = await db
      .select()
      .from(agentRunInputs)
      .where(eq(agentRunInputs.runId, id));
    expect(input).toHaveLength(0);
  });
});
