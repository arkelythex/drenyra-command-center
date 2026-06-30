/**
 * AuditTrailEntry DTO — Output for audit trail queries
 */
import { z } from "zod";

export const AuditTrailEntrySchema = z.object({
	id: z.string(),
	actId: z.string(),
	action: z.string(),
	actor: z.string(),
	timestamp: z.string().datetime(),
	evidence: z.array(z.string()),
	metadata: z.record(z.string(), z.unknown()),
});

export type AuditTrailEntryDTO = z.infer<typeof AuditTrailEntrySchema>;
