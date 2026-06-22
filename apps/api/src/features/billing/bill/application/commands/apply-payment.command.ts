/**
 * Apply Payment Command
 * Applies a payment against a bill (buy invoice).
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import type { Currency } from "@arkelythex/domain";
import { Money } from "@arkelythex/domain";
import type { Bill } from "../../domain/bill.entity";
import type { IBillRepository } from "../../domain/bill.repository.interface";
import { BillRepository } from "../../infrastructure/bill.repository";
import {
	appendWorkflowEventToNotes,
	deriveApprovalState,
} from "../services/workflow-trace";

export interface ApplyBillPaymentInput {
	billId: string;
	amount: string;
	currency: Currency;
	legacyUserId?: string;
	actorName?: string;
	reason?: string;
}

/**
 * @deprecated Use applyPayment() function instead.
 */
export class ApplyPaymentCommand {
	constructor(
		private readonly repository: IBillRepository = new BillRepository(),
	) {}

	async execute(input: ApplyBillPaymentInput): Promise<Bill> {
		const bill = await this.repository.findById(input.billId);
		if (!bill) throw new Error("Bill not found");

		if (bill.status === "CANCELLED") {
			throw new Error("Cannot apply payment to CANCELLED bill");
		}

		if (bill.currency !== input.currency) {
			throw new Error(
				`Currency mismatch: bill is in ${bill.currency}, payment is in ${input.currency}`,
			);
		}

		const parsedAmount = parseFloat(input.amount);
		if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
			throw new Error("Payment amount must be a non-negative number");
		}

		const payment = Money.fromAmount(parsedAmount, input.currency);
		const updated = bill.applyPayment(payment);

		if (updated.status !== bill.status) {
			const nextNotes = appendWorkflowEventToNotes(bill.notes, {
				at: new Date().toISOString(),
				from: bill.status,
				to: updated.status,
				actorId: input.legacyUserId,
				actorName: input.actorName,
				reason: input.reason ?? "Pago registrado",
				approvalState: deriveApprovalState(updated.status),
			});

			await this.repository.updateStatus(
				updated.id,
				updated.status,
				nextNotes,
				input.legacyUserId,
			);
		}

		return updated;
	}
}

export async function applyPayment(
	input: ApplyBillPaymentInput,
): Promise<Bill> {
	const repository = new BillRepository();

	const bill = await repository.findById(input.billId);
	if (!bill) throw new Error("Bill not found");

	if (bill.status === "CANCELLED") {
		throw new Error("Cannot apply payment to CANCELLED bill");
	}

	if (bill.currency !== input.currency) {
		throw new Error(
			`Currency mismatch: bill is in ${bill.currency}, payment is in ${input.currency}`,
		);
	}

	const parsedAmount = parseFloat(input.amount);
	if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
		throw new Error("Payment amount must be a non-negative number");
	}

	const payment = Money.fromAmount(parsedAmount, input.currency);
	const updated = bill.applyPayment(payment);

	if (updated.status !== bill.status) {
		const nextNotes = appendWorkflowEventToNotes(bill.notes, {
			at: new Date().toISOString(),
			from: bill.status,
			to: updated.status,
			actorId: input.legacyUserId,
			actorName: input.actorName,
			reason: input.reason ?? "Pago registrado",
			approvalState: deriveApprovalState(updated.status),
		});

		await repository.updateStatus(
			updated.id,
			updated.status,
			nextNotes,
			input.legacyUserId,
		);
	}

	return updated;
}
