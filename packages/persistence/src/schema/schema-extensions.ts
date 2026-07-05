/**
 * Schema extensions — tables that may not yet be defined in core schema.
 * TODO: Migrate accountBalances to a real Drizzle table definition.
 */

const tableProxy = new Proxy({} as Record<string, unknown>, {
	get: (_target, prop) => prop,
});

export const accountBalances = tableProxy;
