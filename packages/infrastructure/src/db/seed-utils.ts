/**
 * Returns `value` or throws when a seed lookup that must exist is missing.
 * @param value Looked-up element (may be undefined under noUncheckedIndexedAccess).
 * @param what Human-readable description used in the error message.
 * @returns The defined value.
 */
export function required<T>(value: T | undefined, what: string): T {
	if (value === undefined) {
		throw new Error(`Seed invariant violated: missing ${what}`);
	}
	return value;
}
