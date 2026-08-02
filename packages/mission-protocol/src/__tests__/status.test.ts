import { describe, expect, it } from "vitest";
import {
	AccountingMissionStatus,
	EXTENDED_STATES,
	isExecutionState,
	isRecoverable,
	isResumable,
	isTerminal,
	isWaitingForHuman,
	isWaitState,
	STATUS_LABELS,
	VALID_TRANSITIONS,
	WaitReason,
	waitReasonFor,
} from "../index.js";

const S = AccountingMissionStatus;

describe("M4 extended states", () => {
	it("has 15 states including 3 M4 additions", () => {
		const allStates = Object.values(AccountingMissionStatus);
		expect(allStates).toHaveLength(15);
		expect(allStates).toContain("WAITING_FOR_EVIDENCE");
		expect(allStates).toContain("BLOCKED_BY_GATE");
		expect(allStates).toContain("RETRYING");
	});

	it("WAITING_FOR_EVIDENCE transitions correctly", () => {
		const transitions = VALID_TRANSITIONS.get(S.WAITING_FOR_EVIDENCE)!;
		expect(transitions.has(S.RUNNING)).toBe(true);
		expect(transitions.has(S.FAILED)).toBe(true);
		expect(transitions.has(S.COMPLETED)).toBe(false);
	});

	it("BLOCKED_BY_GATE transitions correctly", () => {
		const transitions = VALID_TRANSITIONS.get(S.BLOCKED_BY_GATE)!;
		expect(transitions.has(S.RUNNING)).toBe(true);
		expect(transitions.has(S.AWAITING_APPROVAL)).toBe(true);
		expect(transitions.has(S.FAILED)).toBe(true);
		expect(transitions.has(S.COMPLETED)).toBe(false);
	});

	it("RETRYING transitions correctly", () => {
		const transitions = VALID_TRANSITIONS.get(S.RETRYING)!;
		expect(transitions.has(S.RUNNING)).toBe(true);
		expect(transitions.has(S.FAILED)).toBe(true);
		expect(transitions.has(S.COMPLETED)).toBe(false);
	});

	it("RUNNING can transition to extended states", () => {
		const transitions = VALID_TRANSITIONS.get(S.RUNNING)!;
		expect(transitions.has(S.WAITING_FOR_EVIDENCE)).toBe(true);
		expect(transitions.has(S.BLOCKED_BY_GATE)).toBe(true);
		expect(transitions.has(S.RETRYING)).toBe(true);
	});

	it("isWaitingForHuman includes extended + approval states", () => {
		expect(isWaitingForHuman(S.WAITING_FOR_EVIDENCE)).toBe(true);
		expect(isWaitingForHuman(S.BLOCKED_BY_GATE)).toBe(true);
		expect(isWaitingForHuman(S.BLOCKED)).toBe(true);
		expect(isWaitingForHuman(S.AWAITING_APPROVAL)).toBe(true);
		expect(isWaitingForHuman(S.RUNNING)).toBe(false);
		expect(isWaitingForHuman(S.COMPLETED)).toBe(false);
	});

	it("isRecoverable includes all non-terminal paused states", () => {
		expect(isRecoverable(S.WAITING_FOR_EVIDENCE)).toBe(true);
		expect(isRecoverable(S.BLOCKED_BY_GATE)).toBe(true);
		expect(isRecoverable(S.BLOCKED)).toBe(true);
		expect(isRecoverable(S.RETRYING)).toBe(true);
		expect(isRecoverable(S.UNKNOWN)).toBe(true);
		expect(isRecoverable(S.REVISION_REQUESTED)).toBe(true);
		expect(isRecoverable(S.COMPLETED)).toBe(false);
		expect(isRecoverable(S.FAILED)).toBe(false);
	});

	it("isResumable includes runnable + resumable states", () => {
		expect(isResumable(S.DRAFT)).toBe(true);
		expect(isResumable(S.QUEUED)).toBe(true);
		expect(isResumable(S.WAITING_FOR_EVIDENCE)).toBe(true);
		expect(isResumable(S.BLOCKED_BY_GATE)).toBe(true);
		expect(isResumable(S.RETRYING)).toBe(true);
		expect(isResumable(S.UNKNOWN)).toBe(true);
		expect(isResumable(S.COMPLETED)).toBe(false);
		expect(isResumable(S.FAILED)).toBe(false);
	});

	it("classifies execution, wait, and terminal states without overlap", () => {
		expect(isExecutionState(S.RUNNING)).toBe(true);
		expect(isExecutionState(S.APPROVED)).toBe(true);
		expect(isExecutionState(S.WAITING_FOR_EVIDENCE)).toBe(false);
		expect(isWaitState(S.WAITING_FOR_EVIDENCE)).toBe(true);
		expect(isWaitState(S.UNKNOWN)).toBe(true);
		expect(isWaitState(S.COMPLETED)).toBe(false);
		expect(isExecutionState(S.COMPLETED)).toBe(false);
	});

	it("maps every wait state to its formal reason", () => {
		expect(waitReasonFor(S.WAITING_FOR_EVIDENCE)).toBe(WaitReason.EVIDENCE);
		expect(waitReasonFor(S.AWAITING_APPROVAL)).toBe(WaitReason.APPROVAL);
		expect(waitReasonFor(S.BLOCKED_BY_GATE)).toBe(WaitReason.POLICY_GATE);
		expect(waitReasonFor(S.BLOCKED)).toBe(WaitReason.MANUAL_INTERVENTION);
		expect(waitReasonFor(S.RETRYING)).toBe(WaitReason.EXTERNAL_SYSTEM);
		expect(waitReasonFor(S.UNKNOWN)).toBe(WaitReason.EXTERNAL_SYSTEM);
		expect(waitReasonFor(S.RUNNING)).toBeNull();
	});

	it("terminal states remain unchanged", () => {
		expect(isTerminal(S.COMPLETED)).toBe(true);
		expect(isTerminal(S.FAILED)).toBe(true);
		expect(isTerminal(S.RUNNING)).toBe(false);
	});

	it("has human-readable labels for all states", () => {
		for (const status of Object.values(AccountingMissionStatus)) {
			expect(STATUS_LABELS[status]).toBeDefined();
			expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
		}
	});

	it("EXTENDED_STATES contains M4 pause states", () => {
		expect(EXTENDED_STATES.has(S.WAITING_FOR_EVIDENCE)).toBe(true);
		expect(EXTENDED_STATES.has(S.BLOCKED_BY_GATE)).toBe(true);
		expect(EXTENDED_STATES.has(S.BLOCKED)).toBe(true);
		expect(EXTENDED_STATES.has(S.RUNNING)).toBe(false);
	});
});
