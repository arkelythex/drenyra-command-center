import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { percepcionRepository } from "../../infrastructure/percepcion.repository";
import {
	mapCancelDomainError,
	PercepcionLifecycleError,
} from "../errors/percepcion-lifecycle.error";

export interface CancelPercepcionCommand {
	percepcionId: string;
	reason: string;
}

const logger = SecureLogger.namespace("cancelPercepcion");

export async function cancelPercepcion(
	cmd: CancelPercepcionCommand,
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
			return percepcion.cancel(cmd.reason);
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
			.publish("taxation.percepcion.cancelled", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish PercepcionCancelled event", { err });
			});
	}

	logger.info("Percepcion cancelled", {
		percepcionId: cmd.percepcionId,
		reason: cmd.reason,
	});
}
