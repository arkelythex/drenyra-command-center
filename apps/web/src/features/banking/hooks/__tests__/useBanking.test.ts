import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the banking API module directly
import { MOCK_ACCOUNTS } from "../../__fixtures__/accounts";

vi.mock("../../api/banking.api", () => {
	const mockAccounts = [
		{
			id: "acc1",
			accountName: "BCP Cta. Corriente Soles",
			accountType: "BANK",
			currency: "PEN",
			bankName: "BCP",
			accountNumber: "191-2233445-0-01",
			currentBalance: 145820.5,
		},
		{
			id: "acc2",
			accountName: "BBVA Continental ME",
			accountType: "BANK",
			currency: "USD",
			bankName: "BBVA",
			accountNumber: "0011-0123-0100045678",
			currentBalance: 45000.0,
		},
		{
			id: "acc3",
			accountName: "Detracciones - BN",
			accountType: "DETRACTION",
			currency: "PEN",
			bankName: "Banco de la Nación",
			accountNumber: "00-068-123456",
			currentBalance: 12500.0,
		},
		{
			id: "card1",
			accountName: "Interbank Business",
			accountType: "CREDIT",
			currency: "PEN",
			bankName: "Interbank",
			accountNumber: "****-9988",
			currentBalance: -5200.0,
		},
	];
	return {
		bankingApi: {
			getAccounts: vi.fn().mockResolvedValue(mockAccounts),
			getTransactions: vi.fn().mockResolvedValue([] as any),
		},
	};
});

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: vi.fn(() => ({
		companyContext: {
			companyId: "00000000-0000-0000-0000-000000000001",
			companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
			ruc: "20608451231",
			isDemoFallback: true,
		},
		availableCompanies: [],
		setActiveCompanyById: vi.fn(),
	})),
}));

import { useBanking } from "../useBanking";

/**
 * useBanking uses useSuspenseQuery, so we need:
 * 1. QueryClientProvider for TanStack Query context
 * 2. React.Suspense to catch the suspension thrown by useSuspenseQuery
 * 3. waitFor() to wait until the query resolves and result.current is available
 */
function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(
			QueryClientProvider,
			{ client: queryClient },
			React.createElement(React.Suspense, { fallback: null }, children),
		);
	};
}

describe("useBanking", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("initialization", () => {
		it("should start with empty selectedAccountId (no longer defaults to mock)", async () => {
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});
			expect(result.current.selectedAccountId).toBe("");
		});

		it("should have empty search query initially", async () => {
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});
			expect(result.current.searchQuery).toBe("");
		});

		it("should return first account as selectedAccount when selectedAccountId is empty", async () => {
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});
			expect(result.current.selectedAccount).toBeDefined();
			expect(result.current.selectedAccount.id).toBe("acc1");
		});
	});

	describe("account grouping", () => {
		it("should group accounts by type: bank, detraction, credit", async () => {
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});
			expect(result.current.accountsByType.bank).toHaveLength(2);
			expect(result.current.accountsByType.detraction).toHaveLength(1);
			expect(result.current.accountsByType.credit).toHaveLength(1);
		});

		it("should include correct accounts in each group", async () => {
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});

			const bankIds = result.current.accountsByType.bank.map((a) => a.id);
			expect(bankIds).toContain("acc1");
			expect(bankIds).toContain("acc2");

			const detractionIds = result.current.accountsByType.detraction.map(
				(a) => a.id,
			);
			expect(detractionIds).toContain("acc3");

			const creditIds = result.current.accountsByType.credit.map((a) => a.id);
			expect(creditIds).toContain("card1");
		});
	});

	describe("account selection", () => {
		it("should allow selecting an account by id", async () => {
			// Arrange
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});

			// Act
			act(() => {
				result.current.setSelectedAccountId("acc3");
			});

			// Assert
			expect(result.current.selectedAccountId).toBe("acc3");
			expect(result.current.selectedAccount.id).toBe("acc3");
			expect(result.current.selectedAccount.type).toBe("DETRACTION");
		});

		it("should fall back to first account when selecting invalid id", async () => {
			// Arrange
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});

			// Act
			act(() => {
				result.current.setSelectedAccountId("nonexistent-id");
			});

			// Assert -- selectedAccount falls back to accounts[0]
			expect(result.current.selectedAccount.id).toBe(MOCK_ACCOUNTS[0].id);
		});
	});

	describe("search query", () => {
		it("should allow setting search query", async () => {
			// Arrange
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});

			// Act
			act(() => {
				result.current.setSearchQuery("BCP");
			});

			// Assert
			expect(result.current.searchQuery).toBe("BCP");
		});

		it("should allow clearing search query", async () => {
			// Arrange
			const { result } = renderHook(() => useBanking(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current).not.toBeNull();
			});

			// Act
			act(() => {
				result.current.setSearchQuery("BCP");
			});
			act(() => {
				result.current.setSearchQuery("");
			});

			// Assert
			expect(result.current.searchQuery).toBe("");
		});
	});

	describe("MOCK_ACCOUNTS data integrity", () => {
		it("should have 4 mock accounts", () => {
			expect(MOCK_ACCOUNTS).toHaveLength(4);
		});

		it("should have valid currency for all accounts (PEN or USD)", () => {
			for (const account of MOCK_ACCOUNTS) {
				expect(["PEN", "USD"]).toContain(account.currency);
			}
		});

		it("should have the detraction account linked to Banco de la Nacion", () => {
			const detraction = MOCK_ACCOUNTS.find((a) => a.type === "DETRACTION");
			expect(detraction).toBeDefined();
			expect(detraction?.bankName).toBe("Banco de la Naci\u00f3n");
		});
	});
});
