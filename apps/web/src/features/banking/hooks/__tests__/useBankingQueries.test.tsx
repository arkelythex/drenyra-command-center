import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { importTransactionsMock } = vi.hoisted(() => ({
	importTransactionsMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
	getTenantContext: () => ({
		companyId: "comp-1",
		organizationId: "comp-1",
		isAuthenticated: true,
		authUserId: "auth-user-1",
		legacyUserId: "legacy-user-1",
		userRole: "ADMIN",
	}),
}));

vi.mock("../../api/banking.api", () => ({
	bankingApi: {
		importTransactions: importTransactionsMock,
		createAccount: vi.fn(),
		deleteAccount: vi.fn(),
		reconcileTransaction: vi.fn(),
		autoReconcile: vi.fn(),
	},
}));

import { bankingKeys } from "../../api/query-keys";
import { useImportTransactionsMutation } from "../useBankingQueries";

function createWrapper(queryClient: QueryClient) {
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useImportTransactionsMutation", () => {
	it("invalidates transactions and company summary after a successful import", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		importTransactionsMock.mockResolvedValue({
			data: { imported: 4, duplicates: 0, warnings: [], errors: [] },
		});

		const { result } = renderHook(
			() => useImportTransactionsMutation("acc-1"),
			{ wrapper: createWrapper(queryClient) },
		);

		await result.current.mutateAsync({
			file: new File(["id,amount\n1,10"], "movimientos.csv", {
				type: "text/csv",
			}),
			format: "GENERIC",
		});

		await waitFor(() => {
			expect(invalidateQueriesSpy).toHaveBeenCalledWith({
				queryKey: bankingKeys.transactionsRoot("acc-1"),
			});
			expect(invalidateQueriesSpy).toHaveBeenCalledWith({
				queryKey: bankingKeys.summary("comp-1"),
			});
		});
	});
});
