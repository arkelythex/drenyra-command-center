/**
 * Prometheus Metrics Middleware
 *
 * Collects and exposes metrics for monitoring:
 * - HTTP request duration (histogram)
 * - HTTP request count (counter)
 * - Document operations (counter)
 * - Database query duration (histogram)
 * - Active connections (gauge)
 */

import type { Elysia } from "elysia";
import {
	Counter,
	collectDefaultMetrics,
	Gauge,
	Histogram,
	register,
} from "prom-client";

// Enable default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: "drenyra_api_" });

// ============================================
// METRICS DEFINITIONS
// ============================================

/**
 * HTTP request duration in seconds
 */
const httpRequestDuration = new Histogram({
	name: "drenyra_api_http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

/**
 * HTTP request count
 */
const httpRequestCount = new Counter({
	name: "drenyra_api_http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status_code"],
});

/**
 * HTTP errors
 */
const httpErrors = new Counter({
	name: "drenyra_api_http_errors_total",
	help: "Total number of HTTP errors",
	labelNames: ["method", "route", "status_code", "error_type"],
});

/**
 * Document uploads
 */
export const documentUploads = new Counter({
	name: "drenyra_api_document_uploads_total",
	help: "Total number of document uploads",
	labelNames: ["status", "file_type"],
});

/**
 * Document processing duration
 */
export const documentProcessingDuration = new Histogram({
	name: "drenyra_api_document_processing_duration_seconds",
	help: "Document processing duration in seconds",
	labelNames: ["operation", "file_type"],
	buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

/**
 * OCR queue size
 */
export const ocrQueueSize = new Gauge({
	name: "drenyra_api_ocr_queue_size",
	help: "Number of documents waiting in OCR queue",
});

/**
 * Database query duration
 */
export const dbQueryDuration = new Histogram({
	name: "drenyra_api_db_query_duration_seconds",
	help: "Database query duration in seconds",
	labelNames: ["operation", "table"],
	buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

/**
 * Active database connections
 */
export const dbConnections = new Gauge({
	name: "drenyra_api_db_connections_active",
	help: "Number of active database connections",
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Extract route pattern from URL path
 */

function normalizeStatusCode(status: number | string | undefined): number {
	return typeof status === "number" ? status : 200;
}

export function normalizeMetricsRoute(path: string): string {
	// Remove query params and keep label cardinality bounded.
	const cleanPath = path.split("?")[0] || "/";

	return cleanPath
		.replace(
			/\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
			"/:id",
		) // UUIDs
		.replace(/\/c[a-z0-9]{24}(?=\/|$)/gi, "/:id") // CUID2
		.replace(/\/[A-Za-z0-9_-]{21}(?=\/|$)/g, "/:id") // nanoid defaults
		.replace(/\/doc-\d+-[a-z0-9]+(?=\/|$)/gi, "/:docId") // Document IDs
		.replace(/\/20\d{9}(?=\/|$)/g, "/:ruc") // Peruvian RUC-like identifiers
		.replace(/\/\d+(?=\/|$)/g, "/:id"); // Numeric IDs
}

/**
 * Metrics middleware for Elysia
 */
export const metricsMiddleware = (app: Elysia) =>
	app
		// Expose metrics endpoint
		.get("/metrics", async () => {
			return new Response(await register.metrics(), {
				headers: {
					"Content-Type": register.contentType,
				},
			});
		})

		// Track request metrics
		.derive(({ request }) => {
			const startTime = Date.now();
			const method = request.method;
			const path = new URL(request.url).pathname;
			const route = normalizeMetricsRoute(path);
			let recorded = false;

			return {
				startTime,
				recordMetrics: (statusCode: number, error?: Error) => {
					if (recorded) {
						return;
					}
					recorded = true;
					const duration = (Date.now() - startTime) / 1000;

					// Record duration
					httpRequestDuration.observe(
						{
							method,
							route,
							status_code: statusCode,
						},
						duration,
					);

					// Record request count
					httpRequestCount.inc({
						method,
						route,
						status_code: statusCode,
					});

					// Record errors
					if (statusCode >= 400) {
						httpErrors.inc({
							method,
							route,
							status_code: statusCode,
							error_type: error?.name || "unknown",
						});
					}
				},
			};
		})

		// Record metrics on response
		.onAfterResponse(({ set, recordMetrics }) => {
			recordMetrics?.(normalizeStatusCode(set.status));
		})

		// Record metrics on error
		.onError(({ error, set, recordMetrics }) => {
			const statusCode = normalizeStatusCode(set.status);
			recordMetrics?.(statusCode === 200 ? 500 : statusCode, error as Error);
			return; // Let error handler continue
		});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Record document upload metric
 */
export function recordDocumentUpload(
	status: "success" | "error",
	fileType: string,
) {
	documentUploads.inc({ status, file_type: fileType });
}

/**
 * Record document processing time
 */
export function recordDocumentProcessing(
	operation: "upload" | "ocr" | "validation",
	fileType: string,
	durationSeconds: number,
) {
	documentProcessingDuration.observe(
		{
			operation,
			file_type: fileType,
		},
		durationSeconds,
	);
}

/**
 * Update OCR queue size
 */
export function updateOcrQueueSize(size: number) {
	ocrQueueSize.set(size);
}

/**
 * Record database query
 */
export function recordDbQuery(
	operation: string,
	table: string,
	durationMs: number,
) {
	dbQueryDuration.observe(
		{
			operation,
			table,
		},
		durationMs / 1000,
	);
}

/**
 * Update active database connections
 */
export function updateDbConnections(count: number) {
	dbConnections.set(count);
}

// ============================================
// UTILITY
// ============================================

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
	register.resetMetrics();
}

/**
 * Get current metrics as JSON
 */
export async function getMetricsJson() {
	const metrics = await register.getMetricsAsJSON();
	return metrics;
}
