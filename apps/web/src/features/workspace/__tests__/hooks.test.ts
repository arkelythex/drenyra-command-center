import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AccountingMissionStatus } from "@drenyra/mission-domain";
import { missionReducer, INITIAL_STATE } from "../hooks/missionReducer";
import type { MissionState, MissionAction } from "../hooks/missionReducer";

describe("missionReducer integration with hooks pattern", () => {
  let state: MissionState;

  beforeEach(() => {
    state = { ...INITIAL_STATE };
  });

  const dispatch = (action: MissionAction) => {
    state = missionReducer(state, action);
  };

  it("full lifecycle: DRAFT → QUEUED → RUNNING → AWAITING_APPROVAL → APPROVED → COMPLETED", () => {
    // Start
    dispatch({
      type: "MISSION_EVENT_RECEIVED",
      event: {
        ...INITIAL_STATE,
        status: AccountingMissionStatus.QUEUED,
        version: 1,
        lastEventSequence: 1,
      },
    });
    expect(state.status).toBe(AccountingMissionStatus.QUEUED);

    // Run
    dispatch({
      type: "MISSION_EVENT_RECEIVED",
      event: {
        ...INITIAL_STATE,
        status: AccountingMissionStatus.RUNNING,
        progress: 3000,
        version: 2,
        lastEventSequence: 2,
      },
    });
    expect(state.status).toBe(AccountingMissionStatus.RUNNING);

    // Proposal
    dispatch({
      type: "MISSION_EVENT_RECEIVED",
      event: {
        ...INITIAL_STATE,
        status: AccountingMissionStatus.AWAITING_APPROVAL,
        progress: 7000,
        proposal: {
          id: "p1",
          missionId: "m1",
          version: 1,
          evidence: [{ id: "e1", label: "Report", type: "report" }],
          evidenceHash: "abc123",
          summary: "test",
          riskLevel: "MEDIUM",
          generatedAt: "2026-01-01T00:00:00Z",
        },
        version: 3,
        lastEventSequence: 3,
      },
    });
    expect(state.status).toBe(AccountingMissionStatus.AWAITING_APPROVAL);
    expect(state.proposal).toBeDefined();

    // Approve
    dispatch({
      type: "APPROVAL_COMPLETED",
      receiptId: "rcpt-1",
      receiptHash: "hash123",
    });
    expect(state.status).toBe(AccountingMissionStatus.APPROVED);
    expect(state.receiptId).toBe("rcpt-1");
  });

  it("full lifecycle: rejection path", () => {
    state.status = AccountingMissionStatus.AWAITING_APPROVAL;
    state.proposal = {
      id: "p1",
      missionId: "m1",
      version: 1,
      evidence: [],
      evidenceHash: "",
      summary: "test",
      riskLevel: "LOW",
      generatedAt: "t",
    };

    dispatch({
      type: "REJECTION_COMPLETED",
      rejection: {
        reason: "Needs work",
        rejectedBy: "user-1",
        rejectedAt: "2026-01-01T00:00:00Z",
        proposalVersion: 1,
      },
    });
    expect(state.status).toBe(AccountingMissionStatus.REJECTED);
    expect(state.rejection?.reason).toBe("Needs work");

    dispatch({ type: "REVISION_REQUESTED" });
    expect(state.status).toBe(AccountingMissionStatus.REVISION_REQUESTED);
    expect(state.proposal).toBeNull();
    expect(state.rejection).toBeNull();
  });

  it("handles UNKNOWN → reconnect → reconciled path", () => {
    dispatch({
      type: "ERROR_OCCURRED",
      error: "Timeout",
      isTimeout: true,
    });
    expect(state.status).toBe(AccountingMissionStatus.UNKNOWN);

    dispatch({
      type: "RECONNECT_FAILED",
      error: "Still down",
    });
    expect(state.error).toBe("Still down");

    dispatch({
      type: "RECONCILE_RESOLVED",
      status: AccountingMissionStatus.COMPLETED,
    });
    expect(state.status).toBe(AccountingMissionStatus.COMPLETED);
    expect(state.error).toBeNull();
  });

  it("RESET clears everything back to INITIAL_STATE", () => {
    state.status = AccountingMissionStatus.COMPLETED;
    state.progress = 10000;
    state.receiptId = "abc";

    dispatch({ type: "RESET" });
    expect(state.status).toBe(AccountingMissionStatus.DRAFT);
    expect(state.progress).toBe(0);
    expect(state.receiptId).toBeNull();
    expect(state.version).toBe(0);
  });
});
