import { describe, expect, it } from "vitest";
import type {
	AgenticOSPlugin,
	AgentRegistry,
	ApprovalGate,
	ApprovalGateRegistry,
	DomainRegistry,
	PolicyDefinition,
	PolicyRegistry,
} from "../../src/plugin/interface.js";

describe("Plugin Interface Contract", () => {
	it("validates a minimal plugin implements the interface structurally", () => {
		const plugin: AgenticOSPlugin = {
			name: "test-plugin",
			version: "1.0.0",
			description: "A test plugin",
			registerDomain(_registry: DomainRegistry): void {
				_registry.registerEntity("test-entity", {});
				_registry.registerRule("test-rule", () => true);
			},
			registerAgents(_registry: AgentRegistry): void {
				_registry.registerAgentType("test-agent", () => ({}));
				_registry.registerCapability("test-agent", "test-capability");
			},
			registerPolicies(_registry: PolicyRegistry): void {
				_registry.registerPolicy("test-policy", {
					description: "Test policy",
					evaluate() {
						return { allowed: true };
					},
				});
			},
			registerApprovalGates(_registry: ApprovalGateRegistry): void {
				_registry.registerGate("test-gate", {
					name: "test-gate",
					description: "Test approval gate",
					async evaluate() {
						return {
							approved: true,
							approvedBy: "system",
							reason: "Test gate auto-approves",
							timestamp: new Date().toISOString(),
						};
					},
				});
			},
		};

		expect(plugin.name).toBe("test-plugin");
		expect(plugin.version).toBe("1.0.0");
		expect(plugin.description).toBe("A test plugin");
		expect(typeof plugin.registerDomain).toBe("function");
		expect(typeof plugin.registerAgents).toBe("function");
		expect(typeof plugin.registerPolicies).toBe("function");
		expect(typeof plugin.registerApprovalGates).toBe("function");
	});

	it("allows a plugin to register entities and rules through DomainRegistry", () => {
		const entities: string[] = [];
		const rules: string[] = [];

		const domainRegistry: DomainRegistry = {
			registerEntity(name: string) {
				entities.push(name);
			},
			registerRule(name: string) {
				rules.push(name);
			},
		};

		domainRegistry.registerEntity("invoice");
		domainRegistry.registerEntity("tax-payer");
		domainRegistry.registerRule("require-valid-ruc");
		domainRegistry.registerRule("max-invoice-amount");

		expect(entities).toEqual(["invoice", "tax-payer"]);
		expect(rules).toEqual(["require-valid-ruc", "max-invoice-amount"]);
	});

	it("allows a plugin to register agent types and capabilities through AgentRegistry", () => {
		const agentTypes: string[] = [];
		const capabilities: [string, string][] = [];

		const agentRegistry: AgentRegistry = {
			registerAgentType(type: string) {
				agentTypes.push(type);
			},
			registerCapability(agentType: string, capability: string) {
				capabilities.push([agentType, capability]);
			},
		};

		agentRegistry.registerAgentType("analysis");
		agentRegistry.registerAgentType("audit");
		agentRegistry.registerCapability("analysis", "code-review");
		agentRegistry.registerCapability("audit", "compliance-check");

		expect(agentTypes).toEqual(["analysis", "audit"]);
		expect(capabilities).toEqual([
			["analysis", "code-review"],
			["audit", "compliance-check"],
		]);
	});

	it("allows a plugin to register policies through PolicyRegistry", () => {
		const policies: Map<string, PolicyDefinition> = new Map();

		const policyRegistry: PolicyRegistry = {
			registerPolicy(name: string, policy: PolicyDefinition) {
				policies.set(name, policy);
			},
		};

		const denyPolicy: PolicyDefinition = {
			description: "Deny all",
			evaluate() {
				return { allowed: false, reason: "Denied by default" };
			},
		};

		policyRegistry.registerPolicy("deny-all", denyPolicy);

		const result = policies.get("deny-all")?.evaluate({
			action: "any",
			agentType: "test",
			task: {
				id: "t1",
				type: "test",
				priority: "low",
				input: {},
			},
		});

		expect(result.allowed).toBe(false);
		expect(result.reason).toBe("Denied by default");
	});

	it("allows a plugin to register approval gates through ApprovalGateRegistry", () => {
		const gates: Map<string, ApprovalGate> = new Map();

		const approvalGateRegistry: ApprovalGateRegistry = {
			registerGate(name: string, gate: ApprovalGate) {
				gates.set(name, gate);
			},
		};

		const manualGate: ApprovalGate = {
			name: "manual-approval",
			description: "Requires human approval",
			async evaluate() {
				return {
					approved: false,
					reason: "Pending human review",
					timestamp: new Date().toISOString(),
				};
			},
		};

		approvalGateRegistry.registerGate("manual-approval", manualGate);

		expect(gates.has("manual-approval")).toBe(true);
		expect(gates.get("manual-approval")?.name).toBe("manual-approval");
	});

	it("validates PolicyContext and PolicyResult types are structurally sound", () => {
		const policy: PolicyDefinition = {
			description: "High priority tasks from critical agents require approval",
			evaluate(context) {
				if (
					context.action === "execute" &&
					context.task.priority === "critical"
				) {
					return {
						allowed: false,
						reason: "Critical tasks require manual approval",
						requiresApproval: true,
					};
				}
				return { allowed: true };
			},
		};

		// Routine task — should be allowed
		const routineResult = policy.evaluate({
			action: "execute",
			agentType: "analysis",
			task: {
				id: "t1",
				type: "analysis",
				priority: "low",
				input: { query: "summary" },
			},
		});
		expect(routineResult.allowed).toBe(true);
		expect(routineResult.requiresApproval).toBeUndefined();

		// Critical task — should require approval
		const criticalResult = policy.evaluate({
			action: "execute",
			agentType: "audit",
			task: {
				id: "t2",
				type: "audit",
				priority: "critical",
				input: { query: "high-risk" },
			},
		});
		expect(criticalResult.allowed).toBe(false);
		expect(criticalResult.reason).toBe(
			"Critical tasks require manual approval",
		);
		expect(criticalResult.requiresApproval).toBe(true);
	});

	it("validates ApprovalRequest and ApprovalVerdict through a gate evaluation", async () => {
		const gate: ApprovalGate = {
			name: "financial-gate",
			description: "Financial transactions require dual approval",
			async evaluate(request) {
				const hasEnoughEvidence = request.evidence.length >= 2;
				return {
					approved: hasEnoughEvidence,
					approvedBy: hasEnoughEvidence ? "auto-approver" : undefined,
					reason: hasEnoughEvidence
						? "Sufficient evidence provided"
						: "Insufficient evidence",
					timestamp: new Date().toISOString(),
				};
			},
		};

		// Insufficient evidence — rejected
		const rejectedVerdict = await gate.evaluate({
			id: "req-1",
			action: "financial-transfer",
			agentId: "agent-a",
			taskId: "task-1",
			evidence: [
				{
					type: "balance-check",
					content: { balance: 1000 },
					timestamp: "2026-01-01T00:00:00Z",
				},
			],
		});
		expect(rejectedVerdict.approved).toBe(false);
		expect(rejectedVerdict.reason).toBe("Insufficient evidence");

		// Sufficient evidence — approved
		const approvedVerdict = await gate.evaluate({
			id: "req-2",
			action: "financial-transfer",
			agentId: "agent-a",
			taskId: "task-2",
			evidence: [
				{
					type: "balance-check",
					content: { balance: 5000 },
					timestamp: "2026-01-01T00:00:00Z",
				},
				{
					type: "approval-chain",
					content: { manager: "user-b" },
					timestamp: "2026-01-01T00:01:00Z",
				},
			],
		});
		expect(approvedVerdict.approved).toBe(true);
		expect(approvedVerdict.approvedBy).toBe("auto-approver");
		expect(approvedVerdict.reason).toBe("Sufficient evidence provided");
	});
});
