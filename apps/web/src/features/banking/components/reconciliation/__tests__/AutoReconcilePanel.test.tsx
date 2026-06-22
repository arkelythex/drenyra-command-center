import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	autoReconcileMock,
	clearLastReconciliationResultMock,
	triggerMock,
	onSaveMock,
} = vi.hoisted(() => ({
	autoReconcileMock: vi.fn(),
	clearLastReconciliationResultMock: vi.fn(),
	triggerMock: vi.fn(),
	onSaveMock: vi.fn(),
}));

let currentCompanyId = "comp-1";

vi.mock("@/hooks/useHaptics", () => ({
	useHaptics: () => ({ trigger: triggerMock }),
	useFinancialHaptics: () => ({ onSave: onSaveMock }),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: { companyId: currentCompanyId },
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
	},
}));

vi.mock("../../../stores/banking.store", () => ({
	useBankingReconciliation: () => ({
		autoReconcile: autoReconcileMock,
		lastReconciliationResult: {
			reconciledCount: 2,
			matches: [],
		},
		clearLastReconciliationResult: clearLastReconciliationResultMock,
		isLoading: false,
	}),
}));

import { AutoReconcilePanel } from "../AutoReconcilePanel";

describe("AutoReconcilePanel", () => {
	beforeEach(() => {
		currentCompanyId = "comp-1";
		vi.clearAllMocks();
		autoReconcileMock.mockResolvedValue(2);
	});

	it("clears visible reconciliation results when the account context changes", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<AutoReconcilePanel accountId="acc-1" unreconciledCount={3} />,
		);

		expect(clearLastReconciliationResultMock).toHaveBeenCalledTimes(1);

		await user.click(screen.getByRole("button", { name: /ejecutar/i }));

		expect(await screen.findByText(/2 conciliadas/i)).toBeInTheDocument();

		rerender(<AutoReconcilePanel accountId="acc-2" unreconciledCount={3} />);

		expect(screen.queryByText(/2 conciliadas/i)).not.toBeInTheDocument();
		expect(clearLastReconciliationResultMock).toHaveBeenCalledTimes(2);
	});

	it("clears visible reconciliation results when the company context changes", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<AutoReconcilePanel accountId="acc-1" unreconciledCount={3} />,
		);

		await user.click(screen.getByRole("button", { name: /ejecutar/i }));
		expect(await screen.findByText(/2 conciliadas/i)).toBeInTheDocument();

		currentCompanyId = "comp-2";
		rerender(<AutoReconcilePanel accountId="acc-1" unreconciledCount={3} />);

		expect(screen.queryByText(/2 conciliadas/i)).not.toBeInTheDocument();
		expect(clearLastReconciliationResultMock).toHaveBeenCalledTimes(2);
	});
});
