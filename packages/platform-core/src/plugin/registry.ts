/**
 * Plugin Registry — manages vertical plugin registration and lifecycle.
 *
 * Provides CRUD operations for plugins and factory methods for creating
 * registry instances that are passed to each plugin's registration methods.
 *
 * @module @arkelythex/platform-core/plugin
 */

import type { AgentType } from "../kernel/types.js";
import type {
	AgenticOSPlugin,
	AgentRegistry,
	ApprovalGate,
	ApprovalGateRegistry,
	DomainRegistry,
	PolicyDefinition,
	PolicyRegistry,
} from "./interface.js";

// ──────────────────────────────────────────────
// Concrete Registry Implementations
// ──────────────────────────────────────────────

class DefaultDomainRegistry implements DomainRegistry {
	readonly entities: Array<{ name: string; schema: unknown }> = [];
	readonly rules: Array<{ name: string; rule: (input: unknown) => boolean }> =
		[];

	registerEntity(name: string, schema: unknown): void {
		this.entities.push({ name, schema });
	}

	registerRule(name: string, rule: (input: unknown) => boolean): void {
		this.rules.push({ name, rule });
	}
}

class DefaultAgentRegistry implements AgentRegistry {
	readonly agentTypes: Array<{ type: AgentType; factory: () => unknown }> = [];
	readonly capabilities: Array<{ agentType: AgentType; capability: string }> =
		[];

	registerAgentType(type: AgentType, factory: () => unknown): void {
		this.agentTypes.push({ type, factory });
	}

	registerCapability(agentType: AgentType, capability: string): void {
		this.capabilities.push({ agentType, capability });
	}
}

class DefaultPolicyRegistry implements PolicyRegistry {
	readonly policies: Array<{ name: string; policy: PolicyDefinition }> = [];

	registerPolicy(name: string, policy: PolicyDefinition): void {
		this.policies.push({ name, policy });
	}
}

class DefaultApprovalGateRegistry implements ApprovalGateRegistry {
	readonly gates: Array<{ name: string; gate: ApprovalGate }> = [];

	registerGate(name: string, gate: ApprovalGate): void {
		this.gates.push({ name, gate });
	}
}

// ──────────────────────────────────────────────
// PluginRegistry
// ──────────────────────────────────────────────

/**
 * Central registry for all vertical plugins.
 *
 * Manages plugin registration, retrieval, and provides factory methods
 * for creating the registry instances passed to each plugin's
 * `registerDomain`, `registerAgents`, `registerPolicies`, and
 * `registerApprovalGates` methods.
 */
export class PluginRegistry {
	private readonly plugins = new Map<string, AgenticOSPlugin>();

	/**
	 * Register a plugin. Replaces any existing plugin with the same name.
	 */
	register(plugin: AgenticOSPlugin): void {
		this.plugins.set(plugin.name, plugin);
	}

	/**
	 * Retrieve a plugin by name, or undefined if not found.
	 */
	getPlugin(name: string): AgenticOSPlugin | undefined {
		return this.plugins.get(name);
	}

	/**
	 * List all registered plugins.
	 */
	listPlugins(): AgenticOSPlugin[] {
		return Array.from(this.plugins.values());
	}

	/**
	 * Create a new DomainRegistry instance.
	 */
	createDomainRegistry(): DomainRegistry {
		return new DefaultDomainRegistry();
	}

	/**
	 * Create a new AgentRegistry instance.
	 */
	createAgentRegistry(): AgentRegistry {
		return new DefaultAgentRegistry();
	}

	/**
	 * Create a new PolicyRegistry instance.
	 */
	createPolicyRegistry(): PolicyRegistry {
		return new DefaultPolicyRegistry();
	}

	/**
	 * Create a new ApprovalGateRegistry instance.
	 */
	createApprovalGateRegistry(): ApprovalGateRegistry {
		return new DefaultApprovalGateRegistry();
	}
}
