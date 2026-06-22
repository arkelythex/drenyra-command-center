/**
 * Bill Mapper - Application Layer
 * Maps between domain entities and DTOs
 *
 * 2026 Best Practices:
 * - Separation of concerns: mapping logic isolated
 * - Consistent DTO structure across API
 * - Currency handling with Money type
 */

import type { Currency } from "@arkelythex/domain";
import type { Bill, BillItem } from "../domain/bill.entity";
import type { BillDTO, BillItemDTO } from "../domain/bill.types";

/**
 * BillMapper
 * Handles conversion between domain Bill and BillDTO
 *
 * @example
 * ```ts
 * const dto = BillMapper.toDTO({} as Bill);
 * ```
 */
export class BillMapper {
	/**
	 * Map domain entity to DTO
	 */
	static toDTO(bill: Bill): BillDTO {
		return {
			id: bill.id,
			companyId: bill.companyId,
			vendorId: bill.vendorId,
			billNumber: bill.billNumber,
			issueDate: bill.issueDate,
			dueDate: bill.dueDate,
			currency: bill.currency,
			exchangeRate: bill.exchangeRate,
			status: bill.status,
			subtotal: {
				amount: bill.subtotal.toString(),
				currency: bill.currency,
			},
			igvAmount: {
				amount: bill.igvAmount.toString(),
				currency: bill.currency,
			},
			totalAmount: {
				amount: bill.totalAmount.toString(),
				currency: bill.currency,
			},
			balanceDue: {
				amount: bill.balanceDue.toString(),
				currency: bill.currency,
			},
			items: bill.items.map((item) =>
				BillMapper.toItemDTO(item, bill.currency),
			),
			notes: bill.notes,
			tags: bill.tags,
			createdAt: bill.createdAt,
			updatedAt: bill.updatedAt,
		};
	}

	/**
	 * Map domain item to DTO
	 */
	private static toItemDTO(item: BillItem, currency: Currency): BillItemDTO {
		return {
			id: item.id,
			productId: item.productId,
			description: item.description,
			quantity: item.quantity,
			unitPrice: {
				amount: item.unitPrice.toString(),
				currency,
			},
			total: {
				amount: item.total.toString(),
				currency,
			},
		};
	}

	/**
	 * Map list of entities to DTOs
	 */
	static toDTOList(bills: Bill[]): BillDTO[] {
		return bills.map((bill) => BillMapper.toDTO(bill));
	}
}
