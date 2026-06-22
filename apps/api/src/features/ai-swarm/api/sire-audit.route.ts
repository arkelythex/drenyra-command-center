/**
 * SIRE Audit Stream Route
 *
 * Long-running SSE audit endpoint. Streams step-by-step progress
 * of the SIRE compliance audit to the client.
 *
 * Events emitted:
 *   audit-started     → { companyId, period, dryRun }
 *   audit-step        → SireAuditStepEvent (started|completed|failed|skipped per step)
 *   audit-anomaly     → SireAnomaly (one per anomaly detected)
 *   audit-complete    → SireAuditResult
 *   audit-error       → { message: string }
 */

import { randomUUID } from "node:crypto";
import { Elysia, t } from "elysia";
import { encryptJsonValue, isAes256Configured } from "../../security/aes-256.service";
import { logSecurityAccess } from "../../security/access-log.service";
import { authorizeOperation } from "../../security/rbac-guard";
import {
	runSireAuditWorkflow,
	SireAuditInputSchema,
} from "../workflows/sire-audit.workflow";

const LIVE_SUBMISSION_ROLES = new Set(["owner", "admin", "superadmin", "senior"]);

function parseOptionalOrgId(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
	return parsed;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
	if (value === undefined) return undefined;
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return undefined;

	const normalized = value.trim().toLowerCase();
	if (normalized === "true" || normalized === "1") return true;
	if (normalized === "false" || normalized === "0") return false;
	return undefined;
}

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();
	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();
	return "";
}

const SireAuditQuerySchema = t.Object({
	companyId: t.String({ minLength: 1 }),
	period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
	ruc: t.String({ minLength: 11, maxLength: 11 }),
	orgId: t.Optional(t.String()),
	declaredIgvPen: t.Numeric(),
	salesTotalPen: t.Numeric(),
	rvieRecords: t.Numeric(),
	rceRecords: t.Numeric(),
	pleSalesRecords: t.Numeric(),
	plePurchaseRecords: t.Numeric(),
	detractionAmountPen: t.Optional(t.Numeric()),
	detractionableBasePen: t.Optional(t.Numeric()),
	dryRun: t.Optional(t.BooleanString()),
	companyAnnualIncomePen: t.Optional(t.Numeric()),
	isPrico: t.Optional(t.BooleanString()),
	runId: t.Optional(t.String({ minLength: 1 })),
});

/**
 * sireAuditRoute const.
 *
 * @example
 * ```ts
 * console.log(sireAuditRoute);
 * ```
 */
