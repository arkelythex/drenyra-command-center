/**
 * Agent Audit Trail API Routes
 * Elysia routes for logging and querying decisions
 */

import { Elysia, t } from "elysia";
import { authorizeOperation } from "../../security/rbac-guard";
import { logAgentDecision } from "../application/commands/log-decision.command";
import { getAuditTrail } from "../application/queries/get-trail.query";
import { verifyHashChain } from "../application/queries/verify-chain.query";
import { exportToPdf } from "../export/pdf-exporter";
import { exportToXml } from "../export/xml-exporter";
import type { AuditPluginDefinition } from "../plugins";
import { listAuditPlugins, validateAuditPluginDefinition } from "../plugins";

const jsonScalarSchema = t.Union([
	t.String(),
	t.Number(),
	t.Boolean(),
	t.Null(),
]);
const jsonContainerSchema = t.Union([
	t.Array(t.Unknown()),
	t.Object({}, { additionalProperties: t.Unknown() }),
]);
const jsonValueSchema = t.Union([jsonScalarSchema, jsonContainerSchema]);

const pluginConditionSchema = t.Object({
	kind: t.String({ minLength: 1 }),
	path: t.String({ minLength: 1 }),
	operator: t.String({ minLength: 1 }),
	value: t.Optional(jsonValueSchema),
});

/**
 * agentAuditTrailRoutes const.
 *
 * @example
 * ```ts
 * console.log(agentAuditTrailRoutes);
 * ```
 */
