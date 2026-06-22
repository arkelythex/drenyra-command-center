import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { percepcionRepository } from "../../infrastructure/percepcion.repository";
import {
	mapDeclareDomainError,
	PercepcionLifecycleError,
} from "../errors/percepcion-lifecycle.error";

export interface DeclarePercepcionCommand {
	percepcionId: string;
	pdtReference: string;
}

const logger = SecureLogger.namespace("declarePercepcion");

export async function declarePercepcion(
	cmd: DeclarePercepcionCommand,
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
			return percepcion.declare(cmd.pdtReference);
		} catch (err: unknown) {
			const mapped = mapDeclareDomainError(err);
			if (mapped) throw mapped;
			throw err;
		}
	})();
	const [declared, event] = transition;

	await repo.update(declared);

	if (eventBus) {
		await eventBus
			.publish("taxation.percepcion.declared", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish PercepcionDeclared event", { err });
			});
	}

	logger.info("Percepcion declared", {
		percepcionId: cmd.percepcionId,
		pdtReference: cmd.pdtReference,
	});
}
