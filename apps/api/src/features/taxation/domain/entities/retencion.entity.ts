import { TaxCalculator } from "@drenyra/domain/services/TaxCalculator";
import { Money } from "@drenyra/domain/value-objects/Money";
import { RetentionApplied } from "../events/retention-applied.event";
import { RetentionCancelled } from "../events/retention-cancelled.event";
import { RetentionDeclared } from "../events/retention-declared.event";
import { RetentionPaid } from "../events/retention-paid.event";
import { toPeruTaxDateKey } from "../tax-date";

/**
 * Lifecycle states for retention declarations.
 *
 * @example
 * ```ts
 * const status: RetentionStatus = 'PENDING';
 * ```
 */
export type RetentionStatus = "PENDING" | "DECLARED" | "PAID" | "CANCELLED";

/**
 * Reconstitution shape used by persistence adapters.
 *
 * @example
 * ```ts
 * const props: RetencionProps = { ...raw, status: 'PENDING' };
 * ```
 */
export interface RetencionProps {
	id: string;
	companyId: string;
	billId: string;
	supplierRuc: string;
	baseAmount: Money;
	retentionAmount: Money;
	status: RetentionStatus;
	declarationPeriod: string;
	sunatDueDate: Date;
	pdtReference?: string;
	createdAt: Date;
	declaredAt?: Date;
	paidAt?: Date;
	cancelledAt?: Date;
	cancellationReason?: string;
}

interface CreateRetencionParams {
	companyId: string;
	billId: string;
	supplierRuc: string;
	baseAmount: Money;
	appliedAt?: Date;
}

/**
 * Aggregate root for retention accounting lifecycle and invariants.
 *
 * @example
 * ```ts
 * const [retencion] = Retencion.createFromBill({ companyId, billId, supplierRuc, baseAmount });
 * ```
 */
export class Retencion {
	private static readonly RETENTION_THRESHOLD = Money.fromAmount(700, "PEN");

