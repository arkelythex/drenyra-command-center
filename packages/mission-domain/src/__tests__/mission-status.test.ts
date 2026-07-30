import { describe, it, expect } from "vitest";
import {
  AccountingMissionStatus,
  VALID_TRANSITIONS,
  TERMINAL_STATES,
  transition,
  isRunnable,
  isAwaitingApproval,
  isTerminal,
} from "../mission-status.js";

describe("AccountingMissionStatus", () => {
  it("should have exactly 11 states", () => {
    const states = Object.values(AccountingMissionStatus);
    expect(states).toHaveLength(11);
    expect(states).toContain("DRAFT");
    expect(states).toContain("QUEUED");
    expect(states).toContain("RUNNING");
    expect(states).toContain("BLOCKED");
    expect(states).toContain("AWAITING_APPROVAL");
    expect(states).toContain("APPROVED");
    expect(states).toContain("REJECTED");
    expect(states).toContain("REVISION_REQUESTED");
    expect(states).toContain("COMPLETED");
    expect(states).toContain("FAILED");
    expect(states).toContain("UNKNOWN");
  });
});

describe("VALID_TRANSITIONS", () => {
  it("should have entries for all non-terminal states", () => {
    expect(VALID_TRANSITIONS.has("DRAFT")).toBe(true);
    expect(VALID_TRANSITIONS.has("QUEUED")).toBe(true);
    expect(VALID_TRANSITIONS.has("RUNNING")).toBe(true);
    expect(VALID_TRANSITIONS.has("BLOCKED")).toBe(true);
    expect(VALID_TRANSITIONS.has("AWAITING_APPROVAL")).toBe(true);
    expect(VALID_TRANSITIONS.has("APPROVED")).toBe(true);
    expect(VALID_TRANSITIONS.has("REJECTED")).toBe(true);
    expect(VALID_TRANSITIONS.has("REVISION_REQUESTED")).toBe(true);
    expect(VALID_TRANSITIONS.has("UNKNOWN")).toBe(true);
  });

  it("DRAFT transitions to QUEUED only", () => {
    const targets = VALID_TRANSITIONS.get("DRAFT")!;
    expect(targets.size).toBe(1);
    expect(targets.has("QUEUED")).toBe(true);
  });

  it("QUEUED transitions to RUNNING and FAILED", () => {
    const targets = VALID_TRANSITIONS.get("QUEUED")!;
    expect(targets.size).toBe(2);
    expect(targets.has("RUNNING")).toBe(true);
    expect(targets.has("FAILED")).toBe(true);
  });

  it("RUNNING transitions to BLOCKED, AWAITING_APPROVAL, COMPLETED, FAILED, UNKNOWN", () => {
    const targets = VALID_TRANSITIONS.get("RUNNING")!;
    expect(targets.size).toBe(5);
    expect(targets.has("BLOCKED")).toBe(true);
    expect(targets.has("AWAITING_APPROVAL")).toBe(true);
    expect(targets.has("COMPLETED")).toBe(true);
    expect(targets.has("FAILED")).toBe(true);
    expect(targets.has("UNKNOWN")).toBe(true);
  });

  it("BLOCKED transitions to RUNNING and FAILED", () => {
    const targets = VALID_TRANSITIONS.get("BLOCKED")!;
    expect(targets.size).toBe(2);
    expect(targets.has("RUNNING")).toBe(true);
    expect(targets.has("FAILED")).toBe(true);
  });

  it("AWAITING_APPROVAL transitions to APPROVED, REJECTED, RUNNING", () => {
    const targets = VALID_TRANSITIONS.get("AWAITING_APPROVAL")!;
    expect(targets.size).toBe(3);
    expect(targets.has("APPROVED")).toBe(true);
    expect(targets.has("REJECTED")).toBe(true);
    expect(targets.has("RUNNING")).toBe(true);
  });

  it("APPROVED transitions to COMPLETED and FAILED", () => {
    const targets = VALID_TRANSITIONS.get("APPROVED")!;
    expect(targets.size).toBe(2);
    expect(targets.has("COMPLETED")).toBe(true);
    expect(targets.has("FAILED")).toBe(true);
  });

  it("REJECTED transitions to REVISION_REQUESTED only", () => {
    const targets = VALID_TRANSITIONS.get("REJECTED")!;
    expect(targets.size).toBe(1);
    expect(targets.has("REVISION_REQUESTED")).toBe(true);
  });

  it("REVISION_REQUESTED transitions to QUEUED only", () => {
    const targets = VALID_TRANSITIONS.get("REVISION_REQUESTED")!;
    expect(targets.size).toBe(1);
    expect(targets.has("QUEUED")).toBe(true);
  });

  it("COMPLETED has no transitions", () => {
    const targets = VALID_TRANSITIONS.get("COMPLETED");
    expect(targets?.size ?? 0).toBe(0);
  });

  it("FAILED has no transitions", () => {
    const targets = VALID_TRANSITIONS.get("FAILED");
    expect(targets?.size ?? 0).toBe(0);
  });

  it("UNKNOWN transitions to RUNNING, FAILED, COMPLETED (recovery paths)", () => {
    const targets = VALID_TRANSITIONS.get("UNKNOWN")!;
    expect(targets.size).toBe(3);
    expect(targets.has("RUNNING")).toBe(true);
    expect(targets.has("FAILED")).toBe(true);
    expect(targets.has("COMPLETED")).toBe(true);
  });
});

