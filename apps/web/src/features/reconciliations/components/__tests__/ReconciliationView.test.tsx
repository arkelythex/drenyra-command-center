import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
	fetchBankTransactions: vi.fn(),
	fetchMatches: vi.fn(),
	confirmMatch: vi.fn(),
}));

vi.mock("../../services/bank-reconciliation", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...api,
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({ companyContext: { companyId: "cmp-1" } }),
}));

import { ReconciliationView } from "../ReconciliationView";

function renderView() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<ReconciliationView />
		</QueryClientProvider>,
	);
}

describe("ReconciliationView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		api.fetchBankTransactions.mockResolvedValue([
			{
				id: "tx-1",
				transactionDate: "2025-01-14",
				description: "TRANSFERENCIA RECIBIDA - ENTERPRISE",
				reference: "F001-1234",
				type: "CREDIT",
				amount: "15000.0000",
				isReconciled: false,
			},
		]);
		api.fetchMatches.mockResolvedValue({
			transactionId: "tx-1",
			amountCents: 1500000,
			confidence: 100,
			matches: [
				{
					documentId: "inv-1",
					kind: "INVOICE",
					number: "F001-1234",
					partnerName: "ENTERPRISE CORP",
					amountCents: 1500000,
					score: 100,
					reasons: ["Monto exacto: S/ 15000.00"],
					dayDistance: 0,
				},
			],
		});
		api.confirmMatch.mockResolvedValue(undefined);
	});

	it("guides an empty account to import its bank statement, without a fake summary", async () => {
		api.fetchBankTransactions.mockResolvedValue([]);
		renderView();

		expect(
			await screen.findByRole("heading", {
				name: /aún no hay movimientos bancarios/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("button", { name: /importar extracto/i }).length,
		).toBeGreaterThanOrEqual(2);
		expect(screen.queryByText(/100%/)).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText(/resumen de conciliación/i),
		).not.toBeInTheDocument();
	});

	it("shows the company's movement with its proposal and confirms it", async () => {
		renderView();

		expect(
			await screen.findAllByText("TRANSFERENCIA RECIBIDA - ENTERPRISE"),
		).not.toHaveLength(0);
		expect(await screen.findAllByText("ENTERPRISE CORP")).not.toHaveLength(0);

		fireEvent.click(screen.getByRole("button", { name: /approve match/i }));
		await waitFor(() => {
			expect(api.confirmMatch).toHaveBeenCalledWith(
				"cmp-1",
				"tx-1",
				expect.objectContaining({ id: "inv-1" }),
			);
		});
	});
});
