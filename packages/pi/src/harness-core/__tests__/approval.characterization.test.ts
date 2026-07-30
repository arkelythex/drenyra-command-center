/**
 * Characterization tests for ApprovalWorkflow.
 *
 * These tests capture current behavior BEFORE migration to Pi SDK.
 * They serve as parity contracts for the post-migration adapter.
 *
 * @module @drenyra/pi/harness-core
 */

import { describe, expect, it } from "vitest";
import { ApprovalWorkflow } from "../approval";

describe("ApprovalWorkflow — characterization", () => {
	it("should auto-approve when no gates are registered", async () => {
		const workflow = new ApprovalWorkflow();
		const results = await workflow.evaluate({
			agentId: "test-agent",
			task: "submit any task",
			runId: "run-1",
		});

		expect(results).toHaveLength(1);
		expect(results[0].gate).toBe("__default__");
		expect(results[0].approved).toBe(true);
	});

	it("should evaluate gates in registration order", async () => {
		const workflow = new ApprovalWorkflow();
		const order: string[] = [];

		workflow.addGate({
			name: "gate-a",
			description: "First gate",
			condition: () => true,
			handler: async () => { order.push("a"); return true; },
		});
		workflow.addGate({
			name: "gate-b",
			description: "Second gate",
			condition: () => true,
			handler: async () => { order.push("b"); return true; },
		});

		await workflow.evaluate({
			agentId: "agent-1",
			task: "any task",
			runId: "run-1",
		});

		expect(order).toEqual(["a", "b"]);
	});

	it("should only evaluate gates whose condition matches the task", async () => {
		const workflow = new ApprovalWorkflow();
		let gateBEvaluated = false;

		workflow.addGate({
			name: "gate-a",
			description: "Matches submit",
			condition: (task) => task.includes("submit"),
			handler: async () => true,
		});
		workflow.addGate({
			name: "gate-b",
			description: "Only for delete",
			condition: (task) => task.includes("delete"),
			handler: async () => { gateBEvaluated = true; return true; },
		});

		const results = await workflow.evaluate({
			agentId: "agent-1",
			task: "submit invoice",
			runId: "run-1",
		});

		expect(results).toHaveLength(1);
		expect(results[0].gate).toBe("gate-a");
		expect(gateBEvaluated).toBe(false);
	});

	it("should reject when a gate handler returns false", async () => {
		const workflow = new ApprovalWorkflow();
		workflow.addGate({
			name: "restrictive-gate",
			description: "Rejects everything",
			condition: () => true,
			handler: async () => false,
		});

		const results = await workflow.evaluate({
			agentId: "agent-1",
			task: "anything",
			runId: "run-1",
		});

		expect(results).toHaveLength(1);
		expect(results[0].approved).toBe(false);
		expect(results[0].reason).toContain("restrictive-gate");
	});

	it("should reject when gate matches but has no handler", async () => {
		const workflow = new ApprovalWorkflow();
		workflow.addGate({
			name: "no-handler-gate",
			description: "Has no handler",
			condition: () => true,
		});

		const results = await workflow.evaluate({
			agentId: "agent-1",
			task: "something",
			runId: "run-1",
		});

		expect(results).toHaveLength(1);
		expect(results[0].approved).toBe(false);
		expect(results[0].reason).toContain("no handler is registered");
	});

	it("should allow removing a gate by name", () => {
		const workflow = new ApprovalWorkflow();
		workflow.addGate({
			name: "removable",
			description: "Will be removed",
			condition: () => true,
		});

		expect(workflow.getGates()).toHaveLength(1);
		expect(workflow.removeGate("removable")).toBe(true);
		expect(workflow.getGates()).toHaveLength(0);
	});

	it("should return false when removing non-existent gate", () => {
		const workflow = new ApprovalWorkflow();
		expect(workflow.removeGate("nonexistent")).toBe(false);
	});

	it('should return true from taskRequiresApproval when agentRequiresApproval is true', () => {
		const workflow = new ApprovalWorkflow();
		expect(workflow.taskRequiresApproval("any task", true)).toBe(true);
	});

	it("should clear all gates", () => {
		const workflow = new ApprovalWorkflow();
		workflow.addGates([
			{ name: "g1", description: "Gate 1", condition: () => false },
			{ name: "g2", description: "Gate 2", condition: () => false },
		]);

		workflow.clear();
		expect(workflow.getGates()).toHaveLength(0);
	});

	it("should return matching gate results for all matching gates", async () => {
		const workflow = new ApprovalWorkflow();
		workflow.addGates([
			{
				name: "high-value",
				description: "High value",
				condition: (task) => task.includes("5000"),
				handler: async () => true,
			},
			{
				name: "foreign",
				description: "Foreign transaction",
				condition: (task) => task.includes("foreign"),
				handler: async () => false,
			},
		]);

		const results = await workflow.evaluate({
			agentId: "agent-1",
			task: "transfer 5000 USD foreign",
			runId: "run-1",
		});

		expect(results).toHaveLength(2);
		const highValue = results.find((r) => r.gate === "high-value");
		const foreign = results.find((r) => r.gate === "foreign");
		expect(highValue?.approved).toBe(true);
		expect(foreign?.approved).toBe(false);
	});
});
