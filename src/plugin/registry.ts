/**
 * Plugin Registry — manages vertical plugin registration and lifecycle.
 *
 * Provides CRUD operations for plugins and factory methods for creating
 * registry instances that are passed to each plugin's registration methods.
 *
 * @module @drenyra/platform-core/plugin
 */

import type { AgentType } from "../kernel/types.js";
import type {
	AgenticOSPlugin,
	AgentRegistry,
	ApprovalGate,
	ApprovalGateRegistry,
	DomainRegistry,
	DrenyraSkill,
	PolicyDefinition,
	PolicyRegistry,
	SkillContext,
} from "./interface.js";
import { SessionManager } from "../mastra/session-manager.js";

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
	private readonly skills = new Map<string, DrenyraSkill>();

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

	// ──────────────────────────────────────────────
	// Skill Management
	// ──────────────────────────────────────────────

	/**
	 * Install and initialize a DrenyraSkill.
	 * Replaces any existing skill with the same id.
	 */
	async installSkill(
		skill: DrenyraSkill,
		sessionManager?: SessionManager,
	): Promise<void> {
		const ctx: SkillContext = {
			sessionManager: sessionManager ?? new SessionManager(),
			logger: {
				info: (msg: string) => console.log(`[skill:${skill.id}] ${msg}`),
				warn: (msg: string) => console.warn(`[skill:${skill.id}] ${msg}`),
				error: (msg: string) => console.error(`[skill:${skill.id}] ${msg}`),
			},
			config: {},
		};
		await skill.initialize(ctx);
		this.skills.set(skill.id, skill);
	}

	/**
	 * Uninstall a skill by id.
	 */
	uninstallSkill(id: string): boolean {
		return this.skills.delete(id);
	}

	/**
	 * Find a skill by id.
	 */
	findSkill(id: string): DrenyraSkill | undefined {
		return this.skills.get(id);
	}

	/**
	 * List all installed skills.
	 */
	listSkills(): DrenyraSkill[] {
		return Array.from(this.skills.values());
	}
}
