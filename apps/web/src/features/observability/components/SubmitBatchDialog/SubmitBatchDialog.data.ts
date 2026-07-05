/**
 * Helpers for SubmitBatchDialog.
 */

/** Generate a short random ID for draft invoices. */
export function generateId(): string {
	return Math.random().toString(36).slice(2, 10);
}
