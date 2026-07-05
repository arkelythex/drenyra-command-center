import type { PercepcionType } from "@drenyra/domain/services/TaxCalculator";
import { TaxCalculator } from "@drenyra/domain/services/TaxCalculator";
import type { Money } from "@drenyra/domain/value-objects/Money";
import { PercepcionApplied } from "../events/percepcion-applied.event";
import { PercepcionCancelled } from "../events/percepcion-cancelled.event";
import { PercepcionDeclared } from "../events/percepcion-declared.event";
import { PercepcionPaid } from "../events/percepcion-paid.event";
import { toPeruTaxDateKey } from "../tax-date";

/**
 * Lifecycle states for percepción IGV declarations.
 *
 * @example
 * ```ts
 * const status: PercepcionStatus = 'PENDING';
 * ```
 */
export type PercepcionStatus = "PENDING" | "DECLARED" | "PAID" | "CANCELLED";

/**
 * Reconstitution shape used by persistence adapters.
 *
 * @example
 * ```ts
 * const props: PercepcionProps = { ...raw, status: 'PENDING' };
 * ```
 */
export interface PercepcionProps {
	id: string;
	companyId: string;
	billId: string;
	agentRuc: string;
	percepcionType: string;
	totalAmount: Money;
	percepcionAmount: Money;
	status: PercepcionStatus;
	declarationPeriod: string;
	sunatDueDate: Date;
	pdtReference?: string;
	cancellationReason?: string;
	createdAt: Date;
	declaredAt?: Date;
	paidAt?: Date;
	cancelledAt?: Date;
}

interface CreatePercepcionParams {
	companyId: string;
	billId: string;
	agentRuc: string;
	percepcionType: PercepcionType;
	totalAmount: Money;
	appliedAt?: Date;
}

/**
 * Aggregate root for percepción IGV lifecycle and invariants.
 *
 * @example
 * ```ts
 * const [percepcion] = Percepcion.createFromBill({ companyId, billId, agentRuc, percepcionType: 'VENTA_INTERNA', totalAmount });
 * ```
 */
