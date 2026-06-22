/**
 * OSE Provider Interface
 * Re-exports from types.ts for backward compatibility with existing consumers
 *
 * @principle Dependency Inversion - Depend on abstraction
 * @principle Open/Closed - New providers extend interface
 */

export type {
	IOSEProvider,
	SendInvoiceData,
	OSEResponse,
	AttemptTrace,
} from "./types";
