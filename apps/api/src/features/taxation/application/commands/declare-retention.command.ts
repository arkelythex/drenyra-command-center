import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { retencionRepository } from "../../infrastructure/retencion.repository";
import {
	mapDeclareDomainError,
	RetentionLifecycleError,
} from "../errors/retention-lifecycle.error";

export interface DeclareRetentionCommand {
	retentionId: string;
	pdtReference: string;
}

const logger = SecureLogger.namespace("declareRetention");

export async function declareRetention(
	cmd: DeclareRetentionCommand,
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
			return retencion.declare(cmd.pdtReference);
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
			.publish("taxation.retention.declared", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish RetentionDeclared event", { err });
			});
	}

	logger.info("Retention declared", {
		retentionId: cmd.retentionId,
		pdtReference: cmd.pdtReference,
	});
}