describe("TERMINAL_STATES", () => {
  it("should contain COMPLETED and FAILED", () => {
    expect(TERMINAL_STATES.has("COMPLETED")).toBe(true);
    expect(TERMINAL_STATES.has("FAILED")).toBe(true);
  });

  it("should NOT contain REJECTED", () => {
    expect(TERMINAL_STATES.has("REJECTED")).toBe(false);
  });

  it("should have exactly 2 states", () => {
    expect(TERMINAL_STATES.size).toBe(2);
  });
});

describe("transition()", () => {
  // VALID TRANSITIONS — every forward transition
  it("DRAFT -> QUEUED is valid", () => {
    expect(transition("DRAFT", "QUEUED")).toBe("QUEUED");
  });

  it("QUEUED -> RUNNING is valid", () => {
    expect(transition("QUEUED", "RUNNING")).toBe("RUNNING");
  });

  it("QUEUED -> FAILED is valid", () => {
    expect(transition("QUEUED", "FAILED")).toBe("FAILED");
  });

  it("RUNNING -> BLOCKED is valid", () => {
    expect(transition("RUNNING", "BLOCKED")).toBe("BLOCKED");
  });

  it("RUNNING -> AWAITING_APPROVAL is valid", () => {
    expect(transition("RUNNING", "AWAITING_APPROVAL")).toBe("AWAITING_APPROVAL");
  });

  it("RUNNING -> COMPLETED is valid", () => {
    expect(transition("RUNNING", "COMPLETED")).toBe("COMPLETED");
  });

  it("RUNNING -> FAILED is valid", () => {
    expect(transition("RUNNING", "FAILED")).toBe("FAILED");
  });

  it("RUNNING -> UNKNOWN is valid", () => {
    expect(transition("RUNNING", "UNKNOWN")).toBe("UNKNOWN");
  });

  it("BLOCKED -> RUNNING is valid", () => {
    expect(transition("BLOCKED", "RUNNING")).toBe("RUNNING");
  });

  it("BLOCKED -> FAILED is valid", () => {
    expect(transition("BLOCKED", "FAILED")).toBe("FAILED");
  });

  it("AWAITING_APPROVAL -> APPROVED is valid", () => {
    expect(transition("AWAITING_APPROVAL", "APPROVED")).toBe("APPROVED");
  });

  it("AWAITING_APPROVAL -> REJECTED is valid", () => {
    expect(transition("AWAITING_APPROVAL", "REJECTED")).toBe("REJECTED");
  });

  it("AWAITING_APPROVAL -> RUNNING is valid", () => {
    expect(transition("AWAITING_APPROVAL", "RUNNING")).toBe("RUNNING");
  });

  it("APPROVED -> COMPLETED is valid", () => {
    expect(transition("APPROVED", "COMPLETED")).toBe("COMPLETED");
  });

  it("APPROVED -> FAILED is valid", () => {
    expect(transition("APPROVED", "FAILED")).toBe("FAILED");
  });

  it("REJECTED -> REVISION_REQUESTED is valid", () => {
    expect(transition("REJECTED", "REVISION_REQUESTED")).toBe("REVISION_REQUESTED");
  });

  it("REVISION_REQUESTED -> QUEUED is valid", () => {
    expect(transition("REVISION_REQUESTED", "QUEUED")).toBe("QUEUED");
  });

  it("UNKNOWN -> RUNNING is valid", () => {
    expect(transition("UNKNOWN", "RUNNING")).toBe("RUNNING");
  });

  it("UNKNOWN -> FAILED is valid", () => {
    expect(transition("UNKNOWN", "FAILED")).toBe("FAILED");
  });

  it("UNKNOWN -> COMPLETED is valid", () => {
    expect(transition("UNKNOWN", "COMPLETED")).toBe("COMPLETED");
  });

  // INVALID TRANSITIONS
  it("DRAFT -> AWAITING_APPROVAL throws INVALID_TRANSITION", () => {
    expect(() => transition("DRAFT", "AWAITING_APPROVAL")).toThrow("INVALID_TRANSITION");
  });

  it("DRAFT -> COMPLETED throws INVALID_TRANSITION", () => {
    expect(() => transition("DRAFT", "COMPLETED")).toThrow("INVALID_TRANSITION");
  });

  it("DRAFT -> APPROVED throws INVALID_TRANSITION", () => {
    expect(() => transition("DRAFT", "APPROVED")).toThrow("INVALID_TRANSITION");
  });

  it("COMPLETED -> any throws INVALID_TRANSITION", () => {
    expect(() => transition("COMPLETED", "DRAFT")).toThrow("INVALID_TRANSITION");
    expect(() => transition("COMPLETED", "RUNNING")).toThrow("INVALID_TRANSITION");
    expect(() => transition("COMPLETED", "QUEUED")).toThrow("INVALID_TRANSITION");
  });

  it("FAILED -> any throws INVALID_TRANSITION", () => {
    expect(() => transition("FAILED", "DRAFT")).toThrow("INVALID_TRANSITION");
    expect(() => transition("FAILED", "RUNNING")).toThrow("INVALID_TRANSITION");
  });

  it("REJECTED -> APPROVED throws INVALID_TRANSITION", () => {
    expect(() => transition("REJECTED", "APPROVED")).toThrow("INVALID_TRANSITION");
  });

  it("REJECTED -> COMPLETED throws INVALID_TRANSITION", () => {
    expect(() => transition("REJECTED", "COMPLETED")).toThrow("INVALID_TRANSITION");
  });

  it("QUEUED -> COMPLETED throws INVALID_TRANSITION", () => {
    expect(() => transition("QUEUED", "COMPLETED")).toThrow("INVALID_TRANSITION");
  });

  it("AWAITING_APPROVAL -> COMPLETED throws INVALID_TRANSITION", () => {
    expect(() => transition("AWAITING_APPROVAL", "COMPLETED")).toThrow("INVALID_TRANSITION");
  });

  it("UNKNOWN -> DRAFT throws INVALID_TRANSITION", () => {
    expect(() => transition("UNKNOWN", "DRAFT")).toThrow("INVALID_TRANSITION");
  });

  it("UNKNOWN -> QUEUED throws INVALID_TRANSITION", () => {
    expect(() => transition("UNKNOWN", "QUEUED")).toThrow("INVALID_TRANSITION");
  });
});

