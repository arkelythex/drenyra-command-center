import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteSessionStore } from "../../src/memory/sqlite-store.js";

describe("SqliteSessionStore", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir === undefined) return;
    await rm(tempDir, { recursive: true, force: true });
  });

  async function createStore() {
    tempDir = await mkdtemp(join(tmpdir(), "platform-core-memory-"));
    return SqliteSessionStore.create({
      path: join(tempDir, "memory.json"),
    });
  }

  it("persists scoped memories across store instances", async () => {
    const scope = { tenantId: "tenant-1", metadata: { companyId: "co-1" } };

    const first = await createStore();
    await first.save({
      agentId: "analyst",
      sessionId: "session-1",
      scope,
      type: "fact",
      content: "Validation found record READY for review",
      metadata: { tags: ["validation"], confidence: 0.91 },
    });
    first.close();

    const second = await SqliteSessionStore.create({
      path: join(tempDir ?? "", "memory.json"),
    });
    const results = await second.search({ text: "validation", scope });

    expect(results).toHaveLength(1);
    expect(results[0]?.record.content).toContain("READY");
    expect(results[0]?.record.metadata.tags).toEqual(["validation"]);
    second.close();
  });

  it("does not leak memories across tenant scope", async () => {
    const store = await createStore();

    await store.save({
      agentId: "analyst",
      scope: { tenantId: "tenant-1" },
      type: "fact",
      content: "tenant one anomaly",
      metadata: { tags: ["anomaly"] },
    });
    await store.save({
      agentId: "analyst",
      scope: { tenantId: "tenant-2" },
      type: "fact",
      content: "tenant two anomaly",
      metadata: { tags: ["anomaly"] },
    });

    const results = await store.search({
      text: "anomaly",
      scope: { tenantId: "tenant-1" },
    });

    expect(results.map((r) => r.record.content)).toEqual([
      "tenant one anomaly",
    ]);
    store.close();
  });

  it("returns context with session records and summary", async () => {
    const store = await createStore();
    const scope = { tenantId: "tenant-1" };

    await store.save({
      agentId: "agent-x",
      sessionId: "sess-1",
      scope,
      type: "message",
      content: "Starting analysis",
      metadata: {},
    });
    await store.save({
      agentId: "agent-x",
      sessionId: "sess-1",
      scope,
      type: "fact",
      content: "Found anomaly in Q3 data",
      metadata: { tags: ["anomaly"] },
    });

    const ctx = await store.context({
      scope,
      sessionId: "sess-1",
      text: "anomaly",
    });

    expect(ctx.records.length).toBeGreaterThanOrEqual(1);
    expect(ctx.summary).toContain("anomaly");
    store.close();
  });
});