	private constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly billId: string,
		public readonly supplierRuc: string,
		public readonly baseAmount: Money,
		public readonly retentionAmount: Money,
		public readonly status: RetentionStatus,
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
		params: CreateRetencionParams,
	): [Retencion, RetentionApplied] {
		const appliedAt = params.appliedAt ?? new Date();
		Retencion.assertSupplierRuc(params.supplierRuc);
		Retencion.assertBaseAmount(params.baseAmount);

		const retentionAmount = TaxCalculator.calculateRetencion(
			params.baseAmount,
		).taxAmount;
		const declarationPeriod = toPeruTaxDateKey(appliedAt).slice(0, 7);
		const sunatDueDate = buildSunatDueDate(appliedAt);

		const retencion = new Retencion(
			crypto.randomUUID(),
			params.companyId,
			params.billId,
			params.supplierRuc,
			params.baseAmount,
			retentionAmount,
			"PENDING",
			declarationPeriod,
			sunatDueDate,
			appliedAt,
		);

		return [
			retencion,
			new RetentionApplied(
				retencion.companyId,
				retencion.id,
				retencion.billId,
				retencion.supplierRuc,
				retencion.baseAmount,
				retencion.retentionAmount,
				retencion.declarationPeriod,
				retencion.sunatDueDate,
			),
		];
	}

	static reconstitute(props: RetencionProps): Retencion {
		Retencion.assertSupplierRuc(props.supplierRuc);
		Retencion.assertBaseAmount(props.baseAmount);
		Retencion.assertMoneyShape(props.baseAmount, props.retentionAmount);
		Retencion.assertDeclarationPeriod(props.declarationPeriod);
		Retencion.assertStatusConsistency(props);

		return new Retencion(
			props.id,
			props.companyId,
			props.billId,
			props.supplierRuc,
			props.baseAmount,
			props.retentionAmount,
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

	get netToSupplier(): Money {
		return Money.fromCents(
			this.baseAmount.getCents() - this.retentionAmount.getCents(),
			this.baseAmount.getCurrency(),
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
	): [Retencion, RetentionDeclared] {
		if (this.status !== "PENDING") {
			throw new Error("Only pending retentions can be declared");
		}

		const reference = pdtReference.trim();
		if (!reference) {
			throw new Error("PDT reference is required");
		}

		const next = new Retencion(
			this.id,
			this.companyId,
			this.billId,
			this.supplierRuc,
			this.baseAmount,
			this.retentionAmount,
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
			new RetentionDeclared(
				next.companyId,
				next.id,
				next.declarationPeriod,
				reference,
				next.retentionAmount,
				declaredAt,
			),
		];
	}

	markPaid(
		bankTransactionId: string,
		paidAt = new Date(),
	): [Retencion, RetentionPaid] {
		if (this.status !== "DECLARED") {
			throw new Error("Only declared retentions can be marked as paid");
		}

		const transactionId = bankTransactionId.trim();
		if (!transactionId) {
			throw new Error("Bank transaction ID is required");
		}

		const next = new Retencion(
			this.id,
			this.companyId,
			this.billId,
			this.supplierRuc,
			this.baseAmount,
			this.retentionAmount,
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
			new RetentionPaid(
				next.companyId,
				next.id,
				transactionId,
				next.retentionAmount,
				paidAt,
			),
		];
	}

	cancel(
		reason: string,
		cancelledAt = new Date(),
	): [Retencion, RetentionCancelled] {
		if (this.status === "PAID") {
			throw new Error("Paid retentions cannot be cancelled");
		}
		if (this.status === "CANCELLED") {
			throw new Error("Retention is already cancelled");
		}

		const normalizedReason = reason.trim();
		if (!normalizedReason) {
			throw new Error("Cancellation reason is required");
		}

		const next = new Retencion(
			this.id,
			this.companyId,
			this.billId,
			this.supplierRuc,
			this.baseAmount,
			this.retentionAmount,
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
			new RetentionCancelled(
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
			supplierRuc: this.supplierRuc,
			baseAmount: this.baseAmount.toJSON(),
			retentionAmount: this.retentionAmount.toJSON(),
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

	private static assertBaseAmount(baseAmount: Money): void {
		if (baseAmount.getCurrency() !== "PEN") {
			throw new Error("Retention only applies to PEN amounts");
		}
		if (!baseAmount.isPositive()) {
			throw new Error("Base amount must be positive");
		}
		if (
			!TaxCalculator.shouldApplyRetencion(baseAmount) ||
			baseAmount.lessThanOrEqual(Retencion.RETENTION_THRESHOLD)
		) {
			throw new Error("Retention only applies to PEN amounts above S/ 700");
		}
	}

	private static assertMoneyShape(
		baseAmount: Money,
		retentionAmount: Money,
	): void {
		if (baseAmount.getCurrency() !== retentionAmount.getCurrency()) {
			throw new Error(
				"Retention amount currency must match base amount currency",
			);
		}

		const expected = TaxCalculator.calculateRetencion(baseAmount).taxAmount;
		if (!retentionAmount.equals(expected)) {
			throw new Error("Retention amount must equal 3% of the base amount");
		}
	}

	private static assertSupplierRuc(supplierRuc: string): void {
		if (!/^\d{11}$/.test(supplierRuc)) {
			throw new Error("Supplier RUC must contain 11 digits");
		}
	}

	private static assertDeclarationPeriod(period: string): void {
		if (!/^\d{4}-\d{2}$/.test(period)) {
			throw new Error("Declaration period must use YYYY-MM format");
		}
	}

	private static assertStatusConsistency(props: RetencionProps): void {
		if (
			props.status === "DECLARED" &&
			(!props.pdtReference || !props.declaredAt)
		) {
			throw new Error(
				"Declared retentions require PDT reference and declared date",
			);
		}

		if (
			props.status === "PAID" &&
			(!props.pdtReference || !props.declaredAt || !props.paidAt)
		) {
			throw new Error("Paid retentions require declared and paid timestamps");
		}

		if (
			props.status === "CANCELLED" &&
			(!props.cancelledAt || !props.cancellationReason)
		) {
			throw new Error("Cancelled retentions require cancellation metadata");
		}
	}
}

function buildSunatDueDate(appliedAt: Date): Date {
	const periodKey = toPeruTaxDateKey(appliedAt);
	const year = Number.parseInt(periodKey.slice(0, 4), 10);
	const month = Number.parseInt(periodKey.slice(5, 7), 10);

	if (!Number.isFinite(year) || !Number.isFinite(month)) {
		throw new Error("Unable to derive retention due date");
	}

	if (month === 12) {
		return new Date(Date.UTC(year + 1, 0, 15, 0, 0, 0, 0));
	}

	return new Date(Date.UTC(year, month, 15, 0, 0, 0, 0));
}
