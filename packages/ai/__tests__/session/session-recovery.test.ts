/**
 * SessionRecovery tests — validates recovery logic for failed/degraded agent runs.
 *
 * Covers: checkRecoverable, recover, checksum validation, error handling.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentRunState, RunInput } from "../../src/session/session.types";
import {
	SessionRecovery,
	SessionRecoveryError,
} from "../../src/session/session-recovery";
import type { SessionStore } from "../../src/session/session-store";

// ============================================================================
// Mock SessionStore
// ============================================================================

function createMockStore() {
	return {
		saveRunState: vi.fn(),
		getRunState: vi.fn(),
		listRunStates: vi.fn(),
		appendEvent: vi.fn(),
		getEvents: vi.fn(),
		updateRunState: vi.fn(),
		recoverRunState: vi.fn(),
		saveInput: vi.fn(),
		getInput: vi.fn(),
	} satisfies SessionStore;
}

// ============================================================================
// Test Data
// ============================================================================

const runningState: AgentRunState = {
	id: "state-uuid-1",
	runId: "run-running",
	sessionId: null,
	workflowState: "EXTRACTING",
	agentMetrics: null,
	context: { inputType: "invoice_image" },
	status: "running",
	error: null,
	companyId: "company-a-uuid",
	startedAt: new Date("2026-06-15T10:00:00Z"),
	completedAt: null,
	createdAt: new Date("2026-06-15T10:00:00Z"),
	updatedAt: new Date("2026-06-15T10:00:00Z"),
};

const completedState: AgentRunState = {
	...runningState,
	runId: "run-completed",
	workflowState: "COMPLETED",
	status: "completed",
	completedAt: new Date("2026-06-15T10:05:00Z"),
};

const failedState: AgentRunState = {
	...runningState,
	runId: "run-failed",
	workflowState: "EXTRACTING",
	status: "failed",
	error: "Reader agent failed",
};

const degradedState: AgentRunState = {
	...runningState,
	runId: "run-degraded",
	workflowState: "VALIDATING",
	status: "degraded",
	error: "Parser agent degraded",
};

const manualReviewState: AgentRunState = {
	...runningState,
	runId: "run-manual",
	workflowState: "MANUAL_REVIEW",
	status: "manual_review",
	error: "Requires human approval",
};

const storedInput: RunInput = {
	runId: "run-failed",
	inputType: "image",
	inputData: "originalBase64Data",
	checksum: "5d41402abc4b2a76b9719d911017c592", // sha256("hello")
	createdAt: new Date("2026-06-15T10:00:00Z"),
};

// ============================================================================
// sha256 hashes for test strings
// ============================================================================

function sha256(str: string): string {
	// Inline minimal hashing — we test actual crypto in integration tests
	const crypto = require("node:crypto");
	return crypto.createHash("sha256").update(str).digest("hex");
}

// ============================================================================
// Tests
// ============================================================================

describe("SessionRecovery", () => {
	let mockStore: ReturnType<typeof createMockStore>;
	let recovery: SessionRecovery;

	beforeEach(() => {
		mockStore = createMockStore();
		recovery = new SessionRecovery(mockStore);
	});

	// ---- checkRecoverable ----

	describe("checkRecoverable", () => {
		it("should return recoverable: true for a failed run with workflow state", async () => {
			mockStore.getRunState.mockResolvedValue(failedState);

			const result = await recovery.checkRecoverable("run-failed");

			expect(result.recoverable).toBe(true);
			expect(result.runId).toBe("run-failed");
			expect(result.status).toBe("failed");
			expect(result.workflowState).toBe("EXTRACTING");
			expect(result.reason).toBeUndefined();
		});

		it("should return recoverable: true for a degraded run with workflow state", async () => {
			mockStore.getRunState.mockResolvedValue(degradedState);

			const result = await recovery.checkRecoverable("run-degraded");

			expect(result.recoverable).toBe(true);
			expect(result.status).toBe("degraded");
			expect(result.workflowState).toBe("VALIDATING");
		});

		it("should return recoverable: false with reason still_running", async () => {
			mockStore.getRunState.mockResolvedValue(runningState);

			const result = await recovery.checkRecoverable("run-running");

			expect(result.recoverable).toBe(false);
			expect(result.reason).toBe("still_running");
		});

		it("should return recoverable: false with reason already_completed", async () => {
			mockStore.getRunState.mockResolvedValue(completedState);

			const result = await recovery.checkRecoverable("run-completed");

			expect(result.recoverable).toBe(false);
			expect(result.reason).toBe("already_completed");
		});

		it("should return recoverable: false with reason not_found for unknown run", async () => {
			mockStore.getRunState.mockResolvedValue(null);

			const result = await recovery.checkRecoverable("nonexistent");

			expect(result.recoverable).toBe(false);
			expect(result.reason).toBe("not_found");
		});

		it("should return recoverable: false for manual_review status", async () => {
			mockStore.getRunState.mockResolvedValue(manualReviewState);

			const result = await recovery.checkRecoverable("run-manual");

			expect(result.recoverable).toBe(false);
			expect(result.reason).toContain("unrecoverable_status");
		});

		it("should return recoverable: false for failed run without workflow state", async () => {
			mockStore.getRunState.mockResolvedValue({
				...failedState,
				workflowState: null,
			});

			const result = await recovery.checkRecoverable("run-failed-no-state");

			expect(result.recoverable).toBe(false);
			expect(result.reason).toContain("unrecoverable_status");
		});
	});

	// ---- recover ----

	describe("recover", () => {
		it("should recover a failed run when checksum matches", async () => {
			mockStore.getRunState.mockResolvedValue(failedState);
			mockStore.getInput.mockResolvedValue(storedInput);
			mockStore.appendEvent.mockResolvedValue();

			const inputData = "hello";
			const expectedChecksum = sha256(inputData);
			// Ensure the stored checksum matches
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				checksum: expectedChecksum,
			});

			const result = await recovery.recover("run-failed", inputData, "image");

			expect(result.context).toBeDefined();
			expect(result.context.runId).toBe("run-failed");
			expect(result.context.lastCompletedPhase).toBe("reader");
			expect(result.context.previousWorkflowState).toBe("EXTRACTING");
			expect(result.context.previousStatus).toBe("failed");
			expect(result.context.skippedPhases).toEqual(["reader"]);

			// Should have appended RECOVERY_STARTED event
			expect(mockStore.appendEvent).toHaveBeenCalledWith(
				"run-failed",
				expect.objectContaining({
					eventType: "RECOVERY_STARTED",
					runId: "run-failed",
				}),
			);
		});

		it("should recover a degraded run with matching checksum", async () => {
			mockStore.getRunState.mockResolvedValue(degradedState);
			const inputData = "test-input";
			const expectedChecksum = sha256(inputData);
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				runId: "run-degraded",
				checksum: expectedChecksum,
			});

			const result = await recovery.recover("run-degraded", inputData, "xml");

			expect(result.context.lastCompletedPhase).toBe("validator");
			expect(result.context.skippedPhases).toEqual([
				"reader",
				"parser",
				"validator",
			]);
		});

		it("should throw SessionRecoveryError when checksum does not match", async () => {
			mockStore.getRunState.mockResolvedValue(failedState);
			const inputData = "different-input";
			const storedDifferentChecksum = sha256("original-input");
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				checksum: storedDifferentChecksum,
			});

			await expect(
				recovery.recover("run-failed", inputData, "image"),
			).rejects.toThrow(SessionRecoveryError);

			await expect(
				recovery.recover("run-failed", inputData, "image"),
			).rejects.toThrow(/Input checksum mismatch/i);
		});

		it("should throw SessionRecoveryError with code checksum_mismatch", async () => {
			mockStore.getRunState.mockResolvedValue(failedState);
			const inputData = "tampered-data";
			const storedChecksum = sha256("original-data");
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				checksum: storedChecksum,
			});

			try {
				await recovery.recover("run-failed", inputData, "image");
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(SessionRecoveryError);
				expect((error as SessionRecoveryError).code).toBe("checksum_mismatch");
			}
		});

		it("should throw SessionRecoveryError for a running run", async () => {
			mockStore.getRunState.mockResolvedValue(runningState);

			await expect(
				recovery.recover("run-running", "data", "image"),
			).rejects.toThrow(SessionRecoveryError);

			await expect(
				recovery.recover("run-running", "data", "image"),
			).rejects.toThrow(/still running/i);
		});

		it("should throw SessionRecoveryError for a completed run", async () => {
			mockStore.getRunState.mockResolvedValue(completedState);

			await expect(
				recovery.recover("run-completed", "data", "image"),
			).rejects.toThrow(SessionRecoveryError);

			await expect(
				recovery.recover("run-completed", "data", "image"),
			).rejects.toThrow(/already completed/i);
		});

		it("should throw SessionRecoveryError for an unknown run", async () => {
			mockStore.getRunState.mockResolvedValue(null);

			await expect(
				recovery.recover("nonexistent", "data", "image"),
			).rejects.toThrow(SessionRecoveryError);

			await expect(
				recovery.recover("nonexistent", "data", "image"),
			).rejects.toThrow(/not found/i);
		});

		it("should throw SessionRecoveryError when no input data is found", async () => {
			mockStore.getRunState.mockResolvedValue(failedState);
			mockStore.getInput.mockResolvedValue(null);

			await expect(
				recovery.recover("run-failed", "data", "image"),
			).rejects.toThrow(SessionRecoveryError);

			await expect(
				recovery.recover("run-failed", "data", "image"),
			).rejects.toThrow(/No input data found/i);
		});

		it("should map workflow states to correct last completed phases", async () => {
			// PARSING → "parser"
			mockStore.getRunState.mockResolvedValue({
				...failedState,
				runId: "run-parser",
				workflowState: "PARSING",
			});
			const inputData = "parser-test";
			const checksum = sha256(inputData);
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				runId: "run-parser",
				checksum,
			});

			const result = await recovery.recover("run-parser", inputData, "image");

			expect(result.context.lastCompletedPhase).toBe("parser");
			expect(result.context.skippedPhases).toEqual(["reader", "parser"]);
		});

		it("should map VALIDATING workflow state to last completed phase 'validator'", async () => {
			mockStore.getRunState.mockResolvedValue({
				...failedState,
				runId: "run-validator",
				workflowState: "VALIDATING",
			});
			const inputData = "validator-test";
			const checksum = sha256(inputData);
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				runId: "run-validator",
				checksum,
			});

			const result = await recovery.recover(
				"run-validator",
				inputData,
				"image",
			);

			expect(result.context.lastCompletedPhase).toBe("validator");
			expect(result.context.skippedPhases).toEqual([
				"reader",
				"parser",
				"validator",
			]);
		});

		it("should map ARBITRATING workflow state to last completed phase 'arbitration'", async () => {
			mockStore.getRunState.mockResolvedValue({
				...failedState,
				runId: "run-arbitration",
				workflowState: "ARBITRATING",
			});
			const inputData = "arbitration-test";
			const checksum = sha256(inputData);
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				runId: "run-arbitration",
				checksum,
			});

			const result = await recovery.recover(
				"run-arbitration",
				inputData,
				"image",
			);

			expect(result.context.lastCompletedPhase).toBe("arbitration");
			expect(result.context.skippedPhases).toEqual([
				"reader",
				"parser",
				"validator",
				"arbitration",
			]);
		});

		it("should include previous status and skipped phases in context", async () => {
			mockStore.getRunState.mockResolvedValue(degradedState);
			const inputData = "degraded-test";
			const checksum = sha256(inputData);
			mockStore.getInput.mockResolvedValue({
				...storedInput,
				runId: "run-degraded",
				checksum,
			});

			const result = await recovery.recover("run-degraded", inputData, "pdf");

			expect(result.context).toEqual({
				runId: "run-degraded",
				lastCompletedPhase: "validator",
				previousWorkflowState: "VALIDATING",
				previousStatus: "degraded",
				skippedPhases: ["reader", "parser", "validator"],
			});
		});
	});

	// ---- SessionRecoveryError ----

	describe("SessionRecoveryError", () => {
		it("should have the correct name and code", () => {
			const error = new SessionRecoveryError("Test error", "not_found");

			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe("SessionRecoveryError");
			expect(error.code).toBe("not_found");
			expect(error.message).toBe("Test error");
		});
	});
});
