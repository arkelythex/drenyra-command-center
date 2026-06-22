import type { Elysia } from "elysia";
import { createLogger } from "../lib/logger";

const OTEL_MODULE_NAME = "@elysiajs/opentelemetry";
const logger = createLogger({ module: "observability/opentelemetry" });

function isTruthy(value: string | undefined): boolean {
	return value === "1" || value?.toLowerCase() === "true";
}

/**
 * Attaches Elysia's official OpenTelemetry plugin when explicitly enabled.
 *
 * This loader is intentionally lazy so the API can keep booting even before
 * `bun install` pulls the optional dependency into the workspace.
 */
export async function attachOptionalOpenTelemetry<T>(
	app: T,
): Promise<T> {
	if (!isTruthy(process.env.ARKELYTHEX_ENABLE_OTEL)) {
		return app;
	}

	try {
		const currentApp = app as unknown as Elysia;
		const moduleName = OTEL_MODULE_NAME;
		const loaded = (await import(moduleName)) as {
			opentelemetry?: (options?: Record<string, unknown>) => unknown;
		};
		const pluginFactory = loaded.opentelemetry;

		if (typeof pluginFactory !== "function") {
			logger.warn(
				"@elysiajs/opentelemetry loaded but did not expose `opentelemetry()`",
			);
			return app;
		}

		const nextApp = currentApp.use(
			pluginFactory({
				serviceName: process.env.OTEL_SERVICE_NAME?.trim() || "arkelythex-api",
			}) as never,
		);
		return nextApp as unknown as T;
	} catch (error) {
		logger.warn(
			{
				errorMessage: error instanceof Error ? error.message : String(error),
			},
			"ARKELYTHEX_ENABLE_OTEL is enabled, but @elysiajs/opentelemetry is not installed",
		);
		return app;
	}
}
