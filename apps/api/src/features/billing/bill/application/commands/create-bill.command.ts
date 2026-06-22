/**
 * Create Bill Command - Application Layer
 * CQRS Command for creating new bills
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import { randomUUID } from "node:crypto";
import { Money } from "@arkelythex/domain";
import { Bill, type BillItem, type Currency } from "../../domain/bill.entity";
import { BillRepository } from "../../infrastructure/bill.repository";

/**
 * Input DTO for creating a bill item.
 *
 * @example
 * ```ts
 * const item: CreateBillItemInput = { description: 'Servicio', quantity: '1', unitPrice: '10.00' };
 * ```
 */
export interface CreateBillItemInput {
	productId?: string;
	description: string;
	quantity: string;
	unitPrice: string;
}

/**
 * Command payload for creating a bill.
 * @example
 * ```ts
 * const value = new CreateBillCommand();
 * console.log(value);
 * ```
 */
export class CreateBillCommand {
	constructor(
		public readonly companyId: string,
		public readonly vendorId: string,
		public readonly billNumber: string,
		public readonly issueDate: Date,
		public readonly dueDate: Date,
		public readonly currency: Currency,
		public readonly items: CreateBillItemInput[],
		public readonly notes?: string,
		public readonly tags?: string[],
		public readonly exchangeRate: number = 1.0,
	) {}

	static create(props: {
		companyId: string;
		vendorId: string;
		billNumber: string;
		issueDate: string | Date;
		dueDate: string | Date;
		currency?: string;
		items: CreateBillItemInput[];
		notes?: string;
		tags?: string[];
		exchangeRate?: string | number;
	}): CreateBillCommand {
		return new CreateBillCommand(
			props.companyId,
			props.vendorId,
			props.billNumber,
			props.issueDate instanceof Date
				? props.issueDate
				: new Date(props.issueDate),
			props.dueDate instanceof Date ? props.dueDate : new Date(props.dueDate),
			(props.currency as Currency) || "PEN",
			props.items,
			props.notes,
			props.tags,
			props.exchangeRate
				? typeof props.exchangeRate === "string"
					? parseFloat(props.exchangeRate)
					: props.exchangeRate
				: 1.0,
		);
	}
}

/**
 * Result DTO for CreateBill operation.
 */
export interface CreateBillResult {
	billId: string;
	billNumber: string;
	status: string;
	totalAmount: { amount: string; currency: string };
	createdAt: Date;
}

function validateCreateBillCommand(input: {
	companyId: string;
	vendorId: string;
	billNumber: string;
	issueDate: Date;
	dueDate: Date;
	items: CreateBillItemInput[];
}): void {
	if (!input.companyId) throw new Error("Company ID is required");
	if (!input.vendorId) throw new Error("Vendor ID is required");
	if (!input.billNumber || input.billNumber.length < 3) {
		throw new Error(
			"Bill number is required and must be at least 3 characters",
		);
	}
	if (input.items.length === 0)
		throw new Error("At least one item is required");
	if (input.dueDate < input.issueDate)
		throw new Error("Due date must be after issue date");

	for (const item of input.items) {
		if (!item.description || item.description.length < 3) {
			throw new Error("Item description must be at least 3 characters");
		}
		const quantity = parseFloat(item.quantity);
		if (!Number.isFinite(quantity) || quantity <= 0) {
			throw new Error("Item quantity must be a positive number");
		}
		const unitPrice = parseFloat(item.unitPrice);
		if (!Number.isFinite(unitPrice) || unitPrice < 0) {
			throw new Error("Item unit price must be a non-negative number");
		}
	}
}

function calculateBillItems(
	inputItems: CreateBillItemInput[],
	currency: Currency,
): BillItem[] {
	return inputItems.map((input) => {
		const quantity = parseFloat(input.quantity);
		const unitPrice = Money.fromAmount(parseFloat(input.unitPrice), currency);
		const total = unitPrice.multiply(quantity);

		return {
			id: randomUUID(),
			productId: input.productId,
			description: input.description,
			quantity,
			unitPrice,
			total,
		};
	});
}

function mapBillToResult(bill: Bill): CreateBillResult {
	return {
		billId: bill.id,
		billNumber: bill.billNumber,
		status: bill.status,
		totalAmount: {
			amount: bill.totalAmount.toString(),
			currency: bill.currency,
		},
		createdAt: bill.createdAt,
	};
}

export async function createBill(input: {
	companyId: string;
	vendorId: string;
	billNumber: string;
	issueDate: Date;
	dueDate: Date;
	currency: Currency;
	items: CreateBillItemInput[];
	notes?: string;
	tags?: string[];
	exchangeRate?: number;
}): Promise<CreateBillResult> {
	const billRepository = new BillRepository();

	validateCreateBillCommand(input);

	const exists = await billRepository.exists(input.billNumber, input.companyId);
	if (exists) {
		throw new Error(
			`Bill number ${input.billNumber} already exists for this company`,
		);
	}

	const items = calculateBillItems(input.items, input.currency);

	const bill = Bill.create({
		id: randomUUID(),
		companyId: input.companyId,
		vendorId: input.vendorId,
		billNumber: input.billNumber,
		issueDate: input.issueDate,
		dueDate: input.dueDate,
		currency: input.currency,
		exchangeRate: input.exchangeRate ?? 1.0,
		items,
		notes: input.notes,
		tags: input.tags,
	});

	const savedBill = await billRepository.create(bill);
	return mapBillToResult(savedBill);
}