export const sireAuditRoute = new Elysia({ prefix: "/api/ai-swarm" })
	.onError(({ code, set }) => {
		if (code === "VALIDATION") {
			set.status = 422;
			return {
				success: false,
				error: "Invalid ai-swarm request",
				code: "VALIDATION_ERROR",
			};
		}
		return;
	})
	.get(
		"/sire-audit-stream",
		async ({ query, request, set, headers }) => {
		const headersMap = headers as Record<string, unknown>;
		const dryRun = parseOptionalBoolean(query.dryRun) ?? true;
		const encryptEvents =
			readHeader(headersMap, "x-encrypted-events").toLowerCase() === "true";
		const overrideEnabled =
			readHeader(headersMap, "x-admin-override").toLowerCase() === "true";
		const auditRunId = query.runId?.trim() || randomUUID();

		const authz = await authorizeOperation({
			headers: headersMap,
			operation: "sire:audit:stream",
			resource: "/api/ai-swarm/sire-audit-stream",
			requestedCompanyId: query.companyId,
		});
		if (!authz.ok) {
			set.status = authz.status;
			return {
				success: false,
				error: authz.error,
				code: authz.code,
			};
		}

		if (encryptEvents && !isAes256Configured()) {
			set.status = 503;
			await logSecurityAccess({
				action: "sire:audit:stream",
				resource: "/api/ai-swarm/sire-audit-stream",
				result: "FAILED",
				userId: authz.actor.authUserId,
				ipAddress: readHeader(headersMap, "x-forwarded-for"),
				userAgent: readHeader(headersMap, "user-agent"),
				details: { code: "ENCRYPTION_KEY_MISSING" },
			});
			return {
				success: false,
				error: "Encryption requested but ARKELYTHEX_AES256_KEY is not configured.",
				code: "ENCRYPTION_KEY_MISSING",
			};
		}

		if (!dryRun && !LIVE_SUBMISSION_ROLES.has(authz.actor.role.toLowerCase())) {
			set.status = 403;
			await logSecurityAccess({
				action: "sire:audit:stream",
				resource: "/api/ai-swarm/sire-audit-stream",
				result: "DENY",
				userId: authz.actor.authUserId,
				ipAddress: readHeader(headersMap, "x-forwarded-for"),
				userAgent: readHeader(headersMap, "user-agent"),
				details: {
					code: "FORBIDDEN_ROLE",
					role: authz.actor.role,
					reason: "live_submission_requires_privileged_role",
				},
			});
			return {
				success: false,
				error: `Role "${authz.actor.role}" cannot run live SIRE submission.`,
				code: "FORBIDDEN_ROLE",
			};
		}

		if (!dryRun && !overrideEnabled) {
			set.status = 403;
			await logSecurityAccess({
				action: "sire:audit:stream",
				resource: "/api/ai-swarm/sire-audit-stream",
				result: "DENY",
				userId: authz.actor.authUserId,
				ipAddress: readHeader(headersMap, "x-forwarded-for"),
				userAgent: readHeader(headersMap, "user-agent"),
				details: {
					code: "ADMIN_OVERRIDE_REQUIRED",
					reason: "live_submission_requires_explicit_override_header",
				},
			});
			return {
				success: false,
				error: "Live SIRE submission requires header x-admin-override=true.",
				code: "ADMIN_OVERRIDE_REQUIRED",
				requiresAdminOverride: true,
			};
		}

		const organizationId =
			request.headers.get("x-organization-id") ?? query.orgId;
		const parsedOrgId = parseOptionalOrgId(organizationId ?? undefined);
		const isPrico = parseOptionalBoolean(query.isPrico);

		const parseResult = SireAuditInputSchema.safeParse({
			companyId: query.companyId,
			period: query.period,
			ruc: query.ruc,
			organizationId: parsedOrgId,
			declaredIgvPen: Number(query.declaredIgvPen),
			salesTotalPen: Number(query.salesTotalPen),
			rvieRecords: Number(query.rvieRecords),
			rceRecords: Number(query.rceRecords),
			pleSalesRecords: Number(query.pleSalesRecords),
			plePurchaseRecords: Number(query.plePurchaseRecords),
			detractionAmountPen:
				query.detractionAmountPen !== undefined
					? Number(query.detractionAmountPen)
					: undefined,
			detractionableBasePen:
				query.detractionableBasePen !== undefined
					? Number(query.detractionableBasePen)
					: undefined,
			dryRun,
			companyAnnualIncomePen:
				query.companyAnnualIncomePen !== undefined
					? Number(query.companyAnnualIncomePen)
					: undefined,
			isPrico,
		});

		if (!parseResult.success) {
			set.status = 400;
			await logSecurityAccess({
				action: "sire:audit:stream",
				resource: "/api/ai-swarm/sire-audit-stream",
				result: "FAILED",
				userId: authz.actor.authUserId,
				ipAddress: readHeader(headersMap, "x-forwarded-for"),
				userAgent: readHeader(headersMap, "user-agent"),
				details: { code: "INVALID_PARAMETERS", issues: parseResult.error.issues },
			});
			return {
				error: "Invalid audit parameters",
				details: parseResult.error.issues,
			};
		}

		const auditInput = parseResult.data;

		const stream = new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();
				let eventCounter = 0;

				const maybeEncrypt = (event: string, data: unknown): unknown => {
					if (!encryptEvents || event === "audit-started") return data;
					return encryptJsonValue(data, {
						runId: auditRunId,
						toolCallId: `${event}-${eventCounter++}`,
					});
				};

				const emit = (event: string, data: unknown): void => {
					controller.enqueue(
						encoder.encode(
							`event: ${event}\ndata: ${JSON.stringify(maybeEncrypt(event, data))}\n\n`,
						),
					);
				};

				emit("audit-started", {
					runId: auditRunId,
					companyId: auditInput.companyId,
					period: auditInput.period,
					dryRun: auditInput.dryRun,
					encryptedEvents: encryptEvents,
					timestamp: new Date().toISOString(),
				});

				try {
					const result = await runSireAuditWorkflow(auditInput, (stepEvent) => {
						emit("audit-step", stepEvent);
					});

					// Emit each anomaly individually for granular UI updates
					for (const anomaly of result.anomalies) {
						emit("audit-anomaly", anomaly);
					}

					emit("audit-complete", result);
				} catch (err: unknown) {
					emit("audit-error", {
						message: err instanceof Error ? err.message : String(err),
						timestamp: new Date().toISOString(),
					});
				} finally {
					controller.close();
				}
			},
		});

		set.headers["Content-Type"] = "text/event-stream";
		set.headers["Cache-Control"] = "no-cache, no-transform";
		set.headers.Connection = "keep-alive";
		set.headers["X-Accel-Buffering"] = "no";

		return new Response(stream);
		},
		{
			query: SireAuditQuerySchema,
			detail: {
				tags: ["SIRE"],
				summary: "Auditoría SIRE completa (SSE streaming)",
				description:
					"Long-running audit con 3 subagentes paralelos (IGV, RCE, Detraction). Emite eventos SSE durante la auditoría.",
			},
		},
	);
