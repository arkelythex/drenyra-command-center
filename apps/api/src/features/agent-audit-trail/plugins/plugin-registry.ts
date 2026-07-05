import type {
	AuditPluginCapability,
	AuditPluginCondition,
	AuditPluginDefinition,
} from "./plugin.types";
import {
	assertPluginCapabilityConstraints,
	sanitizeFindingTemplate,
} from "./plugin-capability-policy";
import { assertPluginSandboxConstraints } from "./plugin-sandbox";

const ALLOWED_CAPABILITIES: ReadonlySet<AuditPluginCapability> = new Set([
	"audit:read-inputs",
	"audit:read-outputs",
	"audit:read-reasoning",
	"audit:emit-finding",
]);

const pluginRegistry = new Map<string, AuditPluginDefinition>();

function isPathAllowed(path: string, allowedPaths: string[]): boolean {
	return allowedPaths.some((allowedPath) => {
		if (allowedPath.endsWith(".*")) {
			const prefix = allowedPath.slice(0, -2);
			return path === prefix || path.startsWith(`${prefix}.`);
		}
		return path === allowedPath;
	});
}

function validateConditionPaths(
	condition: AuditPluginCondition,
	allowedPaths: string[],
): void {
	if (condition.kind === "path") {
		if (!isPathAllowed(condition.path, allowedPaths)) {
			throw new Error(
				`Plugin condition path "${condition.path}" is not in allowedPaths`,
			);
		}
		return;
	}

	if (!isPathAllowed(condition.leftPath, allowedPaths)) {
		throw new Error(
			`Plugin condition leftPath "${condition.leftPath}" is not in allowedPaths`,
		);
	}

	if (!isPathAllowed(condition.rightPath, allowedPaths)) {
		throw new Error(
			`Plugin condition rightPath "${condition.rightPath}" is not in allowedPaths`,
		);
	}
}

function validatePluginDefinition(plugin: AuditPluginDefinition): void {
	if (!plugin.id.trim()) throw new Error("Plugin id is required");
	if (!plugin.name.trim()) throw new Error("Plugin name is required");
	if (!plugin.version.trim()) throw new Error("Plugin version is required");
	if (plugin.conditions.length === 0) {
		throw new Error(`Plugin "${plugin.id}" must define at least one condition`);
	}
	if (plugin.allowedPaths.length === 0) {
		throw new Error(`Plugin "${plugin.id}" must define allowedPaths`);
	}

	for (const capability of plugin.capabilities) {
		if (!ALLOWED_CAPABILITIES.has(capability)) {
			throw new Error(`Plugin "${plugin.id}" uses unknown capability`);
		}
	}

	for (const condition of plugin.conditions) {
		validateConditionPaths(condition, plugin.allowedPaths);
	}

	assertPluginCapabilityConstraints(plugin);
	assertPluginSandboxConstraints(plugin);
}

/**
 * validateAuditPluginDefinition operation.
 *
 * @param plugin - Input for plugin.
 * @returns Result of validateAuditPluginDefinition.
 * @example
 * ```ts
 * const result = validateAuditPluginDefinition({} as AuditPluginDefinition);
 * console.log(result);
 * ```
 */
export function validateAuditPluginDefinition(plugin: AuditPluginDefinition): {
	valid: boolean;
	error?: string;
} {
	try {
		validatePluginDefinition(plugin);
		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error:
				error instanceof Error ? error.message : "plugin_validation_failed",
		};
	}
}

/**
 * registerAuditPlugin operation.
 *
 * @param plugin - Input for plugin.
 * @returns Result of registerAuditPlugin.
 * @throws Error when registerAuditPlugin cannot complete successfully.
 * @example
 * ```ts
 * const result = registerAuditPlugin({} as AuditPluginDefinition);
 * console.log(result);
 * ```
 */
export function registerAuditPlugin(plugin: AuditPluginDefinition): void {
	validatePluginDefinition(plugin);

	if (pluginRegistry.has(plugin.id)) {
		throw new Error(`Plugin "${plugin.id}" is already registered`);
	}

	const normalizedPlugin: AuditPluginDefinition = {
		...plugin,
		finding: sanitizeFindingTemplate(plugin.finding),
	};

	pluginRegistry.set(plugin.id, Object.freeze(normalizedPlugin));
}

/**
 * listAuditPlugins operation.
 *
 * @returns Result of listAuditPlugins.
 * @example
 * ```ts
 * const result = listAuditPlugins();
 * console.log(result);
 * ```
 */
export function listAuditPlugins(): AuditPluginDefinition[] {
	return Array.from(pluginRegistry.values());
}

/**
 * getAuditPlugins operation.
 *
 * @param pluginIds - Input for pluginIds.
 * @returns Result of getAuditPlugins.
 * @example
 * ```ts
 * const result = getAuditPlugins([]);
 * console.log(result);
 * ```
 */
export function getAuditPlugins(pluginIds?: string[]): AuditPluginDefinition[] {
	if (!pluginIds || pluginIds.length === 0) {
		return listAuditPlugins();
	}

	const requested = new Set(pluginIds);
	return listAuditPlugins().filter((plugin) => requested.has(plugin.id));
}
