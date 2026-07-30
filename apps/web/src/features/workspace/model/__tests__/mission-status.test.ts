import { describe, expect, it } from "vitest";
import {
	transition,
	isRunnable,
	isAwaitingApproval,
	isTerminal,
} from "@drenyra/mission-domain";

describe("AccountingMissionStatus — state machine", () => {
	it("DRAFT → QUEUED is valid", () => {
		expect(transition("DRAFT", "QUEUED")).toBe("QUEUED");
	});

	it("QUEUED → RUNNING is valid", () => {
		expect(transition("QUEUED", "RUNNING")).toBe("RUNNING");
	});

	it("RUNNING → AWAITING_APPROVAL is valid", () => {
		expect(transition("RUNNING", "AWAITING_APPROVAL")).toBe("AWAITING_APPROVAL");
	});

	it("RUNNING → COMPLETED is valid (no approval needed)", () => {
		expect(transition("RUNNING", "COMPLETED")).toBe("COMPLETED");
	});

	it("RUNNING → BLOCKED is valid", () => {
		expect(transition("RUNNING", "BLOCKED")).toBe("BLOCKED");
	});

	it("RUNNING → UNKNOWN is valid (connection loss)", () => {
		expect(transition("RUNNING", "UNKNOWN")).toBe("UNKNOWN");
	});

	it("AWAITING_APPROVAL → APPROVED → COMPLETED", () => {
		expect(transition("AWAITING_APPROVAL", "APPROVED")).toBe("APPROVED");
		expect(transition("APPROVED", "COMPLETED")).toBe("COMPLETED");
	});

	it("AWAITING_APPROVAL → REJECTED → REVISION_REQUESTED → QUEUED", () => {
		expect(transition("AWAITING_APPROVAL", "REJECTED")).toBe("REJECTED");
		expect(transition("REJECTED", "REVISION_REQUESTED")).toBe("REVISION_REQUESTED");
		expect(transition("REVISION_REQUESTED", "QUEUED")).toBe("QUEUED");
	});

	it("UNKNOWN → RUNNING is valid (recovery)", () => {
		expect(transition("UNKNOWN", "RUNNING")).toBe("RUNNING");
	});

	it("DRAFT → AWAITING_APPROVAL throws", () => {
		expect(() => transition("DRAFT", "AWAITING_APPROVAL")).toThrow();
	});

	it("DRAFT → COMPLETED throws", () => {
		expect(() => transition("DRAFT", "COMPLETED")).toThrow();
	});

	it("COMPLETED → QUEUED throws (terminal)", () => {
		expect(() => transition("COMPLETED", "QUEUED")).toThrow();
	});

	it("FAILED → QUEUED throws (terminal)", () => {
		expect(() => transition("FAILED", "QUEUED")).toThrow();
	});

	it("REJECTED → APPROVED throws (must go through REVISION)", () => {
		expect(() => transition("REJECTED", "APPROVED")).toThrow();
	});

	it("isRunnable returns true for DRAFT, QUEUED, REVISION_REQUESTED", () => {
		expect(isRunnable("DRAFT")).toBe(true);
		expect(isRunnable("QUEUED")).toBe(true);
		expect(isRunnable("REVISION_REQUESTED")).toBe(true);
		expect(isRunnable("RUNNING")).toBe(false);
		expect(isRunnable("COMPLETED")).toBe(false);
	});

	it("isAwaitingApproval returns true only for AWAITING_APPROVAL", () => {
		expect(isAwaitingApproval("AWAITING_APPROVAL")).toBe(true);
		expect(isAwaitingApproval("DRAFT")).toBe(false);
		expect(isAwaitingApproval("APPROVED")).toBe(false);
	});

	it("isTerminal returns true for COMPLETED, FAILED only (REJECTED is NOT terminal)", () => {
		expect(isTerminal("COMPLETED")).toBe(true);
		expect(isTerminal("FAILED")).toBe(true);
		expect(isTerminal("REJECTED")).toBe(false);
		expect(isTerminal("RUNNING")).toBe(false);
		expect(isTerminal("DRAFT")).toBe(false);
	});
});
