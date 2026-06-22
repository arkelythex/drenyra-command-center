import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	triggerMock,
	approvalMock,
	selectAccountMock,
	clearSelectedAccountMock,
	reconcileTransactionMock,
	toastSuccessMock,
	toastErrorMock,
} = vi.hoisted(() => ({
	triggerMock: vi.fn(),
	approvalMock: vi.fn(),
	selectAccountMock: vi.fn(),
	clearSelectedAccountMock: vi.fn(),
	reconcileTransactionMock: vi.fn(),
	toastSuccessMock: vi.fn(),
	toastErrorMock: vi.fn(),
}));

const accountA = {
	id: "acc-1",
	name: "Cuenta Principal",
	currentBalance: "1500.50",
	currency: "PEN",
} as const;

const accountB = {
	id: "acc-2",
	name: "Cuenta USD",
	currentBalance: "200",
	currency: "USD",
} as const;

vi.mock("sonner", () => ({
	toast: {
		success: toastSuccessMock,
		error: toastErrorMock,
	},
}));

vi.mock("@/hooks/useHaptics", () => ({
	useHaptics: () => ({
		trigger: triggerMock,
	}),
	useFinancialHaptics: () => ({
		approval: approvalMock,
	}),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: { companyId: "comp-1" },
	}),
}));

vi.mock("../useBankingQueries", () => ({
	useBankingAccountsQuery: vi.fn(),
	useBankingTransactionsQuery: vi.fn(),
}));

vi.mock("../../stores/banking.store", () => ({
	useBankingSelection: vi.fn(),
	useBankingReconciliation: vi.fn(),
}));

import {
	useBankingSelection,
	useBankingReconciliation,
} from "../../stores/banking.store";
import {
	useBankingAccountsQuery,
	useBankingTransactionsQuery,
} from "../useBankingQueries";
import { useBankingViewController } from "../useBankingViewController";

describe("useBankingViewController", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(useBankingAccountsQuery).mockReturnValue({
			data: [accountA, accountB] as unknown as never,
			isLoading: false,
		} as unknown as ReturnType<typeof useBankingAccountsQuery>);

		vi.mocked(useBankingSelection).mockReturnValue({
			selectedAccountId: null,
			selectAccount: selectAccountMock,
			clearSelectedAccount: clearSelectedAccountMock,
		});

		vi.mocked(useBankingTransactionsQuery).mockImplementation(
			(accountId) =>
				({
					data:
						accountId === "acc-1"
							? [{ id: "tx-3" }]
							: [{ id: "tx-1" }, { id: "tx-2" }],
					isLoading: false,
				}) as unknown as ReturnType<typeof useBankingTransactionsQuery>,
		);

		vi.mocked(useBankingReconciliation).mockReturnValue({
			reconcileTransaction: reconcileTransactionMock,
			isLoading: false,
		} as unknown as ReturnType<typeof useBankingReconciliation>);
	});

	it("derives selected account + balance formatter from query data", () => {
		const { result } = renderHook(() => useBankingViewController());

		expect(result.current.selectedAccountId).toBe("acc-1");
		expect(selectAccountMock).toHaveBeenCalledWith("acc-1");
		expect(result.current.balanceValue).toBe(1500.5);
		expect(result.current.balanceFormatter(150)).toMatch(/(S\/|PEN)/);
		expect(result.current.evidenceHash).toBe("BNK-acc-1-1-1");
		expect(result.current.manualReviewRequired).toBe(true);
	});

	it("replaces stale selected account ids that do not belong to the active company", () => {
		vi.mocked(useBankingSelection).mockReturnValue({
			selectedAccountId: "acc-other-company",
			selectAccount: selectAccountMock,
			clearSelectedAccount: clearSelectedAccountMock,
		} as unknown as ReturnType<typeof useBankingSelection>);

		const { result } = renderHook(() => useBankingViewController());

		expect(result.current.selectedAccountId).toBe("acc-1");
		expect(useBankingTransactionsQuery).toHaveBeenLastCalledWith("acc-1", {});
		expect(selectAccountMock).toHaveBeenCalledWith("acc-1");
		expect(clearSelectedAccountMock).not.toHaveBeenCalled();
	});

	it("changes tab only for valid values and triggers light haptic", () => {
		const { result } = renderHook(() => useBankingViewController());

		act(() => {
			result.current.handleTabChange("cuentas");
		});
		expect(result.current.activeTab).toBe("cuentas");
		expect(triggerMock).toHaveBeenCalledWith("light");

		act(() => {
			result.current.handleTabChange("tab-invalida");
		});
		expect(result.current.activeTab).toBe("cuentas");
	});

	it("selects account with medium haptic and applies transaction filters", () => {
		const { result } = renderHook(() => useBankingViewController());

		act(() => {
			result.current.handleAccountSelect("acc-2");
		});

		expect(triggerMock).toHaveBeenCalledWith("medium");
		expect(selectAccountMock).toHaveBeenCalledWith("acc-2");

		act(() => {
			result.current.setFilters({
				startDate: "2026-01-01",
				endDate: "2026-01-31",
			});
		});
		act(() => {
			result.current.handleApplyFilters();
		});

		expect(useBankingTransactionsQuery).toHaveBeenLastCalledWith("acc-1", {
			startDate: "2026-01-01",
			endDate: "2026-01-31",
		});
	});

	it("shows success toast when manual reconciliation succeeds", async () => {
		reconcileTransactionMock.mockResolvedValue(undefined);
		const { result } = renderHook(() => useBankingViewController());

		await act(async () => {
			await result.current.handleManualReconcile("tx-1");
		});

		expect(reconcileTransactionMock).toHaveBeenCalledWith("tx-1");
		expect(toastSuccessMock).toHaveBeenCalledWith("Transacción conciliada");
	});

	it("shows error toast when manual reconciliation fails", async () => {
		reconcileTransactionMock.mockRejectedValue(
			new Error("COMPANY_SCOPE_MISMATCH"),
		);
		const { result } = renderHook(() => useBankingViewController());

		await act(async () => {
			await result.current.handleManualReconcile("tx-2");
		});

		expect(toastErrorMock).toHaveBeenCalledWith(
			"La factura pertenece a otra empresa",
			{
				description: expect.stringContaining("empresa distinta"),
			},
		);
	});

	it("triggers financial approval haptic on register funds", () => {
		const { result } = renderHook(() => useBankingViewController());

		act(() => {
			result.current.handleRegisterFunds();
		});

		expect(approvalMock).toHaveBeenCalledTimes(1);
	});
});
