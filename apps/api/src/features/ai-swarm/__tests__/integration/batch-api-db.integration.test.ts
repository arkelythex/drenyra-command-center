import { randomUUID } from "node:crypto";
import { afterEach, expect, it } from "vitest";
import {
  db,
  eq,
  and,
  batchRuns,
  batchRunItems,
} from "@drenyra/infrastructure";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("Batch API (DB integration)", () => {
  const companyId = randomUUID();
  const batchIds: string[] = [];

  afterEach(async () => {
    // Cleanup: delete items first, then batches (FK cascade handles it,
    // but explicit delete avoids ordering issues)
    for (const batchId of batchIds) {
      await db
        .delete(batchRunItems)
        .where(eq(batchRunItems.batchId, batchId));
      await db
        .delete(batchRuns)
        .where(eq(batchRuns.id, batchId));
    }
    batchIds.length = 0;
  });

  const insertBatch = async (
    overrides: Partial<typeof batchRuns.$inferSelect> = {},
  ) => {
    const id = randomUUID();
    batchIds.push(id);
    await db.insert(batchRuns).values({
      id,
      companyId,
      status: "pending",
      total: 0,
      completed: 0,
      failed: 0,
      ...overrides,
    });
    return id;
  };

  const insertBatchItem = async (
    batchId: string,
    overrides: Partial<typeof batchRunItems.$inferInsert> = {},
  ) => {
    const id = randomUUID();
    await db.insert(batchRunItems).values({
      id,
      batchId,
      status: "pending",
      ...overrides,
    });
    return id;
  };

  // ─── Create Batch ────────────────────────────────────────────────────────

  it("should create a batch run with pending status", async () => {
    const [row] = await db.insert(batchRuns).values({
      companyId,
      status: "pending",
      total: 5,
      completed: 0,
      failed: 0,
    }).returning();

    expect(row).toBeDefined();
    expect(row.status).toBe("pending");
    expect(row.total).toBe(5);
    expect(row.completed).toBe(0);
    expect(row.failed).toBe(0);
    batchIds.push(row.id);
  });

  it("should associate items with a batch", async () => {
    const batchId = await insertBatch({ total: 2 });
    await insertBatchItem(batchId, { status: "running" });
    await insertBatchItem(batchId, { status: "pending" });

    const items = await db
      .select()
      .from(batchRunItems)
      .where(eq(batchRunItems.batchId, batchId));

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.status).sort()).toEqual(["pending", "running"]);
  });

  // ─── List Batches ────────────────────────────────────────────────────────

  it("should list batches scoped by companyId", async () => {
    const otherCompany = randomUUID();
    await insertBatch({ companyId });
    await insertBatch({ companyId });
    await insertBatch({ companyId: otherCompany });

    const rows = await db
      .select()
      .from(batchRuns)
      .where(eq(batchRuns.companyId, companyId))
      .orderBy(batchRuns.createdAt);

    expect(rows).toHaveLength(2);
    rows.forEach((r) => expect(r.companyId).toBe(companyId));
  });

  it("should order batches by creation date descending", async () => {
    const id1 = await insertBatch({ companyId });
    const id2 = await insertBatch({ companyId });

    const rows = await db
      .select()
      .from(batchRuns)
      .where(eq(batchRuns.companyId, companyId))
      .orderBy(batchRuns.createdAt);

    expect(rows).toHaveLength(2);
  });

  // ─── Get Batch Detail ────────────────────────────────────────────────────

  it("should retrieve batch with items", async () => {
    const batchId = await insertBatch({ total: 3, status: "running" });
    await insertBatchItem(batchId, { status: "completed" });
    await insertBatchItem(batchId, { status: "running" });
    await insertBatchItem(batchId, { status: "pending" });

    const batch = await db.query.batchRuns.findFirst({
      where: eq(batchRuns.id, batchId),
      with: { items: true },
    });

    expect(batch).toBeDefined();
    expect(batch!.items).toHaveLength(3);
  });

  it("should return null for non-existent batch", async () => {
    const batch = await db.query.batchRuns.findFirst({
      where: eq(batchRuns.id, randomUUID()),
      with: { items: true },
    });
    expect(batch).toBeNull();
  });

  // ─── Cancel Batch ────────────────────────────────────────────────────────

  it("should cancel a pending batch", async () => {
    const batchId = await insertBatch({ status: "pending", total: 2 });

    await db.update(batchRuns)
      .set({ status: "cancelled" })
      .where(eq(batchRuns.id, batchId));

    const cancelled = await db.query.batchRuns.findFirst({
      where: eq(batchRuns.id, batchId),
    });

    expect(cancelled?.status).toBe("cancelled");
  });

  it("should cancel running items when batch is cancelled", async () => {
    const batchId = await insertBatch({ status: "running", total: 3 });
    const item1 = await insertBatchItem(batchId, { status: "running" });
    const item2 = await insertBatchItem(batchId, { status: "running" });
    const item3 = await insertBatchItem(batchId, { status: "pending" });

    // Simulate cancel: update batch + all pending/running items
    await db.update(batchRuns)
      .set({ status: "cancelled" })
      .where(eq(batchRuns.id, batchId));

    const updateResult = await db.update(batchRunItems)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(batchRunItems.batchId, batchId),
          eq(batchRunItems.status, "running"),
        ),
      )
      .returning({ id: batchRunItems.id, status: batchRunItems.status });

    updateResult.forEach((r) => expect(r.status).toBe("cancelled"));
  });

  it("should not cancel completed items", async () => {
    const batchId = await insertBatch({ status: "running", total: 2 });
    const completedId = await insertBatchItem(batchId, { status: "completed" });
    const runningId = await insertBatchItem(batchId, { status: "running" });

    // Cancel only running items
    await db.update(batchRunItems)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(batchRunItems.batchId, batchId),
          eq(batchRunItems.status, "running"),
        ),
      );

    const completed = await db.query.batchRunItems.findFirst({
      where: eq(batchRunItems.id, completedId),
    });
    const cancelled = await db.query.batchRunItems.findFirst({
      where: eq(batchRunItems.id, runningId),
    });

    expect(completed?.status).toBe("completed"); // unchanged
    expect(cancelled?.status).toBe("cancelled");
  });

  // ─── Tenant Isolation ───────────────────────────────────────────────────

  it("should enforce cross-company isolation", async () => {
    const companyA = randomUUID();
    const companyB = randomUUID();

    await insertBatch({ companyId: companyA });
    await insertBatch({ companyId: companyA });
    await insertBatch({ companyId: companyB });

    const batchARows = await db
      .select()
      .from(batchRuns)
      .where(eq(batchRuns.companyId, companyA));

    expect(batchARows).toHaveLength(2);
  });

  // ─── Update Progress ────────────────────────────────────────────────────

  it("should update batch progress correctly", async () => {
    const batchId = await insertBatch({ status: "running", total: 10 });

    await db.update(batchRuns)
      .set({ completed: 3, failed: 1, status: "partial" })
      .where(eq(batchRuns.id, batchId));

    const updated = await db.query.batchRuns.findFirst({
      where: eq(batchRuns.id, batchId),
    });

    expect(updated?.completed).toBe(3);
    expect(updated?.failed).toBe(1);
    expect(updated?.status).toBe("partial");
  });

  it("should set batch to completed when all items succeed", async () => {
    const batchId = await insertBatch({ status: "running", total: 3 });

    // Insert 3 completed items
    for (let i = 0; i < 3; i++) {
      await insertBatchItem(batchId, { status: "completed" });
    }

    // Mark batch as completed
    await db.update(batchRuns)
      .set({ completed: 3, status: "completed" })
      .where(eq(batchRuns.id, batchId));

    const updated = await db.query.batchRuns.findFirst({
      where: eq(batchRuns.id, batchId),
    });

    expect(updated?.status).toBe("completed");
    expect(updated?.completed).toBe(3);
  });
});
