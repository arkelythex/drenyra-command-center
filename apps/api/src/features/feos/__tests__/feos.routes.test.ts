/**
 * FEOS — API Route Tests
 *
 * E2E tests for the FEOS API endpoints using the Elysia test harness.
 * Note: FEOS API wraps responses in { success: true, data: ... }.
 */

import { Elysia } from "elysia";
import { describe, it, expect } from "vitest";
import { feosRoutes } from "../routes";

const app = new Elysia().use(feosRoutes);

function data(body: any) {
  return body.data ?? body;
}

describe("FEOS API — Workspaces", () => {
  const validWorkspace = {
    organizationId: "00000000-0000-0000-0000-000000000001",
    companyId: "00000000-0000-0000-0000-000000000002",
    companyRuc: "20123456789",
    period: { year: 2026, month: 6 },
    intent: "close" as const,
    label: "Monthly Close June 2026",
    description: "Close the fiscal period",
    createdBy: { id: "user-1", type: "user", label: "Test User" },
  };

  it("creates a workspace", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/feos/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validWorkspace),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const d = data(body);
    expect(d.id).toBeDefined();
    expect(d.state).toBe("queued");
    expect(d.isHealthy).toBe(true);
  });

  it("lists workspaces", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/feos/workspaces"));
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(d.workspaces).toBeDefined();
    expect(Array.isArray(d.workspaces)).toBe(true);
  });

  it("transitions workspace through its lifecycle", async () => {
    const createRes = await app.handle(
      new Request("http://localhost/api/v1/feos/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validWorkspace),
      }),
    );
    const created: any = data(await createRes.json());

    async function transition(action: string) {
      const res = await app.handle(
        new Request(`http://localhost/api/v1/feos/workspaces/${created.id}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }),
      );
      return data(await res.json());
    }

    expect((await transition("start")).state).toBe("working");
    expect((await transition("verify")).state).toBe("verifying");
    expect((await transition("complete")).state).toBe("completed");
  });

  it("blocks and unblocks a workspace", async () => {
    const createRes = await app.handle(
      new Request("http://localhost/api/v1/feos/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validWorkspace),
      }),
    );
    const created: any = data(await createRes.json());

    // Block
    const blockRes = await app.handle(
      new Request(`http://localhost/api/v1/feos/workspaces/${created.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block", params: { reason: "Missing evidence", blockedBy: [] } }),
      }),
    );
    const blocked = data(await blockRes.json());
    expect(blocked.state).toBe("blocked");
    expect(blocked.isHealthy).toBe(false);

    // Unblock
    const unblockRes = await app.handle(
      new Request(`http://localhost/api/v1/feos/workspaces/${created.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock" }),
      }),
    );
    const unblocked = data(await unblockRes.json());
    expect(unblocked.state).toBe("queued");
  });
});

describe("FEOS API — Tool Contracts", () => {
  it("lists all tool contracts", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/feos/tool-contracts"));
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(Array.isArray(d)).toBe(true);
    expect(d.length).toBeGreaterThanOrEqual(5);
  });

  it("gets a specific tool contract", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/feos/tool-contracts/post_journal_entry"));
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(d.name).toBe("post_journal_entry");
    expect(d.riskLevel).toBe("R2");
  });

  it("returns error for unknown contract", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/feos/tool-contracts/nonexistent"));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("nonexistent");
  });

  it("validates a tool call against a contract", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/feos/tool-contracts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName: "post_journal_entry", riskLevel: "R2" }),
      }),
    );
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(d).toHaveProperty("passed");
  });
});

describe("FEOS API — Portfolio & Attention", () => {
  it("returns portfolio status", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/feos/portfolio/00000000-0000-0000-0000-000000000001"),
    );
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(d).toHaveProperty("totalRollup");
    expect(d).toHaveProperty("attentionCount");
  });

  it("returns attention inbox", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/feos/attention/00000000-0000-0000-0000-000000000001"),
    );
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(d).toHaveProperty("items");
    expect(d).toHaveProperty("priorityBreakdown");
  });
});

describe("FEOS API — Agent Events", () => {
  it("publishes and retrieves events", async () => {
    const scope = {
      organizationId: "org-1", companyId: "comp-1",
      companyRuc: "20123456789", fiscalPeriod: "2026-06",
    };

    // Publish
    const publishRes = await app.handle(
      new Request("http://localhost/api/v1/feos/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "tool_started", title: "Test event", description: "A test",
          actor: { id: "agent-1", type: "agent", label: "Test Agent" },
          scope, traceId: "trace-1", workspaceId: "ws-test", toolName: "test_tool",
        }),
      }),
    );
    expect(publishRes.status).toBe(200);
    const published = data(await publishRes.json());
    expect(published.eventId).toBeDefined();

    // Get workspace events
    const getRes = await app.handle(new Request("http://localhost/api/v1/feos/events/workspace/ws-test"));
    const getBody = await getRes.json();
    expect(Array.isArray(data(getBody))).toBe(true);

    // Get trace events
    const traceRes = await app.handle(new Request("http://localhost/api/v1/feos/events/trace/trace-1"));
    const trace = data(await traceRes.json());
    expect(Array.isArray(trace)).toBe(true);
  });

  it("returns workflow state projection", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/feos/workflow/ws-test"));
    expect(res.status).toBe(200);
  });
});

describe("FEOS API — Evidence Root & Receipts", () => {
  it("computes an evidence root", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/feos/evidence-root", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { id: "ev-1", category: "document", title: "Invoice 001", hash: "abc123", timestamp: new Date().toISOString() },
            { id: "ev-2", category: "calculation", title: "IGV Calc", hash: "def456", timestamp: new Date().toISOString() },
          ],
        }),
      }),
    );
    expect(res.status).toBe(200);
    const d = data(await res.json());
    expect(d).toHaveProperty("rootHash");
    expect(d).toHaveProperty("items");
    expect(d.items).toHaveLength(2);
  });

  it("creates and verifies a receipt", async () => {
    const scope = {
      organizationId: "org-1", companyId: "comp-1",
      companyRuc: "20123456789", fiscalPeriod: "2026-06",
    };

    // Create
    const createRes = await app.handle(
      new Request("http://localhost/api/v1/feos/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "journal:post",
          actor: { id: "user-1", type: "user", label: "Test User" },
          scope,
          evidenceItems: [{ id: "ev-1", category: "document", title: "Invoice", hash: "abc123", timestamp: new Date().toISOString() }],
          actionInput: { description: "Test entry", amount: 100 },
          actionOutput: { journalId: "je-1", posted: true },
        }),
      }),
    );
    expect(createRes.status).toBe(200);
    const receipt = data(await createRes.json());
    expect(receipt).toHaveProperty("chainHash");
    expect(receipt).toHaveProperty("evidenceRoot");

    // Verify
    const verifyRes = await app.handle(
      new Request("http://localhost/api/v1/feos/receipts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receipt),
      }),
    );
    expect(verifyRes.status).toBe(200);
    const verification = data(await verifyRes.json());
    expect(verification.valid).toBe(true);
  });
});
