/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import {
	authorizeDrenyraMcpTool,
	buildDrenyraMcpManifest,
	type DrenyraMcpScope,
	isDrenyraMcpScope,
} from "@drenyra/pi";
import { Elysia, t } from "elysia";
import { fail, ok } from "../../shared/api-response";
import type {
	PlatformMcpAuditOutcome,
	PlatformMcpAuditReader,
	PlatformMcpAuditSink,
} from "./mcp.audit";
import { canReadPlatformMcpAudit, readAuditQuery } from "./mcp.audit-query";
import {
	createPlatformMcpHandlers,
	type PlatformMcpHandlersDeps,
} from "./mcp.handlers";

function readHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

function scopeFromHeaders(
	headers: Record<string, string | undefined>,
): DrenyraMcpScope {
	return {
		organizationId: readHeader(headers, "x-organization-id"),
		companyId: readHeader(headers, "x-company-id"),
		companyRuc: readHeader(headers, "x-company-ruc"),
		period: readHeader(headers, "x-fiscal-period"),
		countryCode: "PE",
		userId: readHeader(headers, "x-user-id"),
	};
}

const authorizationBody = t.Object({
	toolName: t.String({ minLength: 1 }),
	redactionStatus: t.Union([
		t.Literal("passed"),
		t.Literal("failed"),
		t.Literal("not_required"),
	]),
});

export interface PlatformMcpModuleDeps extends PlatformMcpHandlersDeps {
	auditSink?: PlatformMcpAuditSink;
	auditReader?: PlatformMcpAuditReader;
	now?: () => string;
}

export function createPlatformMcpModule(deps: PlatformMcpModuleDeps = {}) {
	const invokeTool = createPlatformMcpHandlers(deps);
	const now = deps.now ?? (() => new Date().toISOString());
	async function audit(input: {
		operation: "authorize" | "invoke";
		outcome: PlatformMcpAuditOutcome;
		toolName: string;
		scope: DrenyraMcpScope;
		redactionStatus: "passed" | "failed" | "not_required";
		reason: Parameters<PlatformMcpAuditSink["append"]>[0]["reason"];
		metadata?: Record<string, unknown>;
	}) {
		await deps.auditSink?.append({
			operation: input.operation,
			outcome: input.outcome,
			toolName: input.toolName,
			scope: input.scope,
			actorId: input.scope.userId,
			redactionStatus: input.redactionStatus,
			reason: input.reason,
			occurredAt: now(),
			metadata: input.metadata ?? {},
		});
	}
	return new Elysia({ prefix: "/api/platform/mcp", name: "platform-mcp" })
		.get("/manifest", () => ok(buildDrenyraMcpManifest()), {
			detail: {
				tags: ["Platform MCP"],
				summary: "Read ARKELYTHEX public MCP/SDK capability manifest",
			},
		})
		.get(
			"/audit",
			async ({ headers, query, set }) => {
				const role = readHeader(headers, "x-user-role");
				if (!canReadPlatformMcpAudit(role)) {
					set.status = 403;
					return fail(
						"MCP audit requires admin, auditor, owner or compliance role",
						"MCP_AUDIT_FORBIDDEN",
					);
				}
				const scope = scopeFromHeaders(headers);
				if (!isDrenyraMcpScope(scope)) {
					set.status = 403;
					return fail("Invalid MCP audit scope", "INVALID_SCOPE");
				}
				const events = await deps.auditReader?.list(
					readAuditQuery(scope, query),
				);
				return ok(events ?? []);
			},
			{
				query: t.Object({
					limit: t.Optional(t.String()),
					outcome: t.Optional(t.String()),
					toolName: t.Optional(t.String()),
				}),
				detail: {
					tags: ["Platform MCP"],
					summary: "Read scoped ARKELYTHEX MCP audit events",
				},
			},
		)
		.post(
			"/authorize",
			async ({ body, headers, set }) => {
				const scope = scopeFromHeaders(headers);
				const decision = authorizeDrenyraMcpTool({
					toolName: body.toolName,
					scope,
					redactionStatus: body.redactionStatus,
				});
				await audit({
					operation: "authorize",
					outcome: decision.allowed ? "allowed" : "denied",
					toolName: body.toolName,
					scope,
					redactionStatus: body.redactionStatus,
					reason: decision.reason,
				});
				if (!decision.allowed) set.status = 403;
				return decision.allowed
					? ok(decision)
					: fail(decision.reason, decision.reason);
			},
			{ body: authorizationBody, detail: { tags: ["Platform MCP"] } },
		)
		.post(
			"/invoke",
			async ({ body, headers, set }) => {
				const scope = scopeFromHeaders(headers);
				const decision = authorizeDrenyraMcpTool({
					toolName: body.toolName,
					scope,
					redactionStatus: body.redactionStatus,
				});
				if (!decision.allowed) {
					await audit({
						operation: "invoke",
						outcome: "denied",
						toolName: body.toolName,
						scope,
						redactionStatus: body.redactionStatus,
						reason: decision.reason,
					});
					set.status = 403;
					return fail(decision.reason, decision.reason);
				}
				try {
					const data = await invokeTool({
						toolName: body.toolName,
						scope,
						arguments: body.arguments ?? {},
					});
					await audit({
						operation: "invoke",
						outcome: "allowed",
						toolName: body.toolName,
						scope,
						redactionStatus: body.redactionStatus,
						reason: decision.reason,
						metadata: {
							argumentKeys: Object.keys(body.arguments ?? {}).sort(),
						},
					});
					return ok(data);
				} catch (error) {
					await audit({
						operation: "invoke",
						outcome: "failed",
						toolName: body.toolName,
						scope,
						redactionStatus: body.redactionStatus,
						reason: "MCP_INVOKE_FAILED",
					});
					set.status = 400;
					return fail(
						error instanceof Error ? error.message : "MCP invoke failed",
						"MCP_INVOKE_FAILED",
					);
				}
			},
			{
				body: t.Composite([
					authorizationBody,
					t.Object({
						arguments: t.Optional(t.Record(t.String(), t.Unknown())),
					}),
				]),
				detail: { tags: ["Platform MCP"] },
			},
		);
}

export const platformMcpModule = createPlatformMcpModule();
