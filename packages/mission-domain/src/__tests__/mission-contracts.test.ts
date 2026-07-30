import { describe, it, expect } from "vitest";
import type {
  RunIntentCommand,
  RejectCommand,
  MissionSnapshot,
} from "../mission-contracts.js";

describe("RunIntentCommand", () => {
  it("should require companyId, fiscalPeriod, intent, and input", () => {
    const cmd: RunIntentCommand = {
      companyId: "c1",
      fiscalPeriod: "2026-07",
      intent: "monthly-close",
      input: { instruction: "Run monthly close" },
    };
    expect(cmd.companyId).toBe("c1");
    expect(cmd.fiscalPeriod).toMatch(/^\d{4}-\d{2}$/);
    expect(cmd.intent).toBe("monthly-close");
    expect(cmd.input.instruction).toBeTruthy();
  });
});

describe("RejectCommand", () => {
  it("should require reason field (non-empty)", () => {
    const cmd: RejectCommand = {
      proposalId: "p1",
      proposalVersion: 1,
      reason: "Incomplete evidence",
      expectedMissionVersion: 2,
    };
    expect(cmd.reason).toBeTruthy();
    expect(cmd.reason.length).toBeGreaterThan(0);
  });
});

describe("MissionSnapshot", () => {
  it("should include lastEventSequence field", () => {
    const snapshot: MissionSnapshot = {
      id: "m1",
      companyId: "c1",
      fiscalPeriod: "2026-07",
      intent: "monthly-close",
      status: "DRAFT" as never,
      version: 1,
      progress: 0,
      steps: [],
      currentStep: "",
      blockers: [],
      proposal: null,
      rejection: null,
      receiptId: null,
      receiptHash: null,
      lastEventSequence: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(snapshot.lastEventSequence).toBe(0);
    expect(snapshot).toHaveProperty("lastEventSequence");
  });
});