export class Percepcion {
	private constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly billId: string,
		public readonly agentRuc: string,
		public readonly percepcionType: string,
		public readonly totalAmount: Money,
		public readonly percepcionAmount: Money,
		public readonly status: PercepcionStatus,
		public readonly declarationPeriod: string,
		public readonly sunatDueDate: Date,
		public readonly createdAt: Date,
		public readonly pdtReference?: string,
		public readonly declaredAt?: Date,
		public readonly paidAt?: Date,
		public readonly cancelledAt?: Date,
		public readonly cancellationReason?: string,
	) {}

	static createFromBill(
		params: CreatePercepcionParams,
	): [Percepcion, PercepcionApplied] {
		const appliedAt = params.appliedAt ?? new Date();
		Percepcion.assertAgentRuc(params.agentRuc);
		Percepcion.assertTotalAmount(params.totalAmount);

		const calcResult = TaxCalculator.calculatePercepcion(
			params.totalAmount,
			params.percepcionType,
		);
		const percepcionAmount = calcResult.taxAmount;
		const declarationPeriod = toPeruTaxDateKey(appliedAt).slice(0, 7);
		const sunatDueDate = buildSunatDueDate(appliedAt);

		const percepcion = new Percepcion(
			crypto.randomUUID(),
			params.companyId,
			params.billId,
			params.agentRuc,
			params.percepcionType,
			params.totalAmount,
			percepcionAmount,
			"PENDING",
			declarationPeriod,
			sunatDueDate,
			appliedAt,
		);

		return [
			percepcion,
			new PercepcionApplied(
				percepcion.companyId,
				percepcion.id,
				percepcion.billId,
				percepcion.agentRuc,
				percepcion.percepcionType,
				percepcion.totalAmount,
				percepcion.percepcionAmount,
				percepcion.declarationPeriod,
				percepcion.sunatDueDate,
			),
		];
	}

	static reconstitute(props: PercepcionProps): Percepcion {
		Percepcion.assertAgentRuc(props.agentRuc);
		Percepcion.assertTotalAmount(props.totalAmount);
		Percepcion.assertMoneyShape(
			props.totalAmount,
			props.percepcionAmount,
			props.percepcionType,
		);
		Percepcion.assertDeclarationPeriod(props.declarationPeriod);
		Percepcion.assertStatusConsistency(props);

		return new Percepcion(
			props.id,
			props.companyId,
			props.billId,
			props.agentRuc,
			props.percepcionType,
			props.totalAmount,
			props.percepcionAmount,
			props.status,
			props.declarationPeriod,
			props.sunatDueDate,
			props.createdAt,
			props.pdtReference,
			props.declaredAt,
			props.paidAt,
			props.cancelledAt,
			props.cancellationReason,
		);
	}

	get isOverdue(): boolean {
		if (this.status === "PAID" || this.status === "CANCELLED") {
			return false;
		}

		const dueUtc = Date.UTC(
			this.sunatDueDate.getUTCFullYear(),
			this.sunatDueDate.getUTCMonth(),
			this.sunatDueDate.getUTCDate(),
		);
		const today = new Date();
		const todayUtc = Date.UTC(
			today.getUTCFullYear(),
			today.getUTCMonth(),
			today.getUTCDate(),
		);

		return dueUtc < todayUtc;
	}

	declare(
		pdtReference: string,
		declaredAt = new Date(),
	): [Percepcion, PercepcionDeclared] {
		if (this.status !== "PENDING") {
			throw new Error("Only pending percepciones can be declared");
		}

		const reference = pdtReference.trim();
		if (!reference) {
			throw new Error("PDT reference is required");
		}

		const next = new Percepcion(
			this.id,
			this.companyId,
			this.billId,
			this.agentRuc,
			this.percepcionType,
			this.totalAmount,
			this.percepcionAmount,
			"DECLARED",
			this.declarationPeriod,
			this.sunatDueDate,
			this.createdAt,
			reference,
			declaredAt,
			undefined,
			undefined,
			undefined,
		);

		return [
			next,
			new PercepcionDeclared(
				next.companyId,
				next.id,
				next.declarationPeriod,
				reference,
				next.percepcionAmount.getCents(),
				declaredAt,
			),
		];
	}

	markPaid(
		bankTransactionId: string,
		paidAt = new Date(),
	): [Percepcion, PercepcionPaid] {
		if (this.status !== "DECLARED") {
			throw new Error("Only declared percepciones can be marked as paid");
		}

		const transactionId = bankTransactionId.trim();
		if (!transactionId) {
			throw new Error("Bank transaction ID is required");
		}

		const next = new Percepcion(
			this.id,
			this.companyId,
			this.billId,
			this.agentRuc,
			this.percepcionType,
			this.totalAmount,
			this.percepcionAmount,
			"PAID",
			this.declarationPeriod,
			this.sunatDueDate,
			this.createdAt,
			this.pdtReference,
			this.declaredAt,
			paidAt,
			undefined,
			undefined,
		);

		return [
			next,
			new PercepcionPaid(
				next.companyId,
				next.id,
				transactionId,
				next.percepcionAmount.getCents(),
				paidAt,
			),
		];
	}

	cancel(
		reason: string,
		cancelledAt = new Date(),
	): [Percepcion, PercepcionCancelled] {
		if (this.status === "PAID") {
			throw new Error("Paid percepciones cannot be cancelled");
		}
		if (this.status === "CANCELLED") {
			throw new Error("Percepcion is already cancelled");
		}

		const normalizedReason = reason.trim();
		if (!normalizedReason) {
			throw new Error("Cancellation reason is required");
		}

		const next = new Percepcion(
			this.id,
			this.companyId,
			this.billId,
			this.agentRuc,
			this.percepcionType,
			this.totalAmount,
			this.percepcionAmount,
			"CANCELLED",
			this.declarationPeriod,
			this.sunatDueDate,
			this.createdAt,
			this.pdtReference,
			this.declaredAt,
			this.paidAt,
			cancelledAt,
			normalizedReason,
		);

		return [
			next,
			new PercepcionCancelled(
				next.companyId,
				next.id,
				normalizedReason,
				cancelledAt,
			),
		];
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			companyId: this.companyId,
			billId: this.billId,
			agentRuc: this.agentRuc,
			percepcionType: this.percepcionType,
			totalAmount: this.totalAmount.toJSON(),
			percepcionAmount: this.percepcionAmount.toJSON(),
			status: this.status,
			declarationPeriod: this.declarationPeriod,
			sunatDueDate: this.sunatDueDate.toISOString(),
			pdtReference: this.pdtReference,
			createdAt: this.createdAt.toISOString(),
			declaredAt: this.declaredAt?.toISOString(),
			paidAt: this.paidAt?.toISOString(),
			cancelledAt: this.cancelledAt?.toISOString(),
			cancellationReason: this.cancellationReason,
		};
	}

	private static assertAgentRuc(agentRuc: string): void {
		if (!/^\d{11}$/.test(agentRuc)) {
			throw new Error("Agent RUC must contain 11 digits");
		}
	}

	private static assertTotalAmount(totalAmount: Money): void {
		if (totalAmount.getCurrency() !== "PEN") {
			throw new Error("Percepcion only applies to PEN amounts");
		}
		if (!totalAmount.isPositive()) {
			throw new Error("Total amount must be positive");
		}
		if (!TaxCalculator.shouldApplyPercepcion(totalAmount)) {
			throw new Error(
				"Percepcion only applies to PEN amounts of S/ 700 or more",
			);
		}
	}

	private static assertMoneyShape(
		totalAmount: Money,
		percepcionAmount: Money,
		percepcionType: string,
	): void {
		if (totalAmount.getCurrency() !== percepcionAmount.getCurrency()) {
			throw new Error(
				"Percepcion amount currency must match total amount currency",
			);
		}

		const expected = TaxCalculator.calculatePercepcion(
			totalAmount,
			percepcionType,
		).taxAmount;
		if (!percepcionAmount.equals(expected)) {
			throw new Error(
				`Percepcion amount must equal ${TaxCalculator.getPercepcionRate(percepcionType)?.rate ?? "??"}% of the total amount`,
			);
		}
	}

	private static assertDeclarationPeriod(period: string): void {
		if (!/^\d{4}-\d{2}$/.test(period)) {
			throw new Error("Declaration period must use YYYY-MM format");
		}
	}

	private static assertStatusConsistency(props: PercepcionProps): void {
		if (
			props.status === "DECLARED" &&
			(!props.pdtReference || !props.declaredAt)
		) {
			throw new Error(
				"Declared percepciones require PDT reference and declared date",
			);
		}

		if (
			props.status === "PAID" &&
			(!props.pdtReference || !props.declaredAt || !props.paidAt)
		) {
			throw new Error("Paid percepciones require declared and paid timestamps");
		}

		if (
			props.status === "CANCELLED" &&
			(!props.cancelledAt || !props.cancellationReason)
		) {
			throw new Error("Cancelled percepciones require cancellation metadata");
		}
	}
}

function buildSunatDueDate(appliedAt: Date): Date {
	const periodKey = toPeruTaxDateKey(appliedAt);
	const year = Number.parseInt(periodKey.slice(0, 4), 10);
	const month = Number.parseInt(periodKey.slice(5, 7), 10);

	if (!Number.isFinite(year) || !Number.isFinite(month)) {
		throw new Error("Unable to derive percepcion due date");
	}

	if (month === 12) {
		return new Date(Date.UTC(year + 1, 0, 15, 0, 0, 0, 0));
	}

	return new Date(Date.UTC(year, month, 15, 0, 0, 0, 0));
}
