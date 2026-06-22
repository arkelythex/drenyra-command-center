import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { retencionRepository } from "../../infrastructure/retencion.repository";
import {
	mapPayDomainError,
	RetentionLifecycleError,
} from "../errors/retention-lifecycle.error";

export interface MarkRetentionPaidCommand {
	retentionId: string;
	bankTransactionId: string;
}

const logger = SecureLogger.namespace("markRetentionPaid");

export async function markRetentionPaid(
	cmd: MarkRetentionPaidCommand,
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
			return retencion.markPaid(cmd.bankTransactionId);
		} catch (err: unknown) {
			const mapped = mapPayDomainError(err);
			if (mapped) throw mapped;
			throw err;
		}
	})();
	const [paid, event] = transition;

	await repo.update(paid);

	if (eventBus) {
		await eventBus
			.publish("taxation.retention.paid", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish RetentionPaid event", { err });
			});
	}

	logger.info("Retention paid", {
		retentionId: cmd.retentionId,
		bankTransactionId: cmd.bankTransactionId,
	});
}
