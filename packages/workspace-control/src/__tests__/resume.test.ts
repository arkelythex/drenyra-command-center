import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	LIFECYCLE_STATE,
} from "@drenyra/workspace-domain";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
	InMemoryAuthorityStore,
} from "@drenyra/workspace-application";
import {
	InMemoryEventStore,
	CURRENT_EVENT_SCHEMA_VERSION,
	type DomainEvent,
} from "@drenyra/workspace-projections";
import { resumeWorkspace } from "../resume/service";
import type { ResumeRequest } from "../resume/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
	return {
		eventId: crypto.randomUUID(),
		executionId: createExecutionId(),
		sequence: 1,
		type: "execution.started",
		payload: {},
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.PI,
		timestamp: "2026-07-15T10:00:00.000Z",
		schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("resumeWorkspace", () => {
	it("should return empty result for no executions", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();

		const request: ResumeRequest = {
			workspaceId: "ws-1",
			executionIds: [],
		};

		const result = resumeWorkspace(request, store, authorityStore);

		expect(result.workspaceId).toBe("ws-1");
		expect(result.executionStates).toHaveLength(0);
		expect(result.attended).toBe(0);
		expect(result.total).toBe(0);
	});

	it("should return correct state for one execution", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
		);
		store.append(
			makeEvent({ executionId, sequence: 2, type: "execution.completed" }),
		);

		const request: ResumeRequest = {
			workspaceId: "ws-1",
			executionIds: [executionId],
		};

		const result = resumeWorkspace(request, store, authorityStore);

		expect(result.total).toBe(1);
		expect(result.executionStates).toHaveLength(1);
		expect(result.executionStates[0]!.executionId).toBe(executionId);
		expect(result.executionStates[0]!.currentState.lifecycle).toBe(
			LIFECYCLE_STATE.COMPLETED,
		);
	});

	it("should return all execution states for multiple executions", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();

		const exec1 = createExecutionId();
		const exec2 = createExecutionId();
		const exec3 = createExecutionId();

		store.append(makeEvent({ executionId: exec1, sequence: 1, type: "execution.started" }));
		store.append(makeEvent({ executionId: exec2, sequence: 1, type: "execution.started" }));
		store.append(makeEvent({ executionId: exec3, sequence: 1, type: "execution.started" }));

		const request: ResumeRequest = {
			workspaceId: "ws-multi",
			executionIds: [exec1, exec2, exec3],
		};

		const result = resumeWorkspace(request, store, authorityStore);

		expect(result.total).toBe(3);
		expect(result.executionStates).toHaveLength(3);
	});

	it("should categorize live vs unavailable correctly", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();

		const liveExec = createExecutionId();
		const unavailableExec = createExecutionId();

		store.append(makeEvent({ executionId: liveExec, sequence: 1, type: "execution.started" }));
		// unavailableExec has no events

		const request: ResumeRequest = {
			workspaceId: "ws-cat",
			executionIds: [liveExec, unavailableExec],
		};

		const result = resumeWorkspace(request, store, authorityStore);

		const live = result.executionStates.find(
			(s) => s.executionId === liveExec,
		);
		const unavailable = result.executionStates.find(
			(s) => s.executionId === unavailableExec,
		);

		expect(live!.status).toBe("live");
		expect(unavailable!.status).toBe("unavailable");
	});

	it("should count caughtUpEvents correctly in resume", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId, sequence: 1, type: "execution.started" }));
		store.append(
			makeEvent({ executionId, sequence: 2, type: "execution.attention.changed", payload: { attention: "blocked" } }),
		);

		const request: ResumeRequest = {
			workspaceId: "ws-count",
			executionIds: [executionId],
		};

		const result = resumeWorkspace(request, store, authorityStore);

		expect(result.executionStates[0]!.caughtUpEvents).toBe(2);
		expect(result.executionStates[0]!.lastSequence).toBe(2);
	});

	it("should handle mix of known and unknown executionIds", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();

		const knownExec = createExecutionId();
		const unknownExec = createExecutionId();

		store.append(makeEvent({ executionId: knownExec, sequence: 1, type: "execution.started" }));

		const request: ResumeRequest = {
			workspaceId: "ws-mix",
			executionIds: [knownExec, unknownExec],
		};

		const result = resumeWorkspace(request, store, authorityStore);

		expect(result.total).toBe(2);
		const known = result.executionStates.find((s) => s.executionId === knownExec);
		const unknown = result.executionStates.find(
			(s) => s.executionId === unknownExec,
		);

		expect(known!.status).toBe("live");
		expect(unknown!.status).toBe("unavailable");
		expect(unknown!.currentState.lifecycle).toBe(LIFECYCLE_STATE.QUEUED);
	});

	it("should report status=live for execution with events", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));

		const request: ResumeRequest = {
			workspaceId: "ws-live",
			executionIds: [executionId],
		};

		const result = resumeWorkspace(request, store, authorityStore);
		expect(result.executionStates[0]!.status).toBe("live");
	});

	it("should report status=unavailable (not error) for execution without events", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		const request: ResumeRequest = {
			workspaceId: "ws-unavail",
			executionIds: [executionId],
		};

		const result = resumeWorkspace(request, store, authorityStore);
		expect(result.executionStates[0]!.status).toBe("unavailable");
		// Should still succeed — unavailable is not an error
	});
});
