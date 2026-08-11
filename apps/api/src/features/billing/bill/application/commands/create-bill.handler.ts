/**
 * Create Bill Handler - Application Layer
 * Handles the CreateBillCommand execution
 *
 * @layer Application (Command Handler)
 * @pattern CQRS Write Model
 */

import { randomUUID } from "node:crypto";
import { Money } from "@drenyra/domain";
import { Bill, type BillItem, type Currency } from "../../domain/bill.entity";
import type { IBillRepository } from "../../domain/bill.repository.interface";
import type {
	CreateBillCommand,
	CreateBillItemInput,
} from "./create-bill.command";

/**
 * Result DTO for CreateBill operation.
 * @example
 * ```ts
 * const value: CreateBillResult = {} as CreateBillResult;
 * console.log(value);
 * ```
 */

export interface CreateBillResult {
	billId: string;
	billNumber: string;
	status: string;
	totalAmount: { amount: string; currency: string };
	createdAt: Date;
}

/**
 * Command handler to create a bill.
 * @example
 * ```ts
 * const value = new CreateBillHandler();
 * console.log(value);
 * ```
 */

export class CreateBillHandler {
	constructor(private readonly billRepository: IBillRepository) {}

	async execute(command: CreateBillCommand): Promise<CreateBillResult> {
		this.validateCommand(command);

		const exists = await this.billRepository.exists(
			command.billNumber,
			command.companyId,
		);
		if (exists) {
			throw new Error(
				`Bill number ${command.billNumber} already exists for this company`,
			);
		}

		const items = this.calculateItems(command.items, command.currency);

		const bill = Bill.create({
			id: randomUUID(),
			companyId: command.companyId,
			vendorId: command.vendorId,
			billNumber: command.billNumber,
			issueDate: command.issueDate,
			dueDate: command.dueDate,
			currency: command.currency,
			exchangeRate: command.exchangeRate,
			items,
			...(command.notes !== undefined ? { notes: command.notes } : {}),
			...(command.tags !== undefined ? { tags: command.tags } : {}),
		});

		const savedBill = await this.billRepository.create(bill);
		return this.mapToResult(savedBill);
	}

	private validateCommand(command: CreateBillCommand): void {
		if (!command.companyId) throw new Error("Company ID is required");
		if (!command.vendorId) throw new Error("Vendor ID is required");
		if (!command.billNumber || command.billNumber.length < 3) {
			throw new Error(
				"Bill number is required and must be at least 3 characters",
			);
		}
		if (command.items.length === 0)
			throw new Error("At least one item is required");
		if (command.dueDate < command.issueDate)
			throw new Error("Due date must be after issue date");

		for (const item of command.items) {
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

	private calculateItems(
		inputItems: CreateBillItemInput[],
		currency: Currency,
	): BillItem[] {
		return inputItems.map((input) => {
			const quantity = parseFloat(input.quantity);
			const unitPrice = Money.fromAmount(parseFloat(input.unitPrice), currency);
			const total = unitPrice.multiply(quantity);

			return {
				id: randomUUID(),
				...(input.productId !== undefined ? { productId: input.productId } : {}),
				description: input.description,
				quantity,
				unitPrice,
				total,
			};
		});
	}

	private mapToResult(bill: Bill): CreateBillResult {
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
}
