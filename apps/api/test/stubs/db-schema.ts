const tableProxy = new Proxy(
	{},
	{
		get: (_target, prop) => prop,
	},
);

export const users = tableProxy;
export const organizations = tableProxy;
export const accounts = tableProxy;
export const journalEntries = tableProxy;
export const journalEntryLines = tableProxy;
export const bankAccounts = tableProxy;
export const bankTransactions = tableProxy;
export const invoices = tableProxy;
export const bills = tableProxy;
export const businessPartners = tableProxy;
export const customers = tableProxy;
export const payments = tableProxy;
export const vendors = tableProxy;
export const products = tableProxy;
export const inventory = tableProxy;
export const inventoryMovements = tableProxy;
export const warehouses = tableProxy;
export const companies = tableProxy;
export const economicGroups = tableProxy;
export const firmModels = tableProxy;
export const transactions = tableProxy;
export const documents = tableProxy;
export const authUsers = tableProxy;
export const authSessions = tableProxy;
export const authAccounts = tableProxy;
export const authVerifications = tableProxy;
export const pcgeAccounts = tableProxy;
