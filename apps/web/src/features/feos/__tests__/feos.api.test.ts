/**
 * FEOS — API Client Tests
 *
 * Unit tests for the FEOS API client functions.
 */

import { describe, it, expect, vi } from "vitest";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    api: {
      v1: {
        feos: {
          workspaces: {
            post: vi.fn(),
            get: vi.fn(),
          },
          portfolio: vi.fn(() => ({ get: vi.fn() })),
          attention: vi.fn(() => ({ get: vi.fn() })),
        },
      },
    },
  },
}));

describe("FEOS API Client", () => {
  it("exports workspace functions", async () => {
    const mod = await import("../api/feos.api");
    expect(mod.createWorkspace).toBeDefined();
    expect(mod.listWorkspaces).toBeDefined();
    expect(mod.getWorkspace).toBeDefined();
    expect(mod.transitionWorkspace).toBeDefined();
  });

  it("exports attention functions", async () => {
    const mod = await import("../api/feos.api");
    expect(mod.getPortfolioStatus).toBeDefined();
    expect(mod.getAttentionInbox).toBeDefined();
  });

  it("exports evidence functions", async () => {
    const mod = await import("../api/feos.api");
    expect(mod.computeEvidenceRoot).toBeDefined();
    expect(mod.createReceipt).toBeDefined();
    expect(mod.verifyReceipt).toBeDefined();
  });
});

describe("FEOS Hooks", () => {
  it("exports workspace hooks", async () => {
    const mod = await import("../hooks/useFeosWorkspace");
    expect(mod.useWorkspaceCreate).toBeDefined();
    expect(mod.useWorkspaceList).toBeDefined();
    expect(mod.useWorkspaceTransition).toBeDefined();
  });

  it("exports attention hooks", async () => {
    const mod = await import("../hooks/useFeosAttention");
    expect(mod.useAttentionInbox).toBeDefined();
    expect(mod.usePortfolioStatus).toBeDefined();
  });
});

describe("FEOS Components", () => {
  it("exports dashboard components", async () => {
    const mod = await import("../components/FeosWorkspaceDashboard");
    expect(mod.FeosWorkspaceDashboard).toBeDefined();
  });

  it("exports attention component", async () => {
    const mod = await import("../components/FeosAttentionInbox");
    expect(mod.FeosAttentionInbox).toBeDefined();
  });
});