export const agentAuditTrailRoutes = new Elysia({ prefix: "/audit-trail" })
	// POST /audit-trail - Log new decision
	.post(
		"/",
		async ({ body }) => {
			const result = await logAgentDecision(body);
			return { success: true, data: result };
		},
		{
			body: t.Object({
				organizationId: t.Number({ minimum: 1 }),
				agentName: t.String({ minLength: 1 }),
				agentVersion: t.Optional(t.String()),
				decisionType: t.String({ minLength: 1 }),
				reasoning: t.Optional(t.String()),
				inputs: t.Record(t.String(), jsonValueSchema),
				outputs: t.Record(t.String(), jsonValueSchema),
				pluginIds: t.Optional(t.Array(t.String({ minLength: 1 }))),
			}),
		},
	)

	// GET /audit-trail?organizationId=1&agentName=compliance
	.get(
		"/",
		async ({ query, headers, set }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "audit:trail:read",
				resource: "/audit-trail",
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const result = await getAuditTrail({
				organizationId: Number(query.organizationId),
				...(query.agentName !== undefined
					? { agentName: query.agentName }
					: {}),
				...(query.decisionType !== undefined
					? { decisionType: query.decisionType }
					: {}),
				...(query.limit ? { limit: Number(query.limit) } : {}),
			});
			return { success: true, data: result };
		},
		{
			query: t.Object({
				organizationId: t.String(),
				agentName: t.Optional(t.String()),
				decisionType: t.Optional(t.String()),
				limit: t.Optional(t.String()),
			}),
		},
	)

	// GET /audit-trail/verify - Verify hash chain integrity
	.get(
		"/verify",
		async ({ query, headers, set }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "audit:trail:read",
				resource: "/audit-trail/verify",
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const result = await verifyHashChain({
				organizationId: Number(query.organizationId),
				limit: 1000,
			});
			return { success: true, data: result };
		},
		{
			query: t.Object({
				organizationId: t.String(),
			}),
		},
	)

	// GET /audit-trail/plugins - List registered secure plugins
	.get("/plugins", async ({ headers, set }) => {
		const authz = await authorizeOperation({
			headers: headers as Record<string, unknown>,
			operation: "audit:trail:read",
			resource: "/audit-trail/plugins",
		});
		if (!authz.ok) {
			set.status = authz.status;
			return { success: false, error: authz.error, code: authz.code };
		}

		return {
			success: true,
			data: listAuditPlugins(),
		};
	})

	// POST /audit-trail/plugins/preflight - Validate plugin contract before registration
	.post(
		"/plugins/preflight",
		async ({ body, headers, set }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "audit:trail:export",
				resource: "/audit-trail/plugins/preflight",
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const validation = validateAuditPluginDefinition(
				body as unknown as AuditPluginDefinition,
			);
			if (!validation.valid) {
				set.status = 422;
				return {
					success: false,
					error: validation.error ?? "Plugin failed zero-trust preflight",
					code: "PLUGIN_PREFLIGHT_FAILED",
				};
			}

			return {
				success: true,
				data: {
					valid: true,
					zeroTrust: true,
					message: "Plugin passed sandbox/capability preflight.",
				},
			};
		},
		{
			body: t.Object({
				id: t.String({ minLength: 1 }),
				name: t.String({ minLength: 1 }),
				version: t.String({ minLength: 1 }),
				description: t.String({ minLength: 1 }),
				capabilities: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
				allowedPaths: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
				scope: t.Optional(
					t.Object({
						organizationIds: t.Optional(t.Array(t.Number())),
						agentNames: t.Optional(t.Array(t.String())),
						decisionTypes: t.Optional(t.Array(t.String())),
					}),
				),
				logic: t.Optional(t.Union([t.Literal("all"), t.Literal("any")])),
				enabled: t.Optional(t.Boolean()),
				conditions: t.Array(pluginConditionSchema, { minItems: 1 }),
				finding: t.Object({
					code: t.String({ minLength: 1 }),
					message: t.String({ minLength: 1 }),
					severity: t.Union([
						t.Literal("low"),
						t.Literal("medium"),
						t.Literal("high"),
						t.Literal("critical"),
					]),
					recommendedAction: t.Optional(t.String()),
				}),
			}),
		},
	)

	// GET /audit-trail/export/xml?organizationId=1&companyRuc=20123456789&companyName=Drenyra
	.get(
		"/export/xml",
		async ({ query, headers, set }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "audit:trail:export",
				resource: "/audit-trail/export/xml",
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const trail = await getAuditTrail({
				organizationId: Number(query.organizationId),
				...(query.agentName !== undefined
					? { agentName: query.agentName }
					: {}),
				...(query.decisionType !== undefined
					? { decisionType: query.decisionType }
					: {}),
				...(query.limit ? { limit: Number(query.limit) } : {}),
			});

			const xml = await exportToXml(trail, {
				companyRuc: query.companyRuc,
				companyName: query.companyName,
			});

			const date = new Date().toISOString().slice(0, 10);
			set.headers["Content-Type"] = "application/xml; charset=utf-8";
			set.headers["Content-Disposition"] =
				`attachment; filename="audit-trail-${query.organizationId}-${date}.xml"`;
			set.headers["Content-Length"] = Buffer.byteLength(
				xml,
				"utf-8",
			).toString();

			return xml;
		},
		{
			query: t.Object({
				organizationId: t.String(),
				companyRuc: t.String({ minLength: 11, maxLength: 11 }),
				companyName: t.String({ minLength: 1 }),
				agentName: t.Optional(t.String()),
				decisionType: t.Optional(t.String()),
				limit: t.Optional(t.String()),
			}),
		},
	)

	// GET /audit-trail/export/pdf?organizationId=1&companyName=Drenyra
	.get(
		"/export/pdf",
		async ({ query, headers, set }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "audit:trail:export",
				resource: "/audit-trail/export/pdf",
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const trail = await getAuditTrail({
				organizationId: Number(query.organizationId),
				...(query.agentName !== undefined
					? { agentName: query.agentName }
					: {}),
				...(query.decisionType !== undefined
					? { decisionType: query.decisionType }
					: {}),
				...(query.limit ? { limit: Number(query.limit) } : {}),
			});

			const pdfBuffer = await exportToPdf(trail, {
				companyName: query.companyName,
				...(query.companyRuc !== undefined
					? { companyRuc: query.companyRuc }
					: {}),
				reportDate: new Date(),
			});

			const date = new Date().toISOString().slice(0, 10);
			set.headers["Content-Type"] = "application/pdf";
			set.headers["Content-Disposition"] =
				`attachment; filename="audit-trail-${query.organizationId}-${date}.pdf"`;
			set.headers["Content-Length"] = pdfBuffer.length.toString();

			return pdfBuffer;
		},
		{
			query: t.Object({
				organizationId: t.String(),
				companyName: t.String({ minLength: 1 }),
				companyRuc: t.Optional(t.String({ minLength: 11, maxLength: 11 })),
				agentName: t.Optional(t.String()),
				decisionType: t.Optional(t.String()),
				limit: t.Optional(t.String()),
			}),
		},
	);
