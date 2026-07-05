import type { EventBusPort } from "@drenyra/infrastructure/events/event.port";
import { SecureLogger } from "@drenyra/shared/secure-logger";
import { retencionRepository } from "../../infrastructure/retencion.repository";
import {
	mapCancelDomainError,
	RetentionLifecycleError,
} from "../errors/retention-lifecycle.error";

export interface CancelRetentionCommand {
	retentionId: string;
	reason: string;
}

const logger = SecureLogger.namespace("cancelRetention");

export async function cancelRetention(
	cmd: CancelRetentionCommand,
	deps?: { eventBus?: EventBusPort },
): Promise<void> {
	const eventBus = deps?.eventBus;
	const repo = retencionRepository;

	const retencion = await repo.findById(cmd.retentionId);
	if (!retencion) {
		throw new RetentionLifecycleError(
			`Retención no encontrada: ${cmd.retentionId}`,
			404,
			"NOT_FOUND",
		);
	}

	const transition = (() => {
		try {
			return retencion.cancel(cmd.reason);
		} catch (err: unknown) {
			const mapped = mapCancelDomainError(err);
			if (mapped) throw mapped;
			throw err;
		}
	})();
	const [cancelled, event] = transition;

	await repo.update(cancelled);

	if (eventBus) {
		await eventBus
			.publish("taxation.retention.cancelled", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish RetentionCancelled event", { err });
			});
	}

	logger.info("Retention cancelled", {
		retentionId: cmd.retentionId,
		reason: cmd.reason,
	});
}
