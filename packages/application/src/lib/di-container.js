const registry = new Map();
export const SERVICE_TOKENS = {
	BALANCE_REPORT_DATA_SOURCE: "BALANCE_REPORT_DATA_SOURCE",
	ORGANIZATION_REPORT_DATA_SOURCE: "ORGANIZATION_REPORT_DATA_SOURCE",
	LEDGER_REPORT_DATA_SOURCE: "LEDGER_REPORT_DATA_SOURCE",
	OPENING_BALANCE_DATA_SOURCE: "OPENING_BALANCE_DATA_SOURCE",
};
export function register(token, value) {
	registry.set(token, value);
}
export function inject(token) {
	return registry.get(token);
}
//# sourceMappingURL=di-container.js.map
