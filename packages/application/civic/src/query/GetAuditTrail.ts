/**
 * GetAuditTrail — Query handler
 *
 * Returns paginated, chronological audit trail entries for an electoral act.
 */
import type { AuditTrailRepository } from "@arkelythex/domain-civic";
import type { AuditTrailEntryDTO } from "../dto";

export interface GetAuditTrailInput {
	actId: string;
	offset?: number;
	limit?: number;
}

export class GetAuditTrail {
	constructor(private readonly auditRepo: AuditTrailRepository) {}

	async execute(input: GetAuditTrailInput): Promise<AuditTrailEntryDTO[]> {
		const entries = await this.auditRepo.findByAct(input.actId);

		// Apply pagination
		const offset = input.offset ?? 0;
		const limit = input.limit ?? entries.length;
		const paginated = entries.slice(offset, offset + limit);

		return paginated.map((entry) => ({
			id: entry.id,
			actId: entry.actId,
			action: entry.action,
			actor: entry.actor,
			timestamp: entry.timestamp.toISOString(),
			evidence: [...entry.evidence],
			metadata: { ...entry.metadata },
		}));
	}
}
