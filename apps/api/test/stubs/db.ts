/**
 * Lightweight Drizzle-ORM stub for unit tests.
 *
 * Returns itself from every method so deeply chained queries
 * (select → from → innerJoin → where → limit) resolve to an async
 * function that returns empty arrays.
 *
 * Override `_results` in a test to control return values.
 */

export const db = new Proxy(
	{
		_results: [] as unknown[],
		query: {},
	},
	{
		get(target, prop) {
			if (prop === "_results") return target._results;
			if (prop === "query") return target.query;

			// Return a function that either:
			// a) returns a Proxy that continues the chain, or
			// b) returns an async function that resolves to _results when awaited
			return (() => {
				const chain = new Proxy(
					{},
					{
						get(_chainTarget, _chainProp) {
							if (_chainProp === "then" || _chainProp === "catch") {
								return undefined; // not a real promise
							}
							// Return self for further method chaining
							return new Proxy(() => Promise.resolve(target._results), {
								get(__chainTarget, __chainProp) {
									if (__chainProp === "then") {
										return (resolve: (v: unknown[]) => void) =>
											resolve(target._results);
									}
									// Return self for infinite chaining
									return chain;
								},
							});
						},
					},
				);
				return chain;
			}) as unknown;
		},
	},
);

/**
 * Helper: create a new db proxy with controlled results.
 */
export function stubDbWith(results: unknown[]) {
	const stub = { ...db, _results: results };
	return stub as typeof db;
}