describe("isRunnable()", () => {
  it("DRAFT is runnable", () => expect(isRunnable("DRAFT")).toBe(true));
  it("QUEUED is runnable", () => expect(isRunnable("QUEUED")).toBe(true));
  it("REVISION_REQUESTED is runnable", () => expect(isRunnable("REVISION_REQUESTED")).toBe(true));
  it("RUNNING is NOT runnable", () => expect(isRunnable("RUNNING")).toBe(false));
  it("BLOCKED is NOT runnable", () => expect(isRunnable("BLOCKED")).toBe(false));
  it("AWAITING_APPROVAL is NOT runnable", () => expect(isRunnable("AWAITING_APPROVAL")).toBe(false));
  it("APPROVED is NOT runnable", () => expect(isRunnable("APPROVED")).toBe(false));
  it("REJECTED is NOT runnable", () => expect(isRunnable("REJECTED")).toBe(false));
  it("COMPLETED is NOT runnable", () => expect(isRunnable("COMPLETED")).toBe(false));
  it("FAILED is NOT runnable", () => expect(isRunnable("FAILED")).toBe(false));
  it("UNKNOWN is NOT runnable", () => expect(isRunnable("UNKNOWN")).toBe(false));
});

describe("isAwaitingApproval()", () => {
  it("AWAITING_APPROVAL returns true", () => {
    expect(isAwaitingApproval("AWAITING_APPROVAL")).toBe(true);
  });
  it("other states return false", () => {
    expect(isAwaitingApproval("DRAFT")).toBe(false);
    expect(isAwaitingApproval("RUNNING")).toBe(false);
    expect(isAwaitingApproval("APPROVED")).toBe(false);
    expect(isAwaitingApproval("REJECTED")).toBe(false);
    expect(isAwaitingApproval("COMPLETED")).toBe(false);
    expect(isAwaitingApproval("FAILED")).toBe(false);
  });
});

describe("isTerminal()", () => {
  it("COMPLETED is terminal", () => expect(isTerminal("COMPLETED")).toBe(true));
  it("FAILED is terminal", () => expect(isTerminal("FAILED")).toBe(true));

  it("REJECTED is NOT terminal (can go to REVISION_REQUESTED)", () => {
    expect(isTerminal("REJECTED")).toBe(false);
  });

  it("non-terminal states return false", () => {
    expect(isTerminal("DRAFT")).toBe(false);
    expect(isTerminal("QUEUED")).toBe(false);
    expect(isTerminal("RUNNING")).toBe(false);
    expect(isTerminal("BLOCKED")).toBe(false);
    expect(isTerminal("AWAITING_APPROVAL")).toBe(false);
    expect(isTerminal("APPROVED")).toBe(false);
    expect(isTerminal("REVISION_REQUESTED")).toBe(false);
    expect(isTerminal("UNKNOWN")).toBe(false);
  });
});
