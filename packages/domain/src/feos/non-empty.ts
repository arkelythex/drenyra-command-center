/**
 * Element access that states its precondition. With `noUncheckedIndexedAccess`
 * `items[0]` is `T | undefined`; where an earlier check already guarantees a
 * non-empty list, these helpers return `T` and fail loudly if that ever stops
 * being true. Falsy elements (0, "", false) are valid values.
 */

/** First element of a list that must not be empty. */
export function firstOf<T>(items: readonly T[], what: string): T {
	if (items.length === 0) throw new Error(`${what} must not be empty`);
	return items[0] as T;
}

/** Last element of a list that must not be empty. */
export function lastOf<T>(items: readonly T[], what: string): T {
	if (items.length === 0) throw new Error(`${what} must not be empty`);
	return items[items.length - 1] as T;
}
