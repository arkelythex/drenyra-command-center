import { Money } from "@arkelythex/domain/value-objects/Money";
import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { Retencion } from "../../domain/entities/retencion.entity";
import type { RetentionApplied } from "../../domain/events/retention-applied.event";
import { retencionRepository } from "../../infrastructure/retencion.repository";
import { mapCreateFromBillToLifecycleError } from "../errors/retention-lifecycle.error";

/**
 * Structured error for apply-retention HTTP mapping (vertical slice boundary).
 */
export class RetentionApplyError extends Error {
	constructor(
		message: string,
		public readonly httpStatus: number,
		public readonly errorCode: string,
	) {
		super(message);
		this.name = "RetentionApplyError";
	}
}

export interface ApplyRetentionCommand {
	companyId: string;
	billId: string;
	supplierRuc: string;
	baseAmountCents: number;
}

export interface ApplyRetentionResult {
	retentionId: string;
	retentionAmountCents: number;
	netToSupplierCents: number;
	declarationPeriod: string;
	sunatDueDate: string;
}

const logger = SecureLogger.namespace("applyRetention");

export async function applyRetention(
	cmd: ApplyRetentionCommand,
	deps?: { eventBus?: EventBusPort },
): Promise<ApplyRetentionResult> {
	const eventBus = deps?.eventBus;
	const repo = retencionRepository;

	const existing = await repo.findByBillId(cmd.billId);
	if (existing && existing.status !== "CANCELLED") {
		throw new RetentionApplyError(
			`La factura ${cmd.billId} ya tiene una retención activa en estado ${existing.status}`,
			409,
			"CONFLICT",
		);
	}

	const baseAmount = Money.fromCents(cmd.baseAmountCents, "PEN");
	let created: [Retencion, RetentionApplied];
	try {
		created = Retencion.createFromBill({
			companyId: cmd.companyId,
			billId: cmd.billId,
			supplierRuc: cmd.supplierRuc,
			baseAmount,
		});
	} catch (err: unknown) {
		const mapped = mapCreateFromBillToLifecycleError(err);
		if (mapped) {
			throw new RetentionApplyError(
				mapped.message,
				mapped.httpStatus,
				mapped.errorCode,
			);
		}
		throw err;
	}
	const [retencion, event] = created;

	await repo.save(retencion);

	if (eventBus) {
		await eventBus
			.publish("taxation.retention.applied", event.toPayload())
			.catch((err) => {
				logger.error("Failed to publish RetentionApplied event", { err });
			});
	}

	logger.info("Retention applied", {
		retentionId: retencion.id,
		billId: cmd.billId,
		retentionAmountCents: retencion.retentionAmount.getCents(),
	});

	return {
		retentionId: retencion.id,
		retentionAmountCents: retencion.retentionAmount.getCents(),
		netToSupplierCents: retencion.netToSupplier.getCents(),
		declarationPeriod: retencion.declarationPeriod,
		sunatDueDate: retencion.sunatDueDate.toISOString().slice(0, 10),
	};
}
