import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
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

import { useReconciliationWorkspace } from "../use-reconciliation-workspace";

function wrapper({ children }: { children: ReactNode }) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const pending = {
	id: "tx-1",
	transactionDate: "2025-01-14",
	description: "TRANSFERENCIA RECIBIDA",
	reference: "F001-1234",
	type: "CREDIT",
	amount: "15000.0000",
	isReconciled: false,
};

describe("useReconciliationWorkspace", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		api.fetchBankTransactions.mockResolvedValue([
			pending,
			{ ...pending, id: "tx-0", isReconciled: true },
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

	it("loads the company's movements and the proposals for the first pending one", async () => {
		const { result } = renderHook(() => useReconciliationWorkspace(), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.activeCandidate?.id).toBe("inv-1");
		});
		expect(api.fetchBankTransactions).toHaveBeenCalledWith("cmp-1");
		expect(api.fetchMatches).toHaveBeenCalledWith("cmp-1", "tx-1");
		expect(result.current.activeTransaction?.status).toBe("suggested");
		expect(result.current.summary).toMatchObject({
			unresolvedCount: 1,
			unresolvedExposureCents: 1500000,
			reconciledRate: 50,
		});
	});

	it("confirms the selected proposal and reloads the list", async () => {
		const { result } = renderHook(() => useReconciliationWorkspace(), {
			wrapper,
		});
		await waitFor(() => {
			expect(result.current.activeCandidate).toBeDefined();
		});

		await act(async () => {
			const candidate = result.current.activeCandidate;
			if (candidate) await result.current.confirmCandidate(candidate);
		});

		expect(api.confirmMatch).toHaveBeenCalledWith(
			"cmp-1",
			"tx-1",
			expect.objectContaining({ id: "inv-1", documentKind: "INVOICE" }),
		);
		await waitFor(() => {
			expect(api.fetchBankTransactions).toHaveBeenCalledTimes(2);
		});
	});
});
