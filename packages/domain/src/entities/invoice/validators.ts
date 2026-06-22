import { Money } from "../../value-objects/Money";
import type { Currency, InvoiceItem, InvoiceProps } from "./types";

/**
 * Valida las reglas de negocio invariantes de la factura.
 * Lanza errores si alguna regla no se cumple.
 */
export function validateInvoiceBusinessRules(props: InvoiceProps): void {
	// Rule 1: Factura requires RUC
	if (props.series.isFactura() && !props.clientRUC) {
		throw new Error("Las facturas requieren RUC del cliente (regla SUNAT)");
	}

	// Rule 2: Total must equal base + IGV
	const expectedTotal = props.baseAmount.add(props.igvAmount);
	if (!props.totalAmount.equals(expectedTotal)) {
		throw new Error(
			`El total (${props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`,
		);
	}

	// Rule 7 (Moved up): Must have at least one item
	// Validamos esto antes de sumar los items para evitar errores confusos
	if (props.items.length === 0) {
		throw new Error("La factura debe tener al menos un item");
	}

	// Rule 3: Items total must match invoice total
	const itemsTotal = calculateItemsTotal(
		props.items,
		props.totalAmount.getCurrency(),
	);
	if (!itemsTotal.equals(props.totalAmount)) {
		throw new Error(
			`La suma de items (${itemsTotal.getAmount()}) no coincide con el total (${props.totalAmount.getAmount()})`,
		);
	}

	// Rule 4: Issue date cannot be in the future
	if (props.issueDate > new Date()) {
		throw new Error("La fecha de emisión no puede ser futura");
	}

	// Rule 5: Due date must be after issue date
	if (props.dueDate && props.dueDate < props.issueDate) {
		throw new Error(
			"La fecha de vencimiento debe ser posterior a la emisión",
		);
	}

	// Rule 6: Invoice number must be positive
	if (props.number <= 0) {
		throw new Error("El número de factura debe ser positivo");
	}
}

/**
 * Calcula el total sumando los totales de cada ítem.
 */
export function calculateItemsTotal(
	items: InvoiceItem[],
	currency: Currency,
): Money {
	return items.reduce(
		(acc, item) => acc.add(item.total),
		Money.zero(currency),
	);
}
