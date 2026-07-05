export function buildSireCsvFixture(): FormData {
	const csvLine =
		"20260100|1|15/01/2026|01|F001|00000001|20123456789|100.00|18.00|118.00";
	const formData = new FormData();
	formData.append(
		"file",
		new Blob([csvLine], { type: "text/csv" }),
		"test.csv",
	);
	return formData;
}

export function buildCashflowAnalyzeFixture(): Record<string, unknown> {
	return {
		transactions: [
			{
				date: "2026-01-01",
				type: "INCOME",
				amount: 1000,
				category: "sales",
			},
			{
				date: "2026-01-02",
				type: "EXPENSE",
				amount: 300,
				category: "supplies",
			},
		],
	};
}

export function buildReconcileFixture(): Record<string, unknown> {
	return {
		bank_transactions: [
			{
				date: "2026-01-01",
				description: "Payment from client",
				net_amount: 500,
				balance: 500,
			},
		],
		system_transactions: [
			{
				date: "2026-01-01",
				type: "INCOME",
				amount: 500,
				category: "sales",
			},
		],
		tolerance_days: 3,
		tolerance_amount: 0.01,
	};
}
