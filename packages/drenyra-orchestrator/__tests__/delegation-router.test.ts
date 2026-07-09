import { describe, it, expect } from "vitest";
import { determineRoute } from "../src/delegation-router";

describe("delegation-router", () => {
	it("returns inline-direct for small mechanical tasks", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 1,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		expect(result.route).toBe("inline-direct");
		expect(result.triggeredBy).toHaveLength(0);
	});

	it("returns simple-delegation for 4-file rule", () => {
		const result = determineRoute({
			filesToUnderstand: 4,
			filesToWrite: 1,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		expect(result.route).toBe("simple-delegation");
		expect(result.triggeredBy).toHaveLength(1);
		expect(result.triggeredBy[0]?.rule).toBe("4-file-rule");
		expect(result.recommendedSubagent).toBe("worker");
	});

	it("returns simple-delegation for multi-file write", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 2,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		expect(result.route).toBe("simple-delegation");
		expect(result.triggeredBy).toHaveLength(1);
		expect(result.triggeredBy[0]?.rule).toBe("multi-file-write");
	});

	it("returns SDD for 4+ file write", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 4,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		expect(result.route).toBe("sdd");
		expect(result.recommendedSubagent).toBe("sdd-planner");
	});

	it("returns SDD for 8+ file understanding", () => {
		const result = determineRoute({
			filesToUnderstand: 8,
			filesToWrite: 1,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		expect(result.route).toBe("sdd");
		expect(result.recommendedSubagent).toBe("sdd-explore");
	});

	it("returns SDD for long session", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 1,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 20,
			sessionExploratoryReads: 5,
			sessionNonMechanicalEdits: 3,
			isReviewTask: false,
		});
		expect(result.route).toBe("sdd");
		expect(result.recommendedSubagent).toBe("sdd-planner");
	});

	it("triggers PR rule for git workflow events", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 1,
			isGitWorkflowEvent: true,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		const prRule = result.triggeredBy.find((t) => t.rule === "pr-rule");
		expect(prRule).toBeDefined();
		expect(result.route).toBe("simple-delegation");
	});

	it("triggers incident rule for recovery tasks", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 1,
			isGitWorkflowEvent: false,
			isIncidentRecovery: true,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: false,
		});
		const incidentRule = result.triggeredBy.find(
			(t) => t.rule === "incident-rule",
		);
		expect(incidentRule).toBeDefined();
	});

	it("recommends reviewer for review tasks", () => {
		const result = determineRoute({
			filesToUnderstand: 1,
			filesToWrite: 2,
			isGitWorkflowEvent: false,
			isIncidentRecovery: false,
			sessionToolCalls: 2,
			sessionExploratoryReads: 1,
			sessionNonMechanicalEdits: 0,
			isReviewTask: true,
		});
		expect(result.recommendedSubagent).toBe("reviewer");
	});
});
