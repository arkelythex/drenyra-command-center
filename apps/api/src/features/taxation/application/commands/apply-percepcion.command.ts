import type { PercepcionType } from "@drenyra/domain/services/TaxCalculator";
import { Money } from "@drenyra/domain/value-objects/Money";
import type { EventBusPort } from "@drenyra/infrastructure/events/event.port";
import { SecureLogger } from "@drenyra/shared/secure-logger";
import { Percepcion } from "../../domain/entities/percepcion.entity";
import type { PercepcionApplied } from "../../domain/events/percepcion-applied.event";
import { percepcionRepository } from "../../infrastructure/percepcion.repository";
import { mapCreateFromBillToPercepcionLifecycleError } from "../errors/percepcion-lifecycle.error";

export class PercepcionApplyError extends Error {
	constructor(
		message: string,
		public readonly httpStatus: number,
		public readonly errorCode: string,
	) {
		super(message);
		this.name = "PercepcionApplyError";
	}
}

export interface ApplyPercepcionCommand {
	companyId: string;
	billId: string;
	agentRuc: string;
	percepcionType: PercepcionType;
	totalAmountCents: number;
}

export interface ApplyPercepcionResult {
	percepcionId: string;
	percepcionAmountCents: number;
	declarationPeriod: string;
	sunatDueDate: string;
}

const logger = SecureLogger.namespace("applyPercepcion");

export async function applyPercepcion(
	cmd: ApplyPercepcionCommand,
	deps?: { eventBus?: EventBusPort },
): Promise<ApplyPercepcionResult> {
	const eventBus = deps?.eventBus;
	const repo = percepcionRepository;

	const existing = await repo.findByBillId(cmd.billId);
	if (existing && existing.status !== "CANCELLED") {
		throw new PercepcionApplyError(
			`La factura ${cmd.billId} ya tiene una percepción activa en estado ${existing.status}`,
			409,
			"CONFLICT",
		);
	}

	const totalAmount = Money.fromCents(cmd.totalAmountCents, "PEN");
	let created: [Percepcion, PercepcionApplied];
	try {
		created = Percepcion.createFromBill({
			companyId: cmd.companyId,
			billId: cmd.billId,
			agentRuc: cmd.agentRuc,
			percepcionType: cmd.percepcionType,
			totalAmount,
		});
	} catch (err: unknown) {
		const mapped = mapCreateFromBillToPercepcionLifecycleError(err);
		if (mapped) {
			throw new PercepcionApplyError(
				mapped.message,
				mapped.httpStatus,
				mapped.errorCode,
			);
		}
		throw err;
	}
	const [percepcion, event] = created;

	await repo.save(percepcion);

	if (eventBus) {
		await eventBus
			.publish("taxation.percepcion.applied", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish PercepcionApplied event", { err });
			});
	}

	logger.info("Percepcion applied", {
		percepcionId: percepcion.id,
		billId: cmd.billId,
		percepcionAmountCents: percepcion.percepcionAmount.getCents(),
	});

	return {
		percepcionId: percepcion.id,
		percepcionAmountCents: percepcion.percepcionAmount.getCents(),
		declarationPeriod: percepcion.declarationPeriod,
		sunatDueDate: percepcion.sunatDueDate.toISOString().slice(0, 10),
	};
}
