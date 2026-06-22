import { Elysia } from "elysia";
import { fail, ok } from "../../shared/api-response";
import { resolveFiscalCmdContext } from "./context";
import { type RecordAuditEventInput, RecordAuditEventSchema } from "./schemas";
import { auditEventService } from "./services/audit-events.service";

type AuditEventService = typeof auditEventService;

/**
 * createAuditEventsRoutes operation.
 *
 * @param service - Input for service.
 * @returns Result of createAuditEventsRoutes.
 * @example
 * ```ts
 * const result = createAuditEventsRoutes({} as AuditEventService);
 * console.log(result);
 * ```
 */
export function createAuditEventsRoutes(
	service: AuditEventService = auditEventService,
) {
	return new Elysia({ prefix: "/audit" })
		.get(
			"/",
			async ({ headers, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(await service.list(resolved.context));
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.post(
			"/",
			async ({ headers, body, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const input = body as RecordAuditEventInput;
				const occurredAt = input.occurredAt
					? new Date(input.occurredAt)
					: undefined;
				return ok(
					await service.record(
						{
							eventType: input.eventType,
							entityType: input.entityType,
							entityId: input.entityId,
							action: input.action,
							changes: input.changes,
							occurredAt,
						},
						resolved.context,
					),
				);
			},
			{
				body: RecordAuditEventSchema,
				detail: { tags: ["Fiscal Command Center"] },
			},
		)
		.get(
			"/verify-chain",
			async ({ headers, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(await service.verifyChain(resolved.context));
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const event = await service.getById(params.id, resolved.context);
				if (!event) {
					set.status = 404;
					return fail("Audit event not found", "NOT_FOUND");
				}
				return ok(event);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		);
}

/**
 * auditEventsRoutes const.
 *
 * @example
 * ```ts
 * console.log(auditEventsRoutes);
 * ```
 */
export const auditEventsRoutes = createAuditEventsRoutes();
