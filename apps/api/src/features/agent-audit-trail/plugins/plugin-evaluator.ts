import type {
	AuditPluginCondition,
	AuditPluginExecutionContext,
	AuditPluginExecutionResult,
	AuditPluginPathCondition,
} from "./plugin.types";
import { getAuditPlugins } from "./plugin-registry";
import { createSandboxContextData } from "./plugin-sandbox";

function readPositiveIntegerEnv(name: string, fallback: number): number {
	const raw = Number(process.env[name] ?? fallback);
	if (!Number.isFinite(raw) || raw < 1) return fallback;
	return Math.floor(raw);
}

function getContextData(
	context: AuditPluginExecutionContext,
): Record<string, unknown> {
	return {
		organizationId: context.organizationId,
		agentName: context.agentName,
		decisionType: context.decisionType,
		reasoning: context.reasoning ?? null,
		inputs: context.inputs,
		outputs: context.outputs,
		occurredAt: context.occurredAt.toISOString(),
	};
}

function isSafePath(path: string): boolean {
	return !["__proto__", "prototype", "constructor"].some((segment) =>
		path.includes(segment),
	);
}

function resolvePath(
	contextData: Record<string, unknown>,
	path: string,
): unknown {
	if (!path.trim() || !isSafePath(path)) return undefined;

	const segments = path.split(".").filter(Boolean);
	let current: unknown = contextData;

	for (const segment of segments) {
		if (current === null || typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[segment];
	}

	return current;
}

function comparePathCondition(
	value: unknown,
	condition: AuditPluginPathCondition,
): boolean {
	switch (condition.operator) {
		case "exists":
			return value !== undefined && value !== null;
		case "eq":
			return value === condition.value;
		case "neq":
			return value !== condition.value;
		case "includes":
			if (typeof value === "string" && typeof condition.value === "string") {
				return value.includes(condition.value);
			}
			if (Array.isArray(value)) {
				return value.includes(condition.value);
			}
			return false;
		case "gt":
			return Number(value) > Number(condition.value);
		case "gte":
			return Number(value) >= Number(condition.value);
		case "lt":
			return Number(value) < Number(condition.value);
		case "lte":
			return Number(value) <= Number(condition.value);
		default:
			return false;
	}
}

function evaluateCondition(
	condition: AuditPluginCondition,
	contextData: Record<string, unknown>,
): boolean {
	if (condition.kind === "path") {
		const value = resolvePath(contextData, condition.path);
		return comparePathCondition(value, condition);
	}

	const left = Number(resolvePath(contextData, condition.leftPath));
	const right = Number(resolvePath(contextData, condition.rightPath));
	const delta = Math.abs(left - right);

	if (Number.isNaN(delta)) return false;

	switch (condition.operator) {
		case "gt":
			return delta > condition.value;
		case "gte":
			return delta >= condition.value;
		case "lt":
			return delta < condition.value;
		case "lte":
			return delta <= condition.value;
		default:
			return false;
	}
}

function matchesScope(
	context: AuditPluginExecutionContext,
	scope: {
		organizationIds?: number[];
		agentNames?: string[];
		decisionTypes?: string[];
	},
): boolean {
	if (
		scope.organizationIds &&
		!scope.organizationIds.includes(context.organizationId)
	)
		return false;
	if (scope.agentNames && !scope.agentNames.includes(context.agentName))
		return false;
	if (
		scope.decisionTypes &&
		!scope.decisionTypes.includes(context.decisionType)
	)
		return false;
	return true;
}

/**
 * evaluateAuditPlugins operation.
 *
 * @param context - Input for context.
 * @param pluginIds - Input for pluginIds.
 * @returns Result of evaluateAuditPlugins.
 * @example
 * ```ts
 * const result = evaluateAuditPlugins({} as AuditPluginExecutionContext, []);
 * console.log(result);
 * ```
 */
export function evaluateAuditPlugins(
	context: AuditPluginExecutionContext,
	pluginIds?: string[],
): AuditPluginExecutionResult {
	const contextData = getContextData(context);
	const maxEvaluationMs = readPositiveIntegerEnv(
		"AUDIT_PLUGIN_EVAL_BUDGET_MS",
		25,
	);
	const maxTotalEvaluationMs = readPositiveIntegerEnv(
		"AUDIT_PLUGIN_EVAL_TOTAL_BUDGET_MS",
		80,
	);
	const maxPluginsPerRun = readPositiveIntegerEnv(
		"AUDIT_PLUGIN_MAX_PER_RUN",
		12,
	);
	const maxFindings = readPositiveIntegerEnv("AUDIT_PLUGIN_MAX_FINDINGS", 20);
	const plugins = getAuditPlugins(pluginIds);
	const findings: AuditPluginExecutionResult["findings"] = [];
	const skipped: AuditPluginExecutionResult["skipped"] = [];
	const evaluatedPluginIds: string[] = [];
	const evaluationStart = Date.now();

	for (const plugin of plugins.slice(0, maxPluginsPerRun)) {
		if (Date.now() - evaluationStart > maxTotalEvaluationMs) {
			skipped.push({ pluginId: plugin.id, reason: "global-budget-exceeded" });
			continue;
		}

		if (plugin.enabled === false) {
			skipped.push({ pluginId: plugin.id, reason: "disabled" });
			continue;
		}

		if (plugin.scope && !matchesScope(context, plugin.scope)) {
			skipped.push({ pluginId: plugin.id, reason: "scope-mismatch" });
			continue;
		}

		const pluginStart = Date.now();
		evaluatedPluginIds.push(plugin.id);
		const pluginContextData = createSandboxContextData(
			contextData,
			plugin.allowedPaths,
		);
		const conditionResults: boolean[] = [];
		for (const condition of plugin.conditions) {
			if (Date.now() - pluginStart > maxEvaluationMs) {
				skipped.push({ pluginId: plugin.id, reason: "sandbox-timeout" });
				break;
			}
			conditionResults.push(evaluateCondition(condition, pluginContextData));
		}

		if (conditionResults.length !== plugin.conditions.length) {
			continue;
		}

		const logic = plugin.logic ?? "all";
		const isMatch =
			logic === "any"
				? conditionResults.some(Boolean)
				: conditionResults.every(Boolean);

		if (!isMatch) continue;
		if (findings.length >= maxFindings) {
			skipped.push({ pluginId: plugin.id, reason: "max-findings-reached" });
			continue;
		}

		findings.push({
			pluginId: plugin.id,
			pluginVersion: plugin.version,
			code: plugin.finding.code,
			message: plugin.finding.message,
			severity: plugin.finding.severity,
			recommendedAction: plugin.finding.recommendedAction,
			matchedAt: new Date().toISOString(),
		});
	}

	if (plugins.length > maxPluginsPerRun) {
		for (const plugin of plugins.slice(maxPluginsPerRun)) {
			skipped.push({ pluginId: plugin.id, reason: "max-plugin-limit" });
		}
	}

	return {
		evaluatedPluginIds,
		findings,
		skipped,
	};
}
