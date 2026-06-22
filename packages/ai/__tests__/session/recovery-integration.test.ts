/**
 * Session Recovery Integration Tests
 * Full-cycle tests that mock the SessionStore and verify the
 * complete recovery flow: save → fail → check → recover → resume context.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionRecovery, SessionRecoveryError } from "../../src/session/session-recovery";
import type { SessionStore } from "../../src/session/session-store";
import type { AgentRunState, RunInput } from "../../src/session/session.types";

// ============================================================================
// Helpers
// ============================================================================

function sha256(str: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(str).digest("hex");
}

// ============================================================================
// In-memory SessionStore for integration tests
// ============================================================================

/**
 * Minimal in-memory SessionStore implementation.
 * Simulates the full persistence layer without a real database.
 */
class InMemorySessionStore implements SessionStore {
  private states = new Map<string, AgentRunState>();
  private events: Array<{
    runId: string;
    eventType: string;
    payload: Record<string, unknown> | null;
    companyId: string;
    createdAt: Date;
  }> = [];
  private inputs = new Map<string, RunInput>();

  async saveRunState(runId: string, state: Partial<AgentRunState>): Promise<void> {
    const existing = this.states.get(runId);
    this.states.set(runId, {
      id: state.id ?? existing?.id ?? runId,
      runId,
      sessionId: state.sessionId ?? existing?.sessionId ?? null,
      workflowState: state.workflowState ?? existing?.workflowState ?? null,
      agentMetrics: state.agentMetrics ?? existing?.agentMetrics ?? null,
      context: state.context ?? existing?.context ?? null,
      status: state.status ?? existing?.status ?? "running",
      error: state.error ?? existing?.error ?? null,
      companyId: state.companyId ?? existing?.companyId ?? "",
      startedAt: state.startedAt ?? existing?.startedAt ?? new Date(),
      completedAt: state.completedAt ?? existing?.completedAt ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    } as AgentRunState);
  }

  async getRunState(runId: string): Promise<AgentRunState | null> {
    return this.states.get(runId) ?? null;
  }

  async listRunStates(): Promise<AgentRunState[]> {
    return Array.from(this.states.values());
  }

  async appendEvent(runId: string, event: {
    runId: string;
    eventType: string;
    payload: Record<string, unknown> | null;
    companyId: string;
  }): Promise<void> {
    this.events.push({
      runId: event.runId,
      eventType: event.eventType,
      payload: event.payload,
      companyId: event.companyId,
      createdAt: new Date(),
    });
  }

  async getEvents(runId: string, limit?: number): Promise<any[]> {
    return this.events
      .filter((e) => e.runId === runId)
      .slice(0, limit ?? 100);
  }

  async updateRunState(runId: string, partial: Partial<AgentRunState>): Promise<void> {
    const existing = this.states.get(runId);
    if (!existing) throw new Error(`Run state not found: ${runId}`);
    Object.assign(existing, partial, { updatedAt: new Date() });
  }

  async recoverRunState(runId: string): Promise<{ state: AgentRunState; events: any[] } | null> {
    const state = await this.getRunState(runId);
    if (!state) return null;
    const events = await this.getEvents(runId, 50);
    return { state, events };
  }

  async saveInput(runId: string, inputType: string, inputData: string, checksum: string): Promise<void> {
    this.inputs.set(runId, {
      runId,
      inputType,
      inputData,
      checksum,
      createdAt: new Date(),
    });
  }

