import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useBillsMock, setIsMobileOpenMock } = vi.hoisted(() => ({
	useBillsMock: vi.fn(),
	setIsMobileOpenMock: vi.fn(),
}));

vi.mock("../../hooks/useBills", () => ({
	useBills: useBillsMock,
}));

vi.mock("@/components/layout/MobileTabNavigation", () => ({
	MobileTabNavigation: ({
		onTabChange,
	}: {
		onTabChange: (value: string) => void;
	}) => (
		<button type="button" onClick={() => onTabChange("aging")}>
			Mobile Aging
		</button>
	),
}));

vi.mock("@/stores/sidebar-layout.store", () => ({
	useSidebarLayout: () => ({
		setIsMobileOpen: setIsMobileOpenMock,
	}),
}));

vi.mock("../sections/BillsKanbanView", () => ({
	BillsKanbanView: () => (
		<div data-testid="bills-kanban-view">Kanban Bills</div>
	),
}));

vi.mock("../tabs/BillsAgingTab", () => ({
	BillsAgingTab: () => <div data-testid="bills-aging-view">Aging Bills</div>,
}));

import { BillsBoard } from "../BillsBoard";

const createBillsState = (
	overrides?: Partial<ReturnType<typeof useBillsMock>>,
) => ({
	billsByStatus: {
		review: [
			{
				id: "bill-1",
				vendor: { name: "Proveedor Uno", initials: "PU" },
				amount: 2500,
				invoiceNumber: "F001-001",
				dueDate: "2026-03-12",
				status: "review",
				currency: "PEN",
			},
		],
		approval: [],
		payment: [
			{
				id: "bill-2",
				vendor: { name: "Proveedor Dos", initials: "PD" },
				amount: 700,
				invoiceNumber: "F001-002",
				dueDate: "2026-02-20",
				status: "payment",
				currency: "PEN",
			},
		],
		paid: [],
	},
	activeView: "summary",
	setActiveView: vi.fn(),
	updateBillStatus: vi.fn(),
	pendingBillId: null,
	isLoading: false,
	error: null,
	...overrides,
});

describe("BillsBoard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useBillsMock.mockReturnValue(createBillsState());
	});

	it("renders summary metrics and summary board by default", () => {
		render(<BillsBoard />);

		expect(screen.getAllByText("Facturas de compra")).toHaveLength(2);
		expect(screen.getByText("Por revisar")).toBeInTheDocument();
		expect(screen.getByText("Por aprobar")).toBeInTheDocument();
		expect(screen.getByText("Vencidas")).toBeInTheDocument();
		expect(screen.getByText("Saldo abierto")).toBeInTheDocument();
		expect(screen.getByTestId("bills-kanban-view")).toBeInTheDocument();
	});

	it("loads aging view when the active tab changes", async () => {
		useBillsMock.mockReturnValue(
			createBillsState({
				activeView: "aging",
			}),
		);

		render(<BillsBoard />);

		fireEvent.click(screen.getByRole("button", { name: "Mobile Aging" }));

		expect(await screen.findByTestId("bills-aging-view")).toBeInTheDocument();
	});
});
