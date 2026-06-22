import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logAgentDecisionMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("../../agent-audit-trail", () => ({
	logAgentDecision: logAgentDecisionMock,
}));

import { enqueueSwarmAuditLog } from "../../api/audit-log-bridge";

const baseInput = {
	agentName: "test-agent",
	decisionType: "TEST_DECISION",
	inputs: {},
	outputs: {},
};

describe("enqueueSwarmAuditLog", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		logAgentDecisionMock.mockClear();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns an explicit no-op result when organization context is missing", () => {
		const result = enqueueSwarmAuditLog({
			...baseInput,
			organizationId: null,
		});

		expect(result).toEqual({
			queued: false,
			reason: "missing-organization-context",
		});
		expect(logAgentDecisionMock).not.toHaveBeenCalled();
	});

	it("returns an explicit no-op result for non-positive organization IDs", () => {
		const result = enqueueSwarmAuditLog({
			...baseInput,
			organizationId: 0,
		});

		expect(result).toEqual({
			queued: false,
			reason: "missing-organization-context",
		});
		expect(logAgentDecisionMock).not.toHaveBeenCalled();
	});

	it("does not hit the database in normal test runs", () => {
		process.env.NODE_ENV = "test";
		delete process.env.RUN_DB_TESTS;

		const result = enqueueSwarmAuditLog({
			...baseInput,
			organizationId: 42,
		});

		expect(result).toEqual({ queued: false, reason: "test-db-disabled" });
		expect(logAgentDecisionMock).not.toHaveBeenCalled();
	});
});
