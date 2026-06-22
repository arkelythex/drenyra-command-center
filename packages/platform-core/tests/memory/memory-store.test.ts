import { describe, expect, it } from "vitest";
import { MemoryStore } from "../../src/memory/memory-store.js";

describe("MemoryStore (in-memory)", () => {
  it("saves memory records with generated ids and timestamps", async () => {
    const store = new MemoryStore();

    const record = await store.save({
      agentId: "analyst",
      sessionId: "session-1",
      scope: { tenantId: "tenant-1", metadata: { companyId: "company-1" } },
      type: "decision",
      content: "Threshold analysis complete — variance within limits.",
      metadata: { confidence: 0.92, tags: ["analysis", "threshold"] },
    });

    expect(record.id).toMatch(/^mem_/);
    expect(record.createdAt).toBeInstanceOf(Date);
    expect(record.updatedAt).toBeInstanceOf(Date);
    expect(record.scope.tenantId).toBe("tenant-1");
    expect(record.scope.metadata?.companyId).toBe("company-1");
    expect(record.agentId).toBe("analyst");
    expect(record.type).toBe("decision");
  });

  it("searches only inside the requested tenant scope", async () => {
    const store = new MemoryStore();

    await store.save({
      agentId: "agent-a",
      scope: { tenantId: "tenant-1", metadata: { project: "alpha" } },
      type: "fact",
      content: "Alpha project completed",
      metadata: { tags: ["project"] },
    });
    await store.save({
      agentId: "agent-b",
      scope: { tenantId: "tenant-2", metadata: { project: "beta" } },
      type: "fact",
      content: "Beta project in progress",
      metadata: { tags: ["project"] },
    });

    const results = await store.search({
      text: "project",
      scope: { tenantId: "tenant-1" },
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.record.content).toBe("Alpha project completed");
    expect(results[0]?.record.scope.tenantId).toBe("tenant-1");
  });

  it("filters by scope metadata when provided", async () => {
    const store = new MemoryStore();

    await store.save({
      agentId: "agent-a",
      scope: { tenantId: "tenant-1", metadata: { companyId: "co-1" } },
      type: "fact",
      content: "Company 1 data",
      metadata: {},
    });
    await store.save({
      agentId: "agent-a",
      scope: { tenantId: "tenant-1", metadata: { companyId: "co-2" } },
      type: "fact",
      content: "Company 2 data",
      metadata: {},
    });

    const results = await store.search({
      text: "data",
      scope: { tenantId: "tenant-1", metadata: { companyId: "co-1" } },
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.record.content).toBe("Company 1 data");
  });

  it("returns session records in creation order", async () => {
    const store = new MemoryStore();
    const scope = { tenantId: "tenant-1" };

    await store.save({
      agentId: "agent-x",
      sessionId: "session-1",
      scope,
      type: "message",
      content: "first",
      metadata: {},
    });
    await store.save({
      agentId: "agent-x",
      sessionId: "session-1",
      scope,
      type: "message",
      content: "second",
      metadata: {},
    });

    const records = await store.getBySession("session-1", scope);

    expect(records.map((r) => r.content)).toEqual(["first", "second"]);
  });

  it("returns context with session records and search results", async () => {
    const store = new MemoryStore();
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
  });
});
