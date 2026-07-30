import { describe, expect, it } from "vitest";
import { AccountingMissionStatus } from "@drenyra/mission-domain";
import { missionReducer, INITIAL_STATE } from "../hooks/missionReducer";
import type { MissionState } from "../hooks/missionReducer";

const makeSnapshot = (overrides: Partial<MissionState> = {}): MissionState => ({
  ...INITIAL_STATE,
  status: AccountingMissionStatus.RUNNING,
  version: 3,
  lastEventSequence: 5,
  ...overrides,
});

describe("missionReducer", () => {
  it("INITIAL_STATE is DRAFT with zero progress", () => {
    expect(INITIAL_STATE.status).toBe(AccountingMissionStatus.DRAFT);
    expect(INITIAL_STATE.progress).toBe(0);
    expect(INITIAL_STATE.version).toBe(0);
    expect(INITIAL_STATE.error).toBeNull();
  });

  describe("MISSION_EVENT_RECEIVED", () => {
    it("updates status, progress, steps, blockers, proposal from snapshot", () => {
      const snapshot = makeSnapshot({
        status: AccountingMissionStatus.RUNNING,
        progress: 5000,
        steps: [
          {
            id: "s1",
            name: "Analyze",
            status: "COMPLETED" as const,
          },
        ],
        blockers: [
          { id: "b1", reason: "Missing data", severity: "ERROR" as const, occurredAt: "2026-01-01T00:00:00Z" },
        ],
        proposal: {
          id: "p1",
          missionId: "m1",
          version: 2,
          evidence: [{ id: "e1", label: "Report", type: "report" }],
          evidenceHash: "abc123",
          summary: "Test proposal",
          riskLevel: "MEDIUM" as const,
          generatedAt: "2026-01-01T00:00:00Z",
        },
        version: 3,
        lastEventSequence: 7,
      });

      const result = missionReducer(INITIAL_STATE, {
        type: "MISSION_EVENT_RECEIVED",
        event: snapshot,
      });

      expect(result.status).toBe(AccountingMissionStatus.RUNNING);
      expect(result.progress).toBe(5000);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].name).toBe("Analyze");
      expect(result.blockers).toHaveLength(1);
      expect(result.proposal?.id).toBe("p1");
      expect(result.version).toBe(3);
      expect(result.lastEventSequence).toBe(7);
      expect(result.error).toBeNull();
    });

    it("defaults rejection to null when not present in snapshot", () => {
      const snapshot = makeSnapshot({
        status: AccountingMissionStatus.RUNNING,
        rejection: undefined as unknown as MissionState["rejection"],
      });
      const result = missionReducer(
        { ...INITIAL_STATE, rejection: { reason: "old", rejectedBy: "x", rejectedAt: "t", proposalVersion: 1 } },
        { type: "MISSION_EVENT_RECEIVED", event: snapshot },
      );
      expect(result.rejection).toBeNull();
    });
  });

  describe("APPROVAL_COMPLETED", () => {
    it("sets status to APPROVED with receiptId and receiptHash", () => {
      const result = missionReducer(
        { ...INITIAL_STATE, status: AccountingMissionStatus.AWAITING_APPROVAL },
        { type: "APPROVAL_COMPLETED", receiptId: "r1", receiptHash: "hash1" },
      );
      expect(result.status).toBe(AccountingMissionStatus.APPROVED);
      expect(result.receiptId).toBe("r1");
      expect(result.receiptHash).toBe("hash1");
      expect(result.error).toBeNull();
    });
  });

  describe("REJECTION_COMPLETED", () => {
    it("sets status to REJECTED with rejection details", () => {
      const rejection = {
        reason: "Needs more evidence",
        rejectedBy: "user-1",
        rejectedAt: "2026-01-01T00:00:00Z",
        proposalVersion: 2,
      };
      const result = missionReducer(
        { ...INITIAL_STATE, status: AccountingMissionStatus.AWAITING_APPROVAL },
        { type: "REJECTION_COMPLETED", rejection },
      );
      expect(result.status).toBe(AccountingMissionStatus.REJECTED);
      expect(result.rejection).toEqual(rejection);
      expect(result.error).toBeNull();
    });
  });

  describe("REVISION_REQUESTED", () => {
    it("transitions to REVISION_REQUESTED and clears proposal/rejection", () => {
      const result = missionReducer(
        {
          ...INITIAL_STATE,
          status: AccountingMissionStatus.REJECTED,
          proposal: { id: "p1", missionId: "m1", version: 1, evidence: [], evidenceHash: "", summary: "test", riskLevel: "LOW", generatedAt: "t" },
          rejection: { reason: "bad", rejectedBy: "x", rejectedAt: "t", proposalVersion: 1 },
        },
        { type: "REVISION_REQUESTED" },
      );
      expect(result.status).toBe(AccountingMissionStatus.REVISION_REQUESTED);
      expect(result.proposal).toBeNull();
      expect(result.rejection).toBeNull();
    });
  });

  describe("RECONNECT_SUCCEEDED", () => {
    it("restores full state from snapshot", () => {
      const snapshot = makeSnapshot({
        status: AccountingMissionStatus.AWAITING_APPROVAL,
        progress: 7500,
        version: 4,
        lastEventSequence: 12,
      });

      const result = missionReducer(
        { ...INITIAL_STATE, status: AccountingMissionStatus.UNKNOWN, error: "lost", isMockMode: true },
        { type: "RECONNECT_SUCCEEDED", snapshot },
      );

      expect(result.status).toBe(AccountingMissionStatus.AWAITING_APPROVAL);
      expect(result.progress).toBe(7500);
      expect(result.version).toBe(4);
      expect(result.lastEventSequence).toBe(12);
      expect(result.error).toBeNull();
      expect(result.isMockMode).toBe(false);
    });
  });

  describe("RECONNECT_FAILED", () => {
    it("sets UNKNOWN status with error message", () => {
      const result = missionReducer(INITIAL_STATE, {
        type: "RECONNECT_FAILED",
        error: "Connection refused",
      });
      expect(result.status).toBe(AccountingMissionStatus.UNKNOWN);
      expect(result.error).toBe("Connection refused");
    });
  });

  describe("RECONCILE_RESOLVED", () => {
    it("updates status from UNKNOWN to resolution", () => {
      const result = missionReducer(
        { ...INITIAL_STATE, status: AccountingMissionStatus.UNKNOWN, error: "timeout" },
        { type: "RECONCILE_RESOLVED", status: AccountingMissionStatus.COMPLETED },
      );
      expect(result.status).toBe(AccountingMissionStatus.COMPLETED);
      expect(result.error).toBeNull();
    });
  });

  describe("ERROR_OCCURRED", () => {
    it("sets FAILED when isTimeout is false", () => {
      const result = missionReducer(INITIAL_STATE, {
        type: "ERROR_OCCURRED",
        error: "Something broke",
        isTimeout: false,
      });
      expect(result.status).toBe(AccountingMissionStatus.FAILED);
      expect(result.error).toBe("Something broke");
    });

    it("sets UNKNOWN when isTimeout is true", () => {
      const result = missionReducer(INITIAL_STATE, {
        type: "ERROR_OCCURRED",
        error: "Request timed out",
        isTimeout: true,
      });
      expect(result.status).toBe(AccountingMissionStatus.UNKNOWN);
      expect(result.error).toBe("Request timed out");
    });
  });

  describe("RESET", () => {
    it("returns INITIAL_STATE", () => {
      const result = missionReducer(
        {
          status: AccountingMissionStatus.COMPLETED,
          progress: 10000,
          steps: [{ id: "s1", name: "done", status: "COMPLETED" }],
          currentStep: "done",
          blockers: [],
          proposal: null,
          version: 5,
          rejection: null,
          receiptId: "r1",
          receiptHash: "h1",
          error: null,
          isMockMode: false,
          lastEventSequence: 10,
        },
        { type: "RESET" },
      );
      expect(result).toEqual(INITIAL_STATE);
    });
  });
});
