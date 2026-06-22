/**
 * Fault Isolation Guard
 *
 * Implements HarmonyOS Microkernel principle:
 * - Module isolation (faults don't cascade)
 * - Error boundaries around non-critical modules
 * - Graceful degradation
 *
 * @module domain/microkernel/fault-isolation-guard
 */

// ============================================
// TYPES
// ============================================

type ModulePriority = "critical" | "standard" | "non-critical";

interface ModuleConfig {
	name: string;
	priority: ModulePriority;
	fallbackValue?: unknown;
	maxRetries?: number;
	timeoutMs?: number;
}

interface ExecutionResult<T> {
	success: boolean;
	value?: T;
	error?: Error;
	usedFallback: boolean;
	executionTimeMs: number;
}

interface ModuleHealth {
	name: string;
	status: "healthy" | "degraded" | "failed";
	lastError?: string;
	failureCount: number;
	lastSuccessAt?: Date;
}

// ============================================
// MODULE REGISTRY
// ============================================

const moduleRegistry = new Map<string, ModuleConfig>();
const moduleHealth = new Map<string, ModuleHealth>();

/**
 * Register a module with its isolation config
 * @param config - Input for config.
 * @returns Result of registerModule.
 * @example
 * ```ts
 * const result = registerModule({} as ModuleConfig);
 * console.log(result);
 * ```
 */

export function registerModule(config: ModuleConfig): void {
	moduleRegistry.set(config.name, config);
	moduleHealth.set(config.name, {
		name: config.name,
		status: "healthy",
		failureCount: 0,
	});
}

/**
 * Get module health status
 * @param moduleName - Input for moduleName.
 * @returns Result of getModuleHealth.
 * @example
 * ```ts
 * const result = getModuleHealth("");
 * console.log(result);
 * ```
 */

export function getModuleHealth(moduleName: string): ModuleHealth | undefined {
	return moduleHealth.get(moduleName);
}

/**
 * Get all module health statuses
 * @returns Result of getAllModuleHealth.
 * @example
 * ```ts
 * const result = getAllModuleHealth();
 * console.log(result);
 * ```
 */

export function getAllModuleHealth(): ModuleHealth[] {
	return Array.from(moduleHealth.values());
}

// ============================================
// CORE ISOLATION FUNCTIONS
// ============================================

/**
 * Execute a module function with fault isolation
 *
 * - Critical: Throws on failure
 * - Standard: Retries, then throws
 * - Non-critical: Returns fallback on failure
 * @param moduleName - Input for moduleName.
 * @param fn - Input for fn.
 * @returns Result of executeWithIsolation.
 * @example
 * ```ts
 * const result = await executeWithIsolation("", undefined);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for executeWithIsolation.
 */

export async function executeWithIsolation<T>(
	moduleName: string,
	fn: () => Promise<T>,
): Promise<ExecutionResult<T>> {
	const startTime = performance.now();
	const config = moduleRegistry.get(moduleName);
	const health = moduleHealth.get(moduleName);

	if (!config || !health) {
		return {
			success: false,
			error: new Error(`Module "${moduleName}" not registered`),
			usedFallback: false,
			executionTimeMs: performance.now() - startTime,
		};
	}

	const maxRetries =
		config.maxRetries ?? (config.priority === "critical" ? 0 : 2);
	const timeoutMs = config.timeoutMs ?? 30000;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			// Execute with timeout
			const value = await Promise.race([
				fn(),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Timeout")), timeoutMs),
				),
			]);

			// Update health on success
			health.status = "healthy";
			health.failureCount = 0;
			health.lastSuccessAt = new Date();
			health.lastError = undefined;

			return {
				success: true,
				value,
				usedFallback: false,
				executionTimeMs: performance.now() - startTime,
			};
		} catch (error) {
			health.failureCount++;
			health.lastError = error instanceof Error ? error.message : String(error);

			// Last attempt failed
			if (attempt === maxRetries) {
				health.status =
					config.priority === "non-critical" ? "degraded" : "failed";

				// Non-critical: return fallback
				if (
					config.priority === "non-critical" &&
					config.fallbackValue !== undefined
				) {
					return {
						success: false,
						value: config.fallbackValue as T,
						error: error instanceof Error ? error : new Error(String(error)),
						usedFallback: true,
						executionTimeMs: performance.now() - startTime,
					};
				}

				// Critical/Standard: propagate error
				return {
					success: false,
					error: error instanceof Error ? error : new Error(String(error)),
					usedFallback: false,
					executionTimeMs: performance.now() - startTime,
				};
			}
		}
	}

	// Should not reach here
	return {
		success: false,
		error: new Error("Unexpected execution flow"),
		usedFallback: false,
		executionTimeMs: performance.now() - startTime,
	};
}

/**
 * Check if system is in degraded mode
 * @returns Result of isSystemDegraded.
 * @example
 * ```ts
 * const result = isSystemDegraded();
 * console.log(result);
 * ```
 */

export function isSystemDegraded(): boolean {
	return Array.from(moduleHealth.values()).some(
		(h) => h.status === "degraded" || h.status === "failed",
	);
}

/**
 * Get list of failed modules
 * @returns Result of getFailedModules.
 * @example
 * ```ts
 * const result = getFailedModules();
 * console.log(result);
 * ```
 */

export function getFailedModules(): string[] {
	return Array.from(moduleHealth.values())
		.filter((h) => h.status === "failed")
		.map((h) => h.name);
}

/**
 * Reset module health (for testing)
 * @param moduleName - Input for moduleName.
 * @returns Result of resetModuleHealth.
 * @example
 * ```ts
 * const result = resetModuleHealth("");
 * console.log(result);
 * ```
 */

export function resetModuleHealth(moduleName: string): void {
	const health = moduleHealth.get(moduleName);
	if (health) {
		health.status = "healthy";
		health.failureCount = 0;
		health.lastError = undefined;
	}
}
