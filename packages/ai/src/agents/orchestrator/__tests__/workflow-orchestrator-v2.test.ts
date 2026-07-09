/**
 * WorkflowOrchestratorV2 — unit tests
 *
 * @group unit
 */

import { describe, expect, it } from "vitest";
import { WorkflowOrchestratorV2 } from "../workflow-v2/orchestrator";

// ── Tests ────────────────────────────────────────────────────────────

describe("WorkflowOrchestratorV2", () => {
	describe("constructor", () => {
		it("should initialize with default config", () => {
			// Creating with simple mock-like objects
			const readerAgent = { execute: () => {} } as any;
			const parserAgent = { execute: () => {} } as any;
			const validatorAgent = { execute: () => {} } as any;
			const arbitratorAgent = { arbitrate: () => [] } as any;

			const orchestrator = new WorkflowOrchestratorV2(
				readerAgent,
				parserAgent,
				validatorAgent,
				arbitratorAgent,
			);
			expect(orchestrator).toBeInstanceOf(WorkflowOrchestratorV2);
		});

		it("should initialize with custom config", () => {
			const readerAgent = { execute: () => {} } as any;
			const parserAgent = { execute: () => {} } as any;
			const validatorAgent = { execute: () => {} } as any;
			const arbitratorAgent = { arbitrate: () => [] } as any;

			const orchestrator = new WorkflowOrchestratorV2(
				readerAgent,
				parserAgent,
				validatorAgent,
				arbitratorAgent,
				{
					agentTimeoutMs: 10000,
					maxRetries: 3,
					enableCircuitBreaker: false,
					enableMetrics: false,
				},
			);
			expect(orchestrator).toBeInstanceOf(WorkflowOrchestratorV2);
		});
	});

	describe("healthCheck", () => {
		it("should return health status", async () => {
			const readerAgent = { execute: () => {} } as any;
			const parserAgent = { execute: () => {} } as any;
			const validatorAgent = { execute: () => {} } as any;
			const arbitratorAgent = { arbitrate: () => [] } as any;

			const orchestrator = new WorkflowOrchestratorV2(
				readerAgent,
				parserAgent,
				validatorAgent,
				arbitratorAgent,
				{ enableCircuitBreaker: false, enableMetrics: false },
			);
			const health = await orchestrator.healthCheck();
			expect(health).toHaveProperty("status");
		});
	});

	describe("getMetricsSnapshot", () => {
		it("should return metrics snapshot", () => {
			const readerAgent = { execute: () => {} } as any;
			const parserAgent = { execute: () => {} } as any;
			const validatorAgent = { execute: () => {} } as any;
			const arbitratorAgent = { arbitrate: () => [] } as any;

			const orchestrator = new WorkflowOrchestratorV2(
				readerAgent,
				parserAgent,
				validatorAgent,
				arbitratorAgent,
				{ enableCircuitBreaker: false, enableMetrics: false },
			);
			const metrics = orchestrator.getMetricsSnapshot();
			expect(metrics).toBeDefined();
		});
	});
});
