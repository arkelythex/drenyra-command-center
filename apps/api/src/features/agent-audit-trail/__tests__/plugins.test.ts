import { describe, expect, it } from "vitest";
import { evaluateAuditPlugins, listAuditPlugins, registerAuditPlugin } from "../plugins";

describe("Audit Trail Plugins", () => {
	it("should register built-in BCP plugin", () => {
		const plugins = listAuditPlugins();
		expect(plugins.some((plugin) => plugin.id === "bcp-reconciliation-v1")).toBe(
			true,
		);
	});

	it("should emit finding for BCP reconciliation drift", () => {
		const result = evaluateAuditPlugins({
			organizationId: 1,
			agentName: "bank-reconciliation-agent",
			decisionType: "RECONCILIATION_REVIEW",
			reasoning: "Detectado mismatch",
			inputs: {
				bankCode: "BCP",
				expectedAmountPen: 1500,
			},
			outputs: {
				reconciledAmountPen: 1450,
				status: "MISMATCH",
			},
			occurredAt: new Date("2026-02-19T10:00:00.000Z"),
		});

		expect(result.findings.length).toBe(1);
		expect(result.findings[0]?.code).toBe("BCP_CONCILIATION_DRIFT");
		expect(result.evaluatedPluginIds).toContain("bcp-reconciliation-v1");
	});

	it("should reject plugin with disallowed condition path", () => {
		expect(() =>
			registerAuditPlugin({
				id: `unsafe-${Date.now()}`,
				name: "Unsafe",
				version: "1.0.0",
				description: "should fail validation",
				capabilities: ["audit:read-inputs", "audit:emit-finding"],
				allowedPaths: ["inputs.safeField"],
				conditions: [
					{
						kind: "path",
						path: "inputs.otherField",
						operator: "exists",
					},
				],
				finding: {
					code: "UNSAFE_PATH",
					message: "Invalid",
					severity: "low",
				},
			}),
		).toThrowError(/allowedPaths/i);
	});

	it("should reject plugin that reads reasoning without capability", () => {
		expect(() =>
			registerAuditPlugin({
				id: `reasoning-without-capability-${Date.now()}`,
				name: "Reasoning without capability",
				version: "1.0.0",
				description: "should fail capability policy",
				capabilities: ["audit:read-inputs", "audit:emit-finding"],
				allowedPaths: ["reasoning"],
				conditions: [
					{
						kind: "path",
						path: "reasoning",
						operator: "includes",
						value: "mismatch",
					},
				],
				finding: {
					code: "REASONING_ACCESS",
					message: "Invalid capability",
					severity: "medium",
				},
			}),
		).toThrowError(/cannot access "reasoning"/i);
	});

	it("should trim oversized finding fields at registration time", () => {
		const pluginId = `sanitize-finding-${Date.now()}`;
		registerAuditPlugin({
			id: pluginId,
			name: "Sanitize finding",
			version: "1.0.0",
			description: "enforces max length",
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
				code: "X".repeat(200),
				message: "M".repeat(400),
				severity: "low",
				recommendedAction: "R".repeat(400),
			},
		});

		const plugin = listAuditPlugins().find((entry) => entry.id === pluginId);
		expect(plugin).toBeDefined();
		expect(plugin?.finding.code.length).toBeLessThanOrEqual(80);
		expect(plugin?.finding.message.length).toBeLessThanOrEqual(280);
		expect(plugin?.finding.recommendedAction?.length).toBeLessThanOrEqual(280);
	});
});
