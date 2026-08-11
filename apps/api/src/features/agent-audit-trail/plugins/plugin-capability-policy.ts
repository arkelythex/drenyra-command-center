import type {
	AuditPluginCapability,
	AuditPluginDefinition,
	AuditPluginFindingTemplate,
} from "./plugin.types";

const BASE_ALLOWED_ROOTS = new Set([
	"organizationId",
	"agentName",
	"decisionType",
	"occurredAt",
]);

const MAX_FINDING_FIELD_LENGTH = 280;

function getRoot(path: string): string {
	return path.split(".")[0] ?? "";
}

function getAllowedRootsForCapabilities(
	capabilities: AuditPluginCapability[],
): Set<string> {
	const roots = new Set(BASE_ALLOWED_ROOTS);
	if (capabilities.includes("audit:read-inputs")) roots.add("inputs");
	if (capabilities.includes("audit:read-outputs")) roots.add("outputs");
	if (capabilities.includes("audit:read-reasoning")) roots.add("reasoning");
	return roots;
}

function trimField(value: string, max: number): string {
	const normalized = value.trim();
	return normalized.length <= max ? normalized : normalized.slice(0, max);
}

/**
 * assertPluginCapabilityConstraints operation.
 *
 * @param plugin - Input for plugin.
 * @returns Result of assertPluginCapabilityConstraints.
 * @throws Error when assertPluginCapabilityConstraints cannot complete successfully.
 * @example
 * ```ts
 * const result = assertPluginCapabilityConstraints({} as AuditPluginDefinition);
 * console.log(result);
 * ```
 */
export function assertPluginCapabilityConstraints(
	plugin: AuditPluginDefinition,
): void {
	if (!plugin.capabilities.includes("audit:emit-finding")) {
		throw new Error(
			`Plugin "${plugin.id}" must include capability "audit:emit-finding"`,
		);
	}

	const allowedRoots = getAllowedRootsForCapabilities(plugin.capabilities);
	for (const path of plugin.allowedPaths) {
		const root = getRoot(path.trim());
		if (!allowedRoots.has(root)) {
			throw new Error(
				`Plugin "${plugin.id}" cannot access "${root}" without required capability`,
			);
		}
	}
}

/**
 * sanitizeFindingTemplate operation.
 *
 * @param finding - Input for finding.
 * @returns Result of sanitizeFindingTemplate.
 * @example
 * ```ts
 * const result = sanitizeFindingTemplate({} as AuditPluginFindingTemplate);
 * console.log(result);
 * ```
 */
export function sanitizeFindingTemplate(
	finding: AuditPluginFindingTemplate,
): AuditPluginFindingTemplate {
	return {
		...finding,
		code: trimField(finding.code, 80),
		message: trimField(finding.message, MAX_FINDING_FIELD_LENGTH),
		...(finding.recommendedAction
			? {
					recommendedAction: trimField(
						finding.recommendedAction,
						MAX_FINDING_FIELD_LENGTH,
					),
			  }
			: {}),
	};
}
