import type { ThreadProps, ThreadStatus } from "./types";

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertValidThreadProps(props: ThreadProps): void {
	if (!props.id || typeof props.id !== "string") {
		throw new Error("Thread id is required and must be a string");
	}

	if (!props.companyId || typeof props.companyId !== "string") {
		throw new Error("Thread companyId is required and must be a string");
	}

	if (!props.title || props.title.trim().length === 0) {
		throw new Error("Thread title is required");
	}

	if (props.title.length > 200) {
		throw new Error("Thread title must be at most 200 characters");
	}

	if (props.description && props.description.length > 2000) {
		throw new Error("Thread description must be at most 2000 characters");
	}

	if (props.period && !PERIOD_PATTERN.test(props.period)) {
		throw new Error(
			"Thread period must match the pattern YYYY-MM (e.g. 2026-06)",
		);
	}

	if (props.tags) {
		if (!Array.isArray(props.tags)) {
			throw new Error("Thread tags must be an array");
		}
		if (props.tags.length > 10) {
			throw new Error("Thread tags must have at most 10 items");
		}
		for (const tag of props.tags) {
			if (typeof tag !== "string" || tag.trim().length === 0) {
				throw new Error("Each tag must be a non-empty string");
			}
			if (tag.length > 50) {
				throw new Error("Each tag must be at most 50 characters");
			}
		}
	}

	if (!Array.isArray(props.tasks)) {
		throw new Error("Thread tasks must be an array");
	}

	if (!Array.isArray(props.agentAssignments)) {
		throw new Error("Thread agentAssignments must be an array");
	}

	if (!Array.isArray(props.evidenceIds)) {
		throw new Error("Thread evidenceIds must be an array");
	}
}

export function assertValidTransition(
	currentStatus: ThreadStatus,
	nextStatus: ThreadStatus,
): void {
	const transitions: Record<ThreadStatus, ThreadStatus[]> = {
		DRAFT: ["ACTIVE"],
		ACTIVE: ["BLOCKED", "PENDING_REVIEW", "AWAITING_INFO"],
		BLOCKED: ["ACTIVE"],
		PENDING_REVIEW: ["REVIEWED", "ACTIVE", "AWAITING_INFO"],
		AWAITING_INFO: ["PENDING_REVIEW", "ACTIVE"],
		REVIEWED: ["CLOSED"],
		CLOSED: [],
	};

	const allowed = transitions[currentStatus];
	if (!allowed.includes(nextStatus)) {
		throw new Error(
			`Cannot transition from ${currentStatus} to ${nextStatus}`,
		);
	}
}

export function assertThreadCanActivate(tasks: { status: string }[]): void {
	if (!tasks || tasks.length === 0) {
		throw new Error("Cannot activate a thread without at least one task");
	}
}

export function assertThreadCanSubmitForReview(
	tasks: { status: string }[],
): void {
	if (!tasks || tasks.length === 0) {
		throw new Error(
			"Cannot submit a thread for review without at least one task",
		);
	}

	const allCompleted = tasks.every(
		(t) => t.status === "COMPLETED" || t.status === "SKIPPED",
	);
	if (!allCompleted) {
		throw new Error(
			"Cannot submit for review until all tasks are completed or skipped",
		);
	}
}

export function assertThreadNotClosed(status: ThreadStatus): void {
	if (status === "CLOSED") {
		throw new Error("Thread is closed and cannot be modified");
	}
}

export function assertValidDate(value: string, field: string): Date {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date for ${field}: ${value}`);
	}
	return date;
}
