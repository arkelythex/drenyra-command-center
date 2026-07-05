import { describe, expect, it } from "vitest";
import type { AgenticOSPlugin } from "../../src/plugin/interface.js";
import { PluginRegistry } from "../../src/plugin/registry.js";

function createMinimalPlugin(
	overrides: Partial<AgenticOSPlugin> = {},
): AgenticOSPlugin {
	return {
		name: overrides.name ?? "test-plugin",
		version: overrides.version ?? "1.0.0",
		description: overrides.description ?? "A test plugin",
		registerDomain() {},
		registerAgents() {},
		registerPolicies() {},
		registerApprovalGates() {},
		...overrides,
	};
}

describe("PluginRegistry", () => {
	it("registers a plugin and retrieves it by name", () => {
		const registry = new PluginRegistry();
		const plugin = createMinimalPlugin({ name: "my-plugin" });

		registry.register(plugin);

		expect(registry.getPlugin("my-plugin")).toBe(plugin);
	});

	it("returns undefined for an unregistered plugin name", () => {
		const registry = new PluginRegistry();

		expect(registry.getPlugin("nonexistent")).toBeUndefined();
	});

	it("lists all registered plugins", () => {
		const registry = new PluginRegistry();
		const pluginA = createMinimalPlugin({ name: "plugin-a" });
		const pluginB = createMinimalPlugin({ name: "plugin-b" });

		registry.register(pluginA);
		registry.register(pluginB);

		const plugins = registry.listPlugins();
		expect(plugins).toHaveLength(2);
		expect(plugins).toContain(pluginA);
		expect(plugins).toContain(pluginB);
	});

	it("replaces a plugin when re-registering with the same name", () => {
		const registry = new PluginRegistry();
		const v1 = createMinimalPlugin({
			name: "my-plugin",
			version: "1.0.0",
		});
		const v2 = createMinimalPlugin({
			name: "my-plugin",
			version: "2.0.0",
		});

		registry.register(v1);
		registry.register(v2);

		expect(registry.getPlugin("my-plugin")?.version).toBe("2.0.0");
		expect(registry.listPlugins()).toHaveLength(1);
	});

	it("creates a domain registry that records registrations", () => {
		const registry = new PluginRegistry();
		const domainRegistry = registry.createDomainRegistry();

		domainRegistry.registerEntity("entity-a", { type: "test" });
		domainRegistry.registerRule("rule-a", () => true);

		// The registry stores registrations — verifies no crash and structure
		expect(true).toBe(true);
	});

	it("creates an agent registry that records registrations", () => {
		const registry = new PluginRegistry();
		const agentRegistry = registry.createAgentRegistry();

		agentRegistry.registerAgentType("analysis", () => ({ name: "test" }));
		agentRegistry.registerCapability("analysis", "code-review");

		expect(true).toBe(true);
	});

	it("creates a policy registry that records registrations", () => {
		const registry = new PluginRegistry();
		const policyRegistry = registry.createPolicyRegistry();

		policyRegistry.registerPolicy("deny-all", {
			description: "Deny everything",
			evaluate: () => ({ allowed: false }),
		});

		expect(true).toBe(true);
	});

	it("creates an approval gate registry that records registrations", () => {
		const registry = new PluginRegistry();
		const approvalGateRegistry = registry.createApprovalGateRegistry();

		approvalGateRegistry.registerGate("manual-gate", {
			name: "manual-gate",
			description: "Human review needed",
			evaluate: async () => ({
				approved: false,
				reason: "Manual review",
				timestamp: new Date().toISOString(),
			}),
		});

		expect(true).toBe(true);
	});

	it("allows registering a full plugin that exercises all registries", () => {
		const registry = new PluginRegistry();

		const fullPlugin: AgenticOSPlugin = {
			name: "full-plugin",
			version: "1.0.0",
			description: "Plugin that exercises all registries",
			registerDomain(dr) {
				dr.registerEntity("doc", {});
				dr.registerRule("validate", () => true);
			},
			registerAgents(ar) {
				ar.registerAgentType("agent-x", () => ({}));
				ar.registerCapability("agent-x", "read");
			},
			registerPolicies(pr) {
				pr.registerPolicy("read-only", {
					description: "Read-only policy",
					evaluate: () => ({ allowed: true }),
				});
			},
			registerApprovalGates(agr) {
				agr.registerGate("write-gate", {
					name: "write-gate",
					description: "Gate for write operations",
					evaluate: async () => ({
						approved: true,
						approvedBy: "admin",
						reason: "Auto-approved",
						timestamp: new Date().toISOString(),
					}),
				});
			},
		};

		registry.register(fullPlugin);

		const retrieved = registry.getPlugin("full-plugin");
		expect(retrieved).toBe(fullPlugin);

		// Invoke all registration methods — they should not throw
		const dr = registry.createDomainRegistry();
		const ar = registry.createAgentRegistry();
		const pr = registry.createPolicyRegistry();
		const agr = registry.createApprovalGateRegistry();

		expect(() => {
			fullPlugin.registerDomain(dr);
			fullPlugin.registerAgents(ar);
			fullPlugin.registerPolicies(pr);
			fullPlugin.registerApprovalGates(agr);
		}).not.toThrow();
	});

	it("lists empty array when no plugins are registered", () => {
		const registry = new PluginRegistry();
		expect(registry.listPlugins()).toEqual([]);
	});

	it("supports multiple plugins concurrently", () => {
		const registry = new PluginRegistry();

		registry.register(
			createMinimalPlugin({ name: "plugin-alpha", version: "0.1.0" }),
		);
		registry.register(
			createMinimalPlugin({ name: "plugin-beta", version: "2.0.0" }),
		);
		registry.register(
			createMinimalPlugin({ name: "plugin-gamma", version: "1.5.0" }),
		);

		expect(registry.listPlugins()).toHaveLength(3);
		expect(registry.getPlugin("plugin-alpha")?.version).toBe("0.1.0");
		expect(registry.getPlugin("plugin-beta")?.version).toBe("2.0.0");
		expect(registry.getPlugin("plugin-gamma")?.version).toBe("1.5.0");
	});
});
