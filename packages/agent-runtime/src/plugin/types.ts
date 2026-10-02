/**
 * Plugin Configuration Types.
 *
 * Shared configuration types used by plugin registration and lifecycle
 * management. These will be extended in later PRs.
 *
 * @module @drenyra/platform-core/plugin
 */

import type { AgenticOSPlugin } from "./interface.js";

/**
 * Configuration for the plugin lifecycle manager.
 */
export interface PluginLifecycleConfig {
	/** Whether to validate plugins on registration */
	validateOnRegister: boolean;
	/** Whether to fail on missing optional registration methods */
	strictMode: boolean;
}

/**
 * A registered plugin with its resolved metadata.
 */
export interface RegisteredPlugin {
	plugin: AgenticOSPlugin;
	registeredAt: string;
	domainEntityCount: number;
	agentTypeCount: number;
	policyCount: number;
	gateCount: number;
}
