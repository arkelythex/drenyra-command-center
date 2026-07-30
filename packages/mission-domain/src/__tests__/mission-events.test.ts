import { describe, it, expect } from "vitest";
import {
  MissionEventType,
  parseSSEEvent,
  isKeepalive,
  formatSSEEvent,
} from "../mission-events.js";
import type { MissionEvent } from "../mission-events.js";
import type { MissionSnapshot } from "../mission-contracts.js";
import { AccountingMissionStatus } from "../mission-status.js";

describe("MissionEventType", () => {
  it("should define all 12 event types", () => {
    const types = Object.values(MissionEventType);
    expect(types).toHaveLength(12);
    expect(types).toContain("STATE_TRANSITION");
    expect(types).toContain("PROGRESS_UPDATE");
    expect(types).toContain("BLOCKER_ADDED");
    expect(types).toContain("BLOCKER_RESOLVED");
    expect(types).toContain("PROPOSAL_CREATED");
    expect(types).toContain("APPROVAL_DECIDED");
    expect(types).toContain("COMPLETED");
    expect(types).toContain("FAILED");
    expect(types).toContain("TIMEOUT");
    expect(types).toContain("UNKNOWN");
    expect(types).toContain("RECONCILED");
    expect(types).toContain("KEEPALIVE");
  });
});

describe("parseSSEEvent()", () => {
  const mockSnapshot: MissionSnapshot = {
    id: "m1",
    companyId: "c1",
    fiscalPeriod: "2026-07",
    intent: "monthly-close",
    status: AccountingMissionStatus.RUNNING,
    version: 1,
    progress: 0,
    steps: [],
    currentStep: "",
    blockers: [],
    proposal: null,
    rejection: null,
    receiptId: null,
    receiptHash: null,
    lastEventSequence: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should parse a valid SSE data line", () => {
    const event: MissionEvent = {
      id: "evt-1",
      missionId: "m1",
      sequence: 1,
      eventType: MissionEventType.STATE_TRANSITION,
      snapshot: mockSnapshot,
      createdAt: new Date().toISOString(),
    };
    const line = `data: ${JSON.stringify(event)}`;
    const parsed = parseSSEEvent(line);
    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe("evt-1");
    expect(parsed!.sequence).toBe(1);
    expect(parsed!.eventType).toBe("STATE_TRANSITION");
  });

  it("should parse a valid SSE data line without data: prefix", () => {
    const event: MissionEvent = {
      id: "evt-2",
      missionId: "m1",
      sequence: 2,
      eventType: MissionEventType.PROGRESS_UPDATE,
      snapshot: mockSnapshot,
      createdAt: new Date().toISOString(),
    };
    const parsed = parseSSEEvent(JSON.stringify(event));
    expect(parsed).not.toBeNull();
    expect(parsed!.sequence).toBe(2);
  });

  it("should return null for a keepalive comment", () => {
    const parsed = parseSSEEvent(":keepalive");
    expect(parsed).toBeNull();
  });

  it("should return null for an empty line", () => {
    const parsed = parseSSEEvent("");
    expect(parsed).toBeNull();
  });

  it("should return null for whitespace-only line", () => {
    const parsed = parseSSEEvent("   ");
    expect(parsed).toBeNull();
  });

  it("should return null for malformed JSON", () => {
    const parsed = parseSSEEvent("data: {not valid json}");
    expect(parsed).toBeNull();
  });

  it("should handle data: prefix with trailing space", () => {
    const event: MissionEvent = {
      id: "evt-3",
      missionId: "m1",
      sequence: 3,
      eventType: MissionEventType.COMPLETED,
      snapshot: mockSnapshot,
      createdAt: new Date().toISOString(),
    };
    const line = `data:${JSON.stringify(event)}`;
    const parsed = parseSSEEvent(line);
    expect(parsed).not.toBeNull();
    expect(parsed!.eventType).toBe("COMPLETED");
  });
});

describe("isKeepalive()", () => {
  it("should return true for ':keepalive'", () => {
    expect(isKeepalive(":keepalive")).toBe(true);
  });

  it("should return true for ':keepalive\n' with trailing newline", () => {
    expect(isKeepalive(":keepalive\n")).toBe(true);
  });

  it("should return false for a data line", () => {
    expect(isKeepalive('data: {"id":"1"}')).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isKeepalive("")).toBe(false);
  });
});

describe("formatSSEEvent()", () => {
  const mockSnapshot: MissionSnapshot = {
    id: "m1",
    companyId: "c1",
    fiscalPeriod: "2026-07",
    intent: "monthly-close",
    status: AccountingMissionStatus.RUNNING,
    version: 1,
    progress: 5000,
    steps: [],
    currentStep: "",
    blockers: [],
    proposal: null,
    rejection: null,
    receiptId: null,
    receiptHash: null,
    lastEventSequence: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should format an event as a complete SSE message", () => {
    const event: MissionEvent = {
      id: "evt-1",
      missionId: "m1",
      sequence: 1,
      eventType: MissionEventType.STATE_TRANSITION,
      snapshot: mockSnapshot,
      createdAt: new Date().toISOString(),
    };
    const formatted = formatSSEEvent(event);
    expect(formatted).toContain("id: evt-1");
    expect(formatted).toContain("data:");
    expect(formatted).toContain('"sequence":1');
    expect(formatted.endsWith("\n\n")).toBe(true);
  });
});
