/**
 * CashflowRetentionHandler — EventBus subscriber for retention events.
 *
 * Subscribes to retention lifecycle events relevant for projected cashflow visibility.
 * Stores retention data so GetCashflowProjectionQuery can split bill outflows
 * into: (1) net-to-supplier and (2) SUNAT-due-day-15.
 *
 * Architecture decision: projections are computed on-demand via JOIN with
 * retenciones table. This handler only needs to log + emit observability signals.
 * No separate cashflow_adjustments table needed at this stage.
 *
 * @module taxation/application/handlers
 *
 * @example
 * ```ts
 * const handler = new CashflowRetentionHandler();
 * await handler.registerSubscriptions(eventBus);
 * ```
 */

import type {
	DomainEvent,
	EventBusPort,
} from "@arkelythex/infrastructure/events/event.port";
import { SecureLogger } from "@arkelythex/shared/secure-logger";

/**
 * Shape of the RetentionApplied event payload received from EventBus.
 */
interface RetentionAppliedEventPayload {
	retentionId: string;
	companyId: string;
	billId: string;
	supplierRuc: string;
	baseAmountCents: number;
	retentionAmountCents: number;
	declarationPeriod: string;
	sunatDueDate: string; // ISO date
}

/**
 * Shape of the RetentionCancelled event payload received from EventBus.
 */
interface RetentionCancelledEventPayload {
	retentionId: string;
	companyId: string;
	reason: string;
}

interface RetentionDeclaredEventPayload {
	retentionId: string;
	companyId: string;
	declarationPeriod: string;
	pdtReference: string;
	retentionAmountCents: number;
	declaredAt: string;
}

interface RetentionPaidEventPayload {
	retentionId: string;
	companyId: string;
	bankTransactionId: string;
	retentionAmountCents: number;
	paidAt: string;
}

/**
 * Handles cashflow projection adjustments triggered by retention events.
 *
 * When a retention is applied to a bill, the cashflow projection must show:
 * - Outflow 1: bill.totalAmount − retentionAmount → to supplier (original due date)
 * - Outflow 2: retentionAmount → to SUNAT (day 15 of following month)
 *
 * This is achieved by GetCashflowProjectionQuery doing a JOIN with retenciones.
 * This handler registers the EventBus subscriptions and logs for observability.
 *
 * @example
 * ```ts
 * const handler = new CashflowRetentionHandler();
 * await handler.registerSubscriptions(eventBus);
 * ```
 */
export class CashflowRetentionHandler {
	private readonly logger = SecureLogger.namespace("CashflowRetentionHandler");

	/**
	 * Registers all retention event subscriptions on the EventBus.
	 * Call this during application startup.
	 *
	 * @example
	 * ```ts
	 * await cashflowRetentionHandler.registerSubscriptions(eventBus);
	 * ```
	 */
	async registerSubscriptions(eventBus: EventBusPort): Promise<void> {
		await eventBus.subscribe<RetentionAppliedEventPayload>(
			"taxation.retention.applied",
			(event) => this.onRetentionApplied(event),
			{
				queue: "cashflow.retention-applied",
				durable: "cashflow-retention-applied",
			},
		);

		await eventBus.subscribe<RetentionDeclaredEventPayload>(
			"taxation.retention.declared",
			(event) => this.onRetentionDeclared(event),
			{
				queue: "cashflow.retention-declared",
				durable: "cashflow-retention-declared",
			},
		);

		await eventBus.subscribe<RetentionPaidEventPayload>(
			"taxation.retention.paid",
			(event) => this.onRetentionPaid(event),
			{ queue: "cashflow.retention-paid", durable: "cashflow-retention-paid" },
		);

		await eventBus.subscribe<RetentionCancelledEventPayload>(
			"taxation.retention.cancelled",
			(event) => this.onRetentionCancelled(event),
			{
				queue: "cashflow.retention-cancelled",
				durable: "cashflow-retention-cancelled",
			},
		);

		this.logger.info("CashflowRetentionHandler subscriptions registered");
	}

	/**
	 * Handles RetentionApplied event.
	 * The retenciones table is updated by the command handler already.
	 * GetCashflowProjectionQuery will JOIN with it on next query execution.
	 */
	private onRetentionApplied(
		event: DomainEvent<RetentionAppliedEventPayload>,
	): void {
		const {
			retentionId,
			companyId,
			billId,
			retentionAmountCents,
			sunatDueDate,
		} = event.payload;

		this.logger.info("Cashflow adjustment triggered by RetentionApplied", {
			retentionId,
			companyId,
			billId,
			retentionAmountCents,
			sunatDueDate,
			impact: "Bill outflow split: net-to-supplier + SUNAT day-15 obligation",
		});

		// The actual cashflow adjustment is query-time (on-demand JOIN).
		// No separate table write needed: retenciones table IS the source of truth.
	}

	/**
	 * Handles RetentionDeclared event.
	 * Cashflow still remains active, but observability should show that the SUNAT
	 * obligation is already included in a PDT 626 filing.
	 */
	private onRetentionDeclared(
		event: DomainEvent<RetentionDeclaredEventPayload>,
	): void {
		const {
			retentionId,
			companyId,
			declarationPeriod,
			pdtReference,
			retentionAmountCents,
		} = event.payload;

		this.logger.info("Cashflow retention obligation declared in PDT 626", {
			retentionId,
			companyId,
			declarationPeriod,
			pdtReference,
			retentionAmountCents,
			impact:
				"Projected SUNAT outflow remains pending until bank payment occurs",
		});
	}

	/**
	 * Handles RetentionPaid event.
	 * Once paid, future cashflow projections will stop including the SUNAT outflow
	 * because queries filter only PENDING/DECLARED retentions.
	 */
	private onRetentionPaid(event: DomainEvent<RetentionPaidEventPayload>): void {
		const {
			retentionId,
			companyId,
			bankTransactionId,
			retentionAmountCents,
			paidAt,
		} = event.payload;

		this.logger.info("Cashflow retention obligation settled", {
			retentionId,
			companyId,
			bankTransactionId,
			retentionAmountCents,
			paidAt,
			impact: "Future projections stop including this SUNAT outflow",
		});
	}

	/**
	 * Handles RetentionCancelled event.
	 * The bill outflow reverts to its original amount in the next projection query.
	 */
	private onRetentionCancelled(
		event: DomainEvent<RetentionCancelledEventPayload>,
	): void {
		const { retentionId, companyId, reason } = event.payload;

		this.logger.info("Cashflow adjustment reversed by RetentionCancelled", {
			retentionId,
			companyId,
			reason,
			impact: "Bill outflow restored to original amount in projection",
		});
	}
}

/**
 * Default singleton instance.
 *
 * @example
 * ```ts
 * await cashflowRetentionHandler.registerSubscriptions(eventBus);
 * ```
 */
export const cashflowRetentionHandler = new CashflowRetentionHandler();
