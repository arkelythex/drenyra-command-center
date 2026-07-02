/**
 * Structured Request Logger — Elysia Plugin
 *
 * Provides per-request correlation ID, logs incoming requests at DEBUG
 * level, and logs completed responses (status + duration) via the existing
 * `logRequest` utility.
 *
 * ## Lifecycle awareness
 *
 * ```
 *   derive (correlationId, startTime)  →  onBeforeHandle (log incoming)  →  handler  →  onAfterResponse (log completion)
 * ```
 *
 * Elysia lifecycle: `derive` runs **before** `onBeforeHandle` but **after**
 * `onRequest`, so correlation ID resolution happens in `derive` and is
 * available to both the handler and all hooks that follow.
 *
 * ## Conflict avoidance
 *
 * Start time is tracked via a `WeakMap<Request, number>` so this plugin
 * does NOT conflict with the `derive({ startTime })` in `metricsMiddleware`
 * — both can coexist on the same app.
 *
 * @module plugins/request-logger
 */

import type { Elysia } from "elysia";
import { createLogger, logRequest } from "../../lib/logger";

// ── Internals ────────────────────────────────────────────────────────

const logger = createLogger({ module: "request-logger" });
const startTimes = new WeakMap<Request, number>();

function normalizeStatusCode(status: number | string | undefined): number {
	return typeof status === "number" ? status : 200;
}

// ── Plugin ───────────────────────────────────────────────────────────

export const requestLogger = (app: Elysia) =>
	app
		// Step 1: resolve correlation ID and start timer.
		// Runs before onBeforeHandle so correlationId is available to handlers
		// and all hooks down the chain.
		.derive(({ request, set }) => {
			const correlationId =
				request.headers.get("x-correlation-id") ?? crypto.randomUUID();

			set.headers["X-Correlation-Id"] = correlationId;
			startTimes.set(request, Date.now());

			return { correlationId };
		})

		// Step 2: log the incoming request (derive has already run).
		.onBeforeHandle(({ request, correlationId }) => {
			const url = new URL(request.url);
			logger.debug(
				{
					method: request.method,
					path: url.pathname,
					query: url.search || undefined,
					correlationId,
				},
				"Incoming request",
			);
		})

		// Step 3: log the completed response.
		.onAfterResponse(({ request, set, correlationId }) => {
			const start = startTimes.get(request);
			if (start === undefined) return;

			const duration = Date.now() - start;
			const path = new URL(request.url).pathname;

			logRequest(
				request.method,
				path,
				normalizeStatusCode(set.status),
				duration,
				correlationId,
			);

			startTimes.delete(request);
		});