  async getInput(runId: string): Promise<RunInput | null> {
    return this.inputs.get(runId) ?? null;
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("Session Recovery Integration", () => {
  let store: InMemorySessionStore;
  let recovery: SessionRecovery;

  beforeEach(() => {
    store = new InMemorySessionStore();
    recovery = new SessionRecovery(store);
  });

  describe("full recovery cycle", () => {
    it("should complete a full save → fail → check → recover → resume cycle", async () => {
      const runId = "run-full-cycle";
      const inputData = "original-invoice-data";
      const inputChecksum = sha256(inputData);

      // Step 1: Save initial run state and input
      await store.saveRunState(runId, {
        companyId: "company-a-uuid",
        workflowState: "EXTRACTING",
        status: "running",
        context: { inputType: "invoice_image" },
        startedAt: new Date(),
      });
      await store.saveInput(runId, "image", inputData, inputChecksum);

      // Step 2: Simulate failure
      await store.updateRunState(runId, {
        workflowState: "EXTRACTING",
        status: "failed",
        error: "OCR service unavailable",
      });

      // Step 3: Check recoverability
      const check = await recovery.checkRecoverable(runId);
      expect(check.recoverable).toBe(true);
      expect(check.status).toBe("failed");
      expect(check.workflowState).toBe("EXTRACTING");

      // Step 4: Recover with matching input
      const result = await recovery.recover(runId, inputData, "image");

      // Step 5: Verify recovery context
      expect(result.context).toBeDefined();
      expect(result.context.runId).toBe(runId);
      expect(result.context.lastCompletedPhase).toBe("reader");
      expect(result.context.skippedPhases).toEqual(["reader"]);

      // Step 6: Verify RECOVERY_STARTED event was appended
      const events = await store.getEvents(runId);
      const recoveryEvent = events.find((e) => e.eventType === "RECOVERY_STARTED");
      expect(recoveryEvent).toBeDefined();
      expect(recoveryEvent!.payload!.lastCompletedPhase).toBe("reader");
      expect(recoveryEvent!.payload!.previousWorkflowState).toBe("EXTRACTING");
    });

    it("should fail recovery when input checksum does not match", async () => {
      const runId = "run-checksum-mismatch";
      const originalData = "original-data";
      const tamperedData = "tampered-data";

      // Save with original
      await store.saveRunState(runId, {
        companyId: "company-a-uuid",
        workflowState: "EXTRACTING",
        status: "failed",
      });
      await store.saveInput(runId, "image", originalData, sha256(originalData));

      // Attempt recovery with tampered data
      await expect(
        recovery.recover(runId, tamperedData, "image"),
      ).rejects.toThrow(SessionRecoveryError);

      try {
        await recovery.recover(runId, tamperedData, "image");
      } catch (error) {
        expect((error as SessionRecoveryError).code).toBe("checksum_mismatch");
      }
    });

    it("should round-trip input data correctly", async () => {
      const runId = "run-roundtrip";
      const inputData = Buffer.from(
        JSON.stringify({
          fileName: "invoice_001.pdf",
          pages: 3,
          sizeBytes: 204800,
          contentHash: "abc123",
        }),
      ).toString("base64");
      const inputChecksum = sha256(inputData);
      const inputType = "pdf";

      // Save
      await store.saveInput(runId, inputType, inputData, inputChecksum);

      // Read back
      const retrieved = await store.getInput(runId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.inputData).toBe(inputData);
      expect(retrieved!.inputType).toBe(inputType);
      expect(retrieved!.checksum).toBe(inputChecksum);

      // Verify checksum integrity
      const verifiedChecksum = sha256(retrieved!.inputData);
      expect(verifiedChecksum).toBe(retrieved!.checksum);
    });

    it("should handle recovery after degraded status with multiple phases completed", async () => {
      const runId = "run-degraded-cycle";
      const inputData = "advance-data";
      const inputChecksum = sha256(inputData);

      // Simulate a run that completed EXTRACTING, PARSING, then degraded at VALIDATING
      await store.saveRunState(runId, {
        companyId: "company-a-uuid",
        workflowState: "VALIDATING",
        status: "running",
        startedAt: new Date(),
      });
      await store.saveInput(runId, "xml", inputData, inputChecksum);

      // Degrade
      await store.updateRunState(runId, {
        status: "degraded",
        error: "Validation agent ran out of memory",
      });

      // Check and recover
      const check = await recovery.checkRecoverable(runId);
      expect(check.recoverable).toBe(true);

      const result = await recovery.recover(runId, inputData, "xml");
      expect(result.context.lastCompletedPhase).toBe("validator");
      expect(result.context.skippedPhases).toEqual([
        "reader",
        "parser",
        "validator",
      ]);

      // Verify the RECOVERY_STARTED event has context from the advanced state
      const events = await store.getEvents(runId);
      const recoveryEvent = events.find((e) => e.eventType === "RECOVERY_STARTED");
      expect(recoveryEvent!.payload!.lastCompletedPhase).toBe("validator");
    });

    it("should maintain event ordering during recovery", async () => {
      const runId = "run-event-order";

      // Initial setup
      await store.saveRunState(runId, {
        companyId: "company-a-uuid",
        workflowState: "IDLE",
        status: "running",
      });
      await store.saveInput(runId, "image", "base64-data", sha256("base64-data"));

      // Append events in sequence
      await store.appendEvent(runId, {
        runId,
        eventType: "RUN_STARTED",
        payload: null,
        companyId: "company-a-uuid",
      });
      await store.appendEvent(runId, {
        runId,
        eventType: "EXTRACTION_STARTED",
        payload: null,
        companyId: "company-a-uuid",
      });

      // Fail
      await store.updateRunState(runId, {
        workflowState: "EXTRACTING",
        status: "failed",
        error: "Timeout",
      });

      // Recover
      const result = await recovery.recover(runId, "base64-data", "image");

      // Verify events include both original events + RECOVERY_STARTED
      const allEvents = await store.getEvents(runId);
      expect(allEvents).toHaveLength(3);
      expect(allEvents[0].eventType).toBe("RUN_STARTED");
      expect(allEvents[1].eventType).toBe("EXTRACTION_STARTED");
      expect(allEvents[2].eventType).toBe("RECOVERY_STARTED");
    });
  });
});
