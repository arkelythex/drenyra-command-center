/** Virtual id: show movements for every category in the period. */
export const LEDGER_ALL_ACCOUNTS_ID = "__ledger_all__" as const;

export type LedgerAllAccountsId = typeof LEDGER_ALL_ACCOUNTS_ID;

export function isLedgerAllAccountsId(id: string): id is LedgerAllAccountsId {
	return id === LEDGER_ALL_ACCOUNTS_ID;
}
