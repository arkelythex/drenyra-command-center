import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { percepcionRepository } from "../../infrastructure/percepcion.repository";
import {
	mapPayDomainError,
	PercepcionLifecycleError,
} from "../errors/percepcion-lifecycle.error";

export interface MarkPercepcionPaidCommand {
	percepcionId: string;
	bankTransactionId: string;
}

const logger = SecureLogger.namespace("markPercepcionPaid");

export async function markPercepcionPaid(
	cmd: MarkPercepcionPaidCommand,
	deps?: { eventBus?: EventBusPort },
): Promise<void> {
	const eventBus = deps?.eventBus;
	const repo = percepcionRepository;

	const percepcion = await repo.findById(cmd.percepcionId);
	if (!percepcion) {
		throw new PercepcionLifecycleError(
			`Percepción no encontrada: ${cmd.percepcionId}`,
			404,
			"NOT_FOUND",
		);
	}

	const transition = (() => {
		try {
			return percepcion.markPaid(cmd.bankTransactionId);
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
			.publish("taxation.percepcion.paid", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish PercepcionPaid event", { err });
			});
	}

	logger.info("Percepcion paid", {
		percepcionId: cmd.percepcionId,
		bankTransactionId: cmd.bankTransactionId,
	});
}
