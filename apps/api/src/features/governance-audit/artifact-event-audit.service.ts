import { randomUUID } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { authAuditLogs } from "@drenyra/persistence/schema";

/**
 * GovernanceArtifactEventInput interface.
 *
 * @example
 * ```ts
 * const value: GovernanceArtifactEventInput = {} as GovernanceArtifactEventInput;
 * console.log(value);
 * ```
 */
export interface GovernanceArtifactEventInput {
	companyId: string;
	actorUserId: string;
	actionId: string;
	createdAt: string;
	artifactId: string;
	artifactType: string;
	traceId: string;
	message: string;
	nextStatus?: string;
	payload?: Record<string, unknown>;
	source: "workspace-artifact";
	ipAddress?: string;
	userAgent?: string;
}

/**
 * GovernanceArtifactEventResult interface.
 *
 * @example
 * ```ts
 * const value: GovernanceArtifactEventResult = {} as GovernanceArtifactEventResult;
 * console.log(value);
 * ```
 */
export interface GovernanceArtifactEventResult {
	eventId: string;
	storedAt: string;
}

/**
 * ArtifactEventAuditService class.
 *
 * @example
 * ```ts
 * const value = new ArtifactEventAuditService();
 * console.log(value);
 * ```
 */
export class ArtifactEventAuditService {
	static async record(
		input: GovernanceArtifactEventInput,
	): Promise<GovernanceArtifactEventResult> {
		const eventId = randomUUID();
		const timestamp = toTimestamp(input.createdAt);

		await db.insert(authAuditLogs).values({
			id: eventId,
			userId: input.actorUserId,
			action: normalizeAction(input.actionId),
			timestamp,
			ipAddress: input.ipAddress,
			userAgent: input.userAgent,
			details: {
				type: "ARTIFACT_EVENT",
				source: input.source,
				companyId: input.companyId,
				actionId: input.actionId,
				createdAt: timestamp.toISOString(),
				artifactId: input.artifactId,
				artifactType: input.artifactType,
				traceId: input.traceId,
				message: input.message,
				nextStatus: input.nextStatus,
				payload: input.payload,
			},
		});

		return {
			eventId,
			storedAt: timestamp.toISOString(),
		};
	}
}

function normalizeAction(value: string): string {
	const normalized = value
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9_]/g, "_");
	if (!normalized) {
		return "ARTIFACT_EVENT";
	}
	if (normalized.length <= 50) {
		return normalized;
	}
	return normalized.slice(0, 50);
}

function toTimestamp(value: string): Date {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return new Date();
	}
	return parsed;
}
