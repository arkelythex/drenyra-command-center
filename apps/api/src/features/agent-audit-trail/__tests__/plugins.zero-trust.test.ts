import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { evaluateAuditPlugins, registerAuditPlugin } from "../plugins";

function registerMatchingPlugin(id: string): void {
	registerAuditPlugin({
		id,
		name: `Plugin ${id}`,
		version: "1.0.0",
		description: "test plugin for zero-trust limits",
		capabilities: ["audit:read-inputs", "audit:emit-finding"],
		allowedPaths: ["inputs.bankCode"],
		conditions: [
			{
				kind: "path",
				path: "inputs.bankCode",
				operator: "eq",
				value: "BCP",
			},
		],
		finding: {
			code: `FINDING_${id}`,
			message: "Plugin finding",
			severity: "medium",
		},
	});
}

describe("Audit plugin zero-trust runtime limits", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("caps findings and reports skipped plugins when max findings is reached", () => {
		process.env.AUDIT_PLUGIN_MAX_FINDINGS = "1";
		const pluginA = `zt-limit-a-${Date.now()}`;
		const pluginB = `zt-limit-b-${Date.now() + 1}`;
		registerMatchingPlugin(pluginA);
		registerMatchingPlugin(pluginB);

		const result = evaluateAuditPlugins(
			{
				organizationId: 1,
				agentName: "bank-reconciliation-agent",
				decisionType: "ALLOW",
				inputs: { bankCode: "BCP" },
				outputs: {},
				occurredAt: new Date("2026-02-19T10:00:00.000Z"),
			},
			[pluginA, pluginB],
		);

		expect(result.findings).toHaveLength(1);
		expect(
			result.skipped.some(
				(skip) =>
					(skip.pluginId === pluginA || skip.pluginId === pluginB) &&
					skip.reason === "max-findings-reached",
			),
		).toBe(true);
	});

	it("limits plugin count per run and marks overflow as skipped", () => {
		process.env.AUDIT_PLUGIN_MAX_PER_RUN = "1";
		const pluginA = `zt-max-plugin-a-${Date.now()}`;
		const pluginB = `zt-max-plugin-b-${Date.now() + 1}`;
		registerMatchingPlugin(pluginA);
		registerMatchingPlugin(pluginB);

		const result = evaluateAuditPlugins(
			{
				organizationId: 1,
				agentName: "bank-reconciliation-agent",
				decisionType: "ALLOW",
				inputs: { bankCode: "BCP" },
				outputs: {},
				occurredAt: new Date("2026-02-19T10:00:00.000Z"),
			},
			[pluginA, pluginB],
		);

		expect(result.evaluatedPluginIds).toHaveLength(1);
		expect(
			result.skipped.some(
				(skip) =>
					(skip.pluginId === pluginA || skip.pluginId === pluginB) &&
					skip.reason === "max-plugin-limit",
			),
		).toBe(true);
	});
});
