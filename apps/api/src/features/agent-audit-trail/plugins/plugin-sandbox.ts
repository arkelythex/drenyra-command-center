import type { AuditPluginDefinition } from "./plugin.types";

const MAX_CONDITIONS = 30;
const MAX_ALLOWED_PATHS = 30;
const MAX_PATH_LENGTH = 120;
const MAX_WILDCARD_PATHS = 8;
const MAX_PATH_DEPTH = 6;
const ALLOWED_ROOTS = new Set([
	"organizationId",
	"agentName",
	"decisionType",
	"reasoning",
	"inputs",
	"outputs",
	"occurredAt",
]);

function isSafePath(path: string): boolean {
	return !["__proto__", "prototype", "constructor"].some((segment) =>
		path.includes(segment),
	);
}

function normalizePath(path: string): string {
	return path.trim();
}

function getRoot(path: string): string {
	return path.split(".")[0] ?? "";
}

function isPathPatternValid(path: string): boolean {
	if (!path || path.length > MAX_PATH_LENGTH) return false;
	if (!isSafePath(path)) return false;
	const segments = path.split(".").filter(Boolean);
	if (segments.length === 0 || segments.length > MAX_PATH_DEPTH) return false;

	const wildcardIndex = path.indexOf("*");
	if (wildcardIndex >= 0 && !path.endsWith(".*")) return false;
	if (path === "*") return false;
	if (path.endsWith(".*")) {
		const root = getRoot(path);
		// Avoid broad root access like inputs.* or outputs.* in sandbox mode.
		if ((root === "inputs" || root === "outputs") && segments.length === 2) {
			return false;
		}
		// Wildcards are never allowed for scalar roots.
		if (root !== "inputs" && root !== "outputs") {
			return false;
		}
	}

	return true;
}

function resolvePath(
	contextData: Record<string, unknown>,
	path: string,
): unknown {
	const normalized = normalizePath(path);
	if (!normalized || !isSafePath(normalized)) return undefined;

	const segments = normalized.split(".").filter(Boolean);
	let current: unknown = contextData;

	for (const segment of segments) {
		if (current === null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[segment];
	}

	return current;
}

function assignPath(
	target: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	const normalized = normalizePath(path);
	if (!normalized || !isSafePath(normalized)) return;

	const segments = normalized.split(".").filter(Boolean);
	let current: Record<string, unknown> = target;

	for (let i = 0; i < segments.length; i += 1) {
		const segment = segments[i];
		if (!segment) return;

		const isLast = i === segments.length - 1;
		if (isLast) {
			current[segment] = value;
			return;
		}

		const next = current[segment];
		if (!next || typeof next !== "object" || Array.isArray(next)) {
			current[segment] = {};
		}

		current = current[segment] as Record<string, unknown>;
	}
}

function cloneJsonCompatible(value: unknown): unknown {
	if (value === null || typeof value !== "object") return value;
	try {
		return JSON.parse(JSON.stringify(value)) as unknown;
	} catch {
		return undefined;
	}
}

function deepFreeze<T>(value: T): T {
	if (!value || typeof value !== "object") return value;
	Object.freeze(value);

	for (const nested of Object.values(value as Record<string, unknown>)) {
		if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
			deepFreeze(nested);
		}
	}

	return value;
}

/**
 * assertPluginSandboxConstraints operation.
 *
 * @param plugin - Input for plugin.
 * @returns Result of assertPluginSandboxConstraints.
 * @throws Error when assertPluginSandboxConstraints cannot complete successfully.
 * @example
 * ```ts
 * const result = assertPluginSandboxConstraints({} as AuditPluginDefinition);
 * console.log(result);
 * ```
 */
export function assertPluginSandboxConstraints(
	plugin: AuditPluginDefinition,
): void {
	if (plugin.conditions.length > MAX_CONDITIONS) {
		throw new Error(
			`Plugin "${plugin.id}" exceeds sandbox condition limit (${MAX_CONDITIONS})`,
		);
	}

	if (plugin.allowedPaths.length > MAX_ALLOWED_PATHS) {
		throw new Error(
			`Plugin "${plugin.id}" exceeds sandbox allowedPaths limit (${MAX_ALLOWED_PATHS})`,
		);
	}
	const wildcardPaths = plugin.allowedPaths.filter((path) =>
		path.trim().endsWith(".*"),
	);
	if (wildcardPaths.length > MAX_WILDCARD_PATHS) {
		throw new Error(
			`Plugin "${plugin.id}" exceeds wildcard path limit (${MAX_WILDCARD_PATHS})`,
		);
	}

	for (const rawPath of plugin.allowedPaths) {
		const path = normalizePath(rawPath);
		if (!isPathPatternValid(path)) {
			throw new Error(
				`Plugin "${plugin.id}" contains invalid path pattern: "${rawPath}"`,
			);
		}

		const root = getRoot(path);
		if (!ALLOWED_ROOTS.has(root)) {
			throw new Error(
				`Plugin "${plugin.id}" cannot access root path "${root}"`,
			);
		}
	}
}

/**
 * createSandboxContextData operation.
 *
 * @param contextData - Input for contextData.
 * @param allowedPaths - Input for allowedPaths.
 * @returns Result of createSandboxContextData.
 * @example
 * ```ts
 * const result = createSandboxContextData({} as Record, []);
 * console.log(result);
 * ```
 */
export function createSandboxContextData(
	contextData: Record<string, unknown>,
	allowedPaths: string[],
): Record<string, unknown> {
	const sandboxData: Record<string, unknown> = {};

	for (const rawPath of allowedPaths) {
		const path = normalizePath(rawPath);
		if (!isPathPatternValid(path)) continue;

		if (path.endsWith(".*")) {
			const rootPath = path.slice(0, -2);
			const rootValue = cloneJsonCompatible(resolvePath(contextData, rootPath));
			if (rootValue !== undefined) {
				assignPath(sandboxData, rootPath, rootValue);
			}
			continue;
		}

		const value = cloneJsonCompatible(resolvePath(contextData, path));
		if (value !== undefined) {
			assignPath(sandboxData, path, value);
		}
	}

	return deepFreeze(sandboxData);
}
