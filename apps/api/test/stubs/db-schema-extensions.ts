const tableProxy = new Proxy({}, {
	get: (_target, prop) => prop,
});

export const accountBalances = tableProxy;
