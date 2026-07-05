import { describe, expect, it } from "vitest";
import { FiscalPlugin } from "../../src/plugin/fiscal-plugin.js";
import { PluginRegistry } from "../../src/plugin/registry.js";

describe("FiscalPlugin", () => {
	it("implements the AgenticOSPlugin interface with correct metadata", () => {
		const plugin = new FiscalPlugin();

		expect(plugin.name).toBe("fiscal");
		expect(plugin.version).toBe("1.0.0");
		expect(plugin.description).toContain("Peruvian fiscal compliance");
		expect(typeof plugin.registerDomain).toBe("function");
		expect(typeof plugin.registerAgents).toBe("function");
		expect(typeof plugin.registerPolicies).toBe("function");
		expect(typeof plugin.registerApprovalGates).toBe("function");
	});

	it("registers fiscal domain entities and rules", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const domainRegistry = registry.createDomainRegistry();

		plugin.registerDomain(domainRegistry);

		// Access the internal registrations via the default implementation
		const dr = domainRegistry as unknown as {
			entities: Array<{ name: string; schema: unknown }>;
			rules: Array<{ name: string; rule: (input: unknown) => boolean }>;
		};

		expect(dr.entities.length).toBeGreaterThan(0);
		expect(dr.rules.length).toBeGreaterThan(0);

		// Verify key entities are registered
		const entityNames = dr.entities.map((e) => e.name);
		expect(entityNames).toContain("invoice");
		expect(entityNames).toContain("tax-payer");
		expect(entityNames).toContain("tax-period");
		expect(entityNames).toContain("detraction");
		expect(entityNames).toContain("audit-trail");

		// Verify validation rules
		const ruleNames = dr.rules.map((r) => r.name);
		expect(ruleNames).toContain("valid-ruc");
		expect(ruleNames).toContain("valid-invoice-series");
		expect(ruleNames).toContain("positive-amount");
		expect(ruleNames).toContain("valid-detraction-percentage");
	});

	it("validates RUC numbers correctly", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const domainRegistry = registry.createDomainRegistry();

		plugin.registerDomain(domainRegistry);

		const dr = domainRegistry as unknown as {
			rules: Array<{ name: string; rule: (input: unknown) => boolean }>;
		};

		const validRucRule = dr.rules.find((r) => r.name === "valid-ruc")!;
		expect(validRucRule).toBeDefined();

		// Valid RUCs
		expect(validRucRule.rule("20123456789")).toBe(true); // starts with "20" (S.A.)
		expect(validRucRule.rule("10123456789")).toBe(true); // starts with "10" (natural person)
		expect(validRucRule.rule("15123456789")).toBe(true); // starts with "15"

		// Invalid RUCs
		expect(validRucRule.rule("")).toBe(false);
		expect(validRucRule.rule("1234567890")).toBe(false); // 10 digits
		expect(validRucRule.rule("123456789012")).toBe(false); // 12 digits
		expect(validRucRule.rule("30123456789")).toBe(false); // starts with "30" (invalid prefix)
		expect(validRucRule.rule("not-a-number")).toBe(false);
	});

	it("validates invoice series correctly", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const domainRegistry = registry.createDomainRegistry();

		plugin.registerDomain(domainRegistry);

		const dr = domainRegistry as unknown as {
			rules: Array<{ name: string; rule: (input: unknown) => boolean }>;
		};

		const seriesRule = dr.rules.find((r) => r.name === "valid-invoice-series")!;
		expect(seriesRule).toBeDefined();

		// Valid series
		expect(seriesRule.rule("F001")).toBe(true);
		expect(seriesRule.rule("B001")).toBe(true);
		expect(seriesRule.rule("E001")).toBe(true);
		expect(seriesRule.rule("F999")).toBe(true);

		// Invalid series
		expect(seriesRule.rule("")).toBe(false);
		expect(seriesRule.rule("F 001")).toBe(false);
		expect(seriesRule.rule("A001")).toBe(false); // invalid prefix
		expect(seriesRule.rule("F01")).toBe(false); // too short
		expect(seriesRule.rule("not-series")).toBe(false);
	});

	it("registers fiscal agent types with capabilities", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const agentRegistry = registry.createAgentRegistry();

		plugin.registerAgents(agentRegistry);

		const ar = agentRegistry as unknown as {
			agentTypes: Array<{ type: string; factory: () => unknown }>;
			capabilities: Array<{ agentType: string; capability: string }>;
		};

		const agentTypes = ar.agentTypes.map((a) => a.type);
		expect(agentTypes).toContain("fiscal-compliance");
		expect(agentTypes).toContain("fiscal-audit");
		expect(agentTypes).toContain("fiscal-financial");
		expect(agentTypes).toContain("fiscal-sunat-filing");
		expect(agentTypes).toContain("fiscal-reporting");

		// Verify capabilities are linked to agent types
		const complianceCapabilities = ar.capabilities
			.filter((c) => c.agentType === "fiscal-compliance")
			.map((c) => c.capability);
		expect(complianceCapabilities).toContain("sunat-compliance-check");
		expect(complianceCapabilities).toContain("invoice-compliance-validation");
		expect(complianceCapabilities).toContain("audit-trail-verification");

		const filingCapabilities = ar.capabilities
			.filter((c) => c.agentType === "fiscal-sunat-filing")
			.map((c) => c.capability);
		expect(filingCapabilities).toContain("invoice-submission");
		expect(filingCapabilities).toContain("tax-return-filing");
		expect(filingCapabilities).toContain("detraction-filing");
	});

	it("registers fiscal policies", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const policyRegistry = registry.createPolicyRegistry();

		plugin.registerPolicies(policyRegistry);

		const pr = policyRegistry as unknown as {
			policies: Array<{
				name: string;
				policy: {
					description: string;
					evaluate: (context: {
						action: string;
						agentType: string;
						task: {
							id: string;
							type: string;
							priority: string;
							input: Record<string, unknown>;
						};
						metadata?: Record<string, unknown>;
					}) => {
						allowed: boolean;
						reason?: string;
						requiresApproval?: boolean;
					};
				};
			}>;
		};

		expect(pr.policies.length).toBeGreaterThan(0);

		const policyNames = pr.policies.map((p) => p.name);
		expect(policyNames).toContain("sunat-readonly");
		expect(policyNames).toContain("tax-critical-approval");
		expect(policyNames).toContain("audit-trail-integrity");
		expect(policyNames).toContain("fiscal-data-retention");
	});

	it("evaluates the sunat-readonly policy correctly", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const policyRegistry = registry.createPolicyRegistry();

		plugin.registerPolicies(policyRegistry);

		const pr = policyRegistry as unknown as {
			policies: Array<{
				name: string;
				policy: {
					evaluate: (context: {
						action: string;
						agentType: string;
						task: {
							id: string;
							type: string;
							priority: string;
							input: Record<string, unknown>;
						};
					}) => unknown;
				};
			}>;
		};

		const sunatPolicy = pr.policies.find((p) => p.name === "sunat-readonly")!;

		// Query operations should be allowed
		const queryResult = sunatPolicy.policy.evaluate({
			action: "query-fiscal-records",
			agentType: "fiscal-compliance",
			task: {
				id: "t1",
				type: "fiscal-compliance",
				priority: "medium",
				input: {},
			},
		}) as { allowed: boolean; reason?: string };
		expect(queryResult.allowed).toBe(true);

		// Modify submitted records should be denied
		const modifyResult = sunatPolicy.policy.evaluate({
			action: "modify-submitted-record",
			agentType: "fiscal-sunat-filing",
			task: {
				id: "t2",
				type: "fiscal-sunat-filing",
				priority: "high",
				input: {},
			},
		}) as { allowed: boolean; reason?: string; requiresApproval?: boolean };
		expect(modifyResult.allowed).toBe(false);
		expect(modifyResult.reason).toContain("credit/debit notes");
		expect(modifyResult.requiresApproval).toBe(false);

		// Delete submitted records should be denied
		const deleteResult = sunatPolicy.policy.evaluate({
			action: "delete-submitted-record",
			agentType: "fiscal-sunat-filing",
			task: {
				id: "t3",
				type: "fiscal-sunat-filing",
				priority: "high",
				input: {},
			},
		}) as { allowed: boolean; reason?: string };
		expect(deleteResult.allowed).toBe(false);
	});

	it("evaluates the tax-critical-approval policy correctly", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const policyRegistry = registry.createPolicyRegistry();

		plugin.registerPolicies(policyRegistry);

		const pr = policyRegistry as unknown as {
			policies: Array<{
				name: string;
				policy: {
					evaluate: (context: {
						action: string;
						agentType: string;
						task: {
							id: string;
							type: string;
							priority: string;
							input: Record<string, unknown>;
						};
					}) => unknown;
				};
			}>;
		};

		const approvalPolicy = pr.policies.find(
			(p) => p.name === "tax-critical-approval",
		)!;

		// Non-filing actions should be allowed
		const queryResult = approvalPolicy.policy.evaluate({
			action: "query-invoice",
			agentType: "fiscal-compliance",
			task: { id: "t1", type: "fiscal-compliance", priority: "low", input: {} },
		}) as { allowed: boolean; reason?: string };
		expect(queryResult.allowed).toBe(true);

		// Filing actions should require approval
		const filingResult = approvalPolicy.policy.evaluate({
			action: "invoice-submission",
			agentType: "fiscal-sunat-filing",
			task: {
				id: "t2",
				type: "fiscal-sunat-filing",
				priority: "high",
				input: {},
			},
		}) as { allowed: boolean; reason?: string; requiresApproval?: boolean };
		expect(filingResult.allowed).toBe(false);
		expect(filingResult.requiresApproval).toBe(true);
		expect(filingResult.reason).toContain("human approval");
	});

	it("registers fiscal approval gates", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const gateRegistry = registry.createApprovalGateRegistry();

		plugin.registerApprovalGates(gateRegistry);

		const gr = gateRegistry as unknown as {
			gates: Array<{
				name: string;
				gate: {
					name: string;
					description: string;
					evaluate: (request: {
						id: string;
						action: string;
						agentId: string;
						taskId: string;
						evidence: Array<{
							type: string;
							content: unknown;
							timestamp: string;
						}>;
						metadata?: Record<string, unknown>;
					}) => Promise<{
						approved: boolean;
						approvedBy?: string;
						reason?: string;
						timestamp: string;
					}>;
				};
			}>;
		};

		expect(gr.gates.length).toBeGreaterThan(0);

		const gateNames = gr.gates.map((g) => g.name);
		expect(gateNames).toContain("sunat-submit-gate");
		expect(gateNames).toContain("audit-data-access-gate");
	});

	it("evaluates sunat-submit-gate based on evidence", async () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const gateRegistry = registry.createApprovalGateRegistry();

		plugin.registerApprovalGates(gateRegistry);

		const gr = gateRegistry as unknown as {
			gates: Array<{
				name: string;
				gate: {
					evaluate: (request: {
						id: string;
						action: string;
						agentId: string;
						taskId: string;
						evidence: Array<{
							type: string;
							content: unknown;
							timestamp: string;
						}>;
					}) => Promise<{
						approved: boolean;
						approvedBy?: string;
						reason?: string;
						timestamp: string;
					}>;
				};
			}>;
		};

		const submitGate = gr.gates.find((g) => g.name === "sunat-submit-gate")!;

		// No evidence — should be denied
		const noEvidenceResult = await submitGate.gate.evaluate({
			id: "req-1",
			action: "invoice-submission",
			agentId: "filing-agent",
			taskId: "task-1",
			evidence: [],
		});
		expect(noEvidenceResult.approved).toBe(false);
		expect(noEvidenceResult.reason).toContain("compliance evidence");

		// With compliance evidence — should be approved
		const withEvidenceResult = await submitGate.gate.evaluate({
			id: "req-2",
			action: "invoice-submission",
			agentId: "filing-agent",
			taskId: "task-2",
			evidence: [
				{
					type: "pre-flight-validation",
					content: { valid: true },
					timestamp: "2026-01-01T00:00:00Z",
				},
			],
		});
		expect(withEvidenceResult.approved).toBe(true);
		expect(withEvidenceResult.approvedBy).toBe("fiscal-plugin-auto-approver");

		// With high-value amount — should be denied even with evidence
		const highValueResult = await submitGate.gate.evaluate({
			id: "req-3",
			action: "invoice-submission",
			agentId: "filing-agent",
			taskId: "task-3",
			evidence: [
				{
					type: "compliance-check",
					content: { ok: true },
					timestamp: "2026-01-01T00:00:00Z",
				},
				{
					type: "balance-check",
					content: { amount: 100000 },
					timestamp: "2026-01-01T00:00:00Z",
				},
			],
		});
		expect(highValueResult.approved).toBe(false);
		expect(highValueResult.reason).toContain("High-value");
	});

	it("evaluates audit-data-access-gate correctly", async () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();
		const gateRegistry = registry.createApprovalGateRegistry();

		plugin.registerApprovalGates(gateRegistry);

		const gr = gateRegistry as unknown as {
			gates: Array<{
				name: string;
				gate: {
					evaluate: (request: {
						id: string;
						action: string;
						agentId: string;
						taskId: string;
						evidence: Array<{
							type: string;
							content: unknown;
							timestamp: string;
						}>;
					}) => Promise<{
						approved: boolean;
						approvedBy?: string;
						reason?: string;
						timestamp: string;
					}>;
				};
			}>;
		};

		const auditGate = gr.gates.find(
			(g) => g.name === "audit-data-access-gate",
		)!;

		// No authorization evidence — denied
		const noAuthResult = await auditGate.gate.evaluate({
			id: "req-a1",
			action: "access-audit-data",
			agentId: "audit-agent",
			taskId: "task-a1",
			evidence: [],
		});
		expect(noAuthResult.approved).toBe(false);
		expect(noAuthResult.reason).toContain("authorization evidence");

		// With authorization token — approved
		const authResult = await auditGate.gate.evaluate({
			id: "req-a2",
			action: "access-audit-data",
			agentId: "audit-agent",
			taskId: "task-a2",
			evidence: [
				{
					type: "authorization-token",
					content: { token: "xxx" },
					timestamp: "2026-01-01T00:00:00Z",
				},
			],
		});
		expect(authResult.approved).toBe(true);
		expect(authResult.approvedBy).toBe("fiscal-plugin-auto-approver");
	});

	it("integrates fully with PluginRegistry", () => {
		const plugin = new FiscalPlugin();
		const registry = new PluginRegistry();

		// Register the plugin
		registry.register(plugin);

		// Retrieve it
		const retrieved = registry.getPlugin("fiscal");
		expect(retrieved).toBe(plugin);

		// Initialize all registries through the plugin
		const dr = registry.createDomainRegistry();
		const ar = registry.createAgentRegistry();
		const pr = registry.createPolicyRegistry();
		const agr = registry.createApprovalGateRegistry();

		expect(() => {
			plugin.registerDomain(dr);
			plugin.registerAgents(ar);
			plugin.registerPolicies(pr);
			plugin.registerApprovalGates(agr);
		}).not.toThrow();

		// Verify the plugin appears in the list
		expect(registry.listPlugins()).toHaveLength(1);
		expect(registry.listPlugins()[0].name).toBe("fiscal");
	});
});
