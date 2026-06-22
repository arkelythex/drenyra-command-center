import { createHash } from "node:crypto";
import type { AuditEventRecord, FiscalCommandCenterContext } from "../types";

type AuditRecordInput = {
	eventType: string;
	entityType: string;
	entityId: string;
	action: string;
	changes?: Record<string, unknown>;
	occurredAt?: Date;
};

function sameAuditScope(
	row: Pick<
		AuditEventRecord,
		"organizationId" | "companyId" | "companyRuc" | "period"
	>,
	ctx: FiscalCommandCenterContext,
): boolean {
	return (
		row.organizationId === ctx.organizationId &&
		row.companyId === ctx.companyId &&
		row.companyRuc === ctx.companyRuc &&
		row.period === ctx.period
	);
}

function byOccurredDesc(a: AuditEventRecord, b: AuditEventRecord): number {
	return (
		b.occurredAt.getTime() - a.occurredAt.getTime() ||
		b.createdAt.getTime() - a.createdAt.getTime()
	);
}

function byOccurredAsc(a: AuditEventRecord, b: AuditEventRecord): number {
	return (
		a.occurredAt.getTime() - b.occurredAt.getTime() ||
		a.createdAt.getTime() - b.createdAt.getTime()
	);
}

function stableSerialize(value: unknown): string {
	if (value === null || typeof value !== "object") {
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
	}

	const objectValue = value as Record<string, unknown>;
	const keys = Object.keys(objectValue).sort();
	const pairs = keys.map(
		(key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key])}`,
	);
	return `{${pairs.join(",")}}`;
}

function computeAuditHash(input: {
	previousHash: string | null;
	eventType: string;
	entityType: string;
	entityId: string;
	action: string;
	actorId: string;
	changes: Record<string, unknown>;
	occurredAt: string;
}): string {
	const canonical = stableSerialize(input);
	return createHash("sha256").update(canonical).digest("hex");
}

/**
 * createAuditEventService operation.
 *
 * @param seed - Input for seed.
 * @returns Result of createAuditEventService.
 * @example
 * ```ts
 * const result = createAuditEventService({});
 * console.log(result);
 * ```
 */
export function createAuditEventService(
	seed: { events?: AuditEventRecord[] } = {},
) {
	const events = [...(seed.events ?? [])];

	async function getById(id: string, ctx: FiscalCommandCenterContext) {
		return (
			events.find((event) => event.id === id && sameAuditScope(event, ctx)) ??
			null
		);
	}

	return {
		async list(ctx: FiscalCommandCenterContext) {
			return events
				.filter((event) => sameAuditScope(event, ctx))
				.sort(byOccurredDesc);
		},

		getById,

		async record(input: AuditRecordInput, ctx: FiscalCommandCenterContext) {
			const scopedEvents = events
				.filter((event) => sameAuditScope(event, ctx))
				.sort(byOccurredDesc);
			const latest = scopedEvents[0];
			const occurredAt = input.occurredAt ?? new Date();
			const previousHash = latest?.hash ?? null;
			const changes = input.changes ?? {};
			const hash = computeAuditHash({
				previousHash,
				eventType: input.eventType,
				entityType: input.entityType,
				entityId: input.entityId,
				action: input.action,
				actorId: ctx.userId,
				changes,
				occurredAt: occurredAt.toISOString(),
			});
			const created: AuditEventRecord = {
				id: crypto.randomUUID(),
				organizationId: ctx.organizationId,
				companyId: ctx.companyId,
				companyRuc: ctx.companyRuc,
				period: ctx.period,
				eventType: input.eventType,
				entityType: input.entityType,
				entityId: input.entityId,
				action: input.action,
				changes,
				previousHash,
				hash,
				actorId: ctx.userId,
				occurredAt,
				createdAt: new Date(),
			};
			events.push(created);
			return created;
		},

		async verifyChain(ctx: FiscalCommandCenterContext) {
			const scopedEvents = events
				.filter((event) => sameAuditScope(event, ctx))
				.sort(byOccurredAsc);
			let expectedPrevious: string | null = null;

			for (const event of scopedEvents) {
				const expectedHash = computeAuditHash({
					previousHash: expectedPrevious,
					eventType: event.eventType,
					entityType: event.entityType,
					entityId: event.entityId,
					action: event.action,
					actorId: event.actorId,
					changes: event.changes,
					occurredAt: event.occurredAt.toISOString(),
				});

				if (
					event.previousHash !== expectedPrevious ||
					event.hash !== expectedHash
				) {
					return {
						valid: false,
						brokenEventId: event.id,
						expectedPreviousHash: expectedPrevious,
						expectedHash,
						actualPreviousHash: event.previousHash,
						actualHash: event.hash,
					};
				}

				expectedPrevious = event.hash;
			}

			return {
				valid: true,
				count: scopedEvents.length,
				lastHash: expectedPrevious,
			};
		},
	};
}

/**
 * auditEventService const.
 *
 * @example
 * ```ts
 * console.log(auditEventService);
 * ```
 */
export const auditEventService = createAuditEventService();
export { computeAuditHash, stableSerialize };
