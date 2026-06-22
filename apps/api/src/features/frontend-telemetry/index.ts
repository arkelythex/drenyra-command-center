import { Elysia } from "elysia";
import { z } from "zod";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { recordTelemetry } from "./application/commands/record-telemetry";
import { getRecentTelemetry } from "./application/queries/get-recent";
import { getTelemetrySummary } from "./application/queries/get-summary";

function readMonitoringKey(headers: Headers): string {
	return headers.get("x-monitoring-key")?.trim() ?? "";
}

function parseBooleanEnv(
	value: string | undefined,
	defaultValue: boolean,
): boolean {
	if (typeof value !== "string") return defaultValue;
	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

function isProductionEnv(): boolean {
	return process.env.NODE_ENV === "production";
}

function requiresMonitoringKey(): boolean {
	return parseBooleanEnv(
		process.env.FRONTEND_MONITORING_REQUIRE_KEY,
		isProductionEnv(),
	);
}

function hasMonitoringKeyConfigured(): boolean {
	return Boolean(process.env.FRONTEND_MONITORING_KEY?.trim());
}

function readMonitoringKeyFromQuery(url: string): string {
	try {
		return new URL(url).searchParams.get("key")?.trim() ?? "";
	} catch (_error) {
		return "";
	}
}

function hasMonitoringAccess(request: Request): boolean {
	if (!requiresMonitoringKey()) return true;

	const configured = process.env.FRONTEND_MONITORING_KEY?.trim();
	if (!configured) return false;
	const keyFromHeader = readMonitoringKey(request.headers);
	if (keyFromHeader === configured) return true;
	return readMonitoringKeyFromQuery(request.url) === configured;
}

function validateMonitoringAccess(request: Request): {
	authorized: boolean;
	status?: 401 | 503;
	message?: string;
	code?: string;
} {
	if (hasMonitoringAccess(request)) {
		return { authorized: true };
	}

	if (requiresMonitoringKey() && !hasMonitoringKeyConfigured()) {
		return {
			authorized: false,
			status: 503,
			message:
				"Frontend telemetry endpoint is misconfigured: FRONTEND_MONITORING_KEY is required",
			code: "FRONTEND_TELEMETRY_MISCONFIGURED",
		};
	}

	return {
		authorized: false,
		status: 401,
		message: "Monitoring key is required or invalid",
		code: "FRONTEND_TELEMETRY_UNAUTHORIZED",
	};
}

function resolveIpAddress(headers: Headers): string | null {
	const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	if (forwarded) return forwarded;
	const realIp = headers.get("x-real-ip")?.trim();
	return realIp || null;
}

const telemetryBodySchema = z.object({
	kind: z.union([
		z.literal("error"),
		z.literal("web-vital"),
		z.literal("event"),
		z.literal("pageview"),
	]),
	name: z.string().max(200).optional(),
	path: z.string().max(400).optional(),
	value: z.number().optional(),
	rating: z
		.union([
			z.literal("good"),
			z.literal("needs-improvement"),
			z.literal("poor"),
		])
		.optional(),
	message: z.string().max(4000).optional(),
	stack: z.string().max(12_000).optional(),
	context: z.record(z.string().max(64), z.unknown()).optional(),
	timestamp: z.string().min(1),
});

/**
 * frontendTelemetryModule — Frontend telemetry API routes.
 *
 * @example
 * ```ts
 * app.use(frontendTelemetryModule);
 * ```
 */
export const frontendTelemetryModule = new Elysia({ prefix: "/api/telemetry" })
	.post(
		"/frontend",
		async ({ body, request, set }) => {
			const access = validateMonitoringAccess(request);
			if (!access.authorized) {
				set.status = access.status ?? 401;
				return fail(
					access.message ?? "Monitoring key is required or invalid",
					access.code ?? "FRONTEND_TELEMETRY_UNAUTHORIZED",
				);
			}

			try {
				const result = await recordTelemetry({
					kind: body.kind,
					name: body.name,
					path: body.path,
					value: body.value,
					rating: body.rating,
					message: body.message,
					stack: body.stack,
					context: body.context,
					timestamp: body.timestamp,
					userAgent: request.headers.get("user-agent"),
					ipAddress: resolveIpAddress(request.headers),
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(error, "Unable to capture frontend telemetry event"),
					"FRONTEND_TELEMETRY_ERROR",
				);
			}
		},
		{
			body: telemetryBodySchema,
			detail: {
				tags: ["Observability"],
				summary: "Capture frontend telemetry event",
				description:
					"Receives frontend monitoring events (errors, web vitals, analytics events, pageviews).",
			},
		},
	)
	.get(
		"/frontend/summary",
		({ request, set }) => {
			const access = validateMonitoringAccess(request);
			if (!access.authorized) {
				set.status = access.status ?? 401;
				return fail(
					access.message ?? "Monitoring key is required or invalid",
					access.code ?? "FRONTEND_TELEMETRY_UNAUTHORIZED",
				);
			}
			return ok({
				...getTelemetrySummary(),
				protected: requiresMonitoringKey(),
				keyConfigured: hasMonitoringKeyConfigured(),
			});
		},
		{
			detail: {
				tags: ["Observability"],
				summary: "Get frontend telemetry summary",
			},
		},
	)
	.get(
		"/frontend/recent",
		async ({ query, request, set }) => {
			const access = validateMonitoringAccess(request);
			if (!access.authorized) {
				set.status = access.status ?? 401;
				return fail(
					access.message ?? "Monitoring key is required or invalid",
					access.code ?? "FRONTEND_TELEMETRY_UNAUTHORIZED",
				);
			}

			const limit = query.limit ?? 20;
			const result = await getRecentTelemetry({ limit });
			return ok(result);
		},
		{
			query: z.object({
				limit: z.coerce.number().min(1).max(200).optional(),
			}),
			detail: {
				tags: ["Observability"],
				summary: "Get recent frontend telemetry events",
			},
		},
	);
