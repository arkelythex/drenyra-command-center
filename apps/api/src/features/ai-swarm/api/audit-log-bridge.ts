import { createLogger } from "../../../lib/logger";
import { logAgentDecision } from "../../agent-audit-trail";
import { sanitizeAiObservationPayload } from "./ai-observability-sanitizer";

const logger = createLogger({ module: "ai-swarm/audit-log-bridge" });

interface EnqueueSwarmAuditLogInput {
	organizationId: number | null;
	agentName: string;
	agentVersion?: string;
	decisionType: string;
	reasoning?: string;
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	pluginIds?: string[];
}

/**
 * Result of attempting to enqueue an AI Swarm audit log.
 *
 * @returns Whether persistence was queued or intentionally skipped.
 * @example
 * ```ts
 * const result: SwarmAuditLogEnqueueResult = { queued: false, reason: "test-db-disabled" };
 * console.log(result.queued);
 * ```
 */
export type SwarmAuditLogEnqueueResult =
	| { queued: true }
	| {
			queued: false;
			reason: "missing-organization-context" | "test-db-disabled";
		};

/**
 * Enqueues an AI Swarm audit log when a valid organization context is available.
 *
 * @param input - Sanitized audit decision payload plus organization context.
 * @returns Explicit enqueue/no-op result so tests can assert missing-context behavior.
 * @example
 * ```ts
 * const result = enqueueSwarmAuditLog({ organizationId: null, agentName: "agent", decisionType: "NOOP", inputs: {}, outputs: {} });
 * console.log(result.reason);
 * ```
 */
export function enqueueSwarmAuditLog(
	input: EnqueueSwarmAuditLogInput,
): SwarmAuditLogEnqueueResult {
	if (!input.organizationId || input.organizationId <= 0) {
		return { queued: false, reason: "missing-organization-context" };
	}

	if (process.env.NODE_ENV === "test" && process.env.RUN_DB_TESTS !== "1") {
		return { queued: false, reason: "test-db-disabled" };
	}

	void logAgentDecision({
		organizationId: input.organizationId,
		agentName: input.agentName,
		agentVersion: input.agentVersion,
		decisionType: input.decisionType,
		reasoning: input.reasoning,
		inputs: sanitizeAiObservationPayload(input.inputs) as Record<
			string,
			unknown
		>,
		outputs: sanitizeAiObservationPayload(input.outputs) as Record<
			string,
			unknown
		>,
		pluginIds: input.pluginIds,
	}).catch((error) => {
		logger.error(
			{
				error,
				organizationId: input.organizationId,
				decisionType: input.decisionType,
			},
			"Failed to persist AI swarm audit log",
		);
	});

	return { queued: true };
}
