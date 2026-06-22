import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	dndContextProps,
	toastErrorMock,
	toastSuccessMock,
	updateInvoiceStatusMock,
} = vi.hoisted(() => ({
	dndContextProps: [] as Array<{
		onDragEnd?: (event: unknown) => void;
		onDragStart?: (event: unknown) => void;
	}>,
	toastErrorMock: vi.fn(),
	toastSuccessMock: vi.fn(),
	updateInvoiceStatusMock: vi.fn(),
}));

vi.mock("@dnd-kit/core", () => ({
	closestCenter: vi.fn(),
	DndContext: ({
		children,
		onDragEnd,
		onDragStart,
	}: {
		children: ReactNode;
		onDragEnd?: (event: unknown) => void;
		onDragStart?: (event: unknown) => void;
	}) => {
		dndContextProps.push({ onDragEnd, onDragStart });
		return <div data-testid="dnd-context-mock">{children}</div>;
	},
	DragOverlay: ({ children }: { children: ReactNode }) => (
		<div data-testid="drag-overlay-mock">{children}</div>
	),
	PointerSensor: vi.fn(),
	useSensor: vi.fn(() => "pointer-sensor"),
	useSensors: vi.fn((...sensors: unknown[]) => sensors),
}));

vi.mock("sonner", () => ({
	toast: {
		error: toastErrorMock,
		success: toastSuccessMock,
	},
}));

vi.mock("../KanbanColumn", () => ({
	KanbanColumn: ({
		children,
		id,
		title,
	}: {
		children: ReactNode;
		id: string;
		title: string;
	}) => (
		<section data-testid={`column-${id}`}>
			<h2>{title}</h2>
			{children}
		</section>
	),
}));

vi.mock("../widgets/InvoiceCard", () => ({
	InvoiceCard: ({
		invoice,
	}: {
		invoice: {
			invoiceNumber: string;
		};
	}) => <article>{invoice.invoiceNumber}</article>,
}));

import {
	InvoicesSummaryBoard,
	resolveInvoiceDragTransition,
} from "../InvoicesSummaryBoard";
import type { Invoice } from "../../hooks/useInvoices";

const invoices: Invoice[] = [
	{
		id: "inv-1",
		customer: { name: "Acme SAC", initials: "AS" },
		amount: 100,
		invoiceNumber: "F001-1",
		dueDate: "2026-03-01",
		status: "draft",
		currency: "PEN",
	},
	{
		id: "inv-2",
		customer: { name: "Beta SAC", initials: "BS" },
		amount: 300,
		invoiceNumber: "F001-2",
		dueDate: "2026-03-02",
		status: "sent",
		currency: "PEN",
	},
];

function renderSummaryBoard(
	options: {
		onCreateInvoice?: () => void;
		onCreateInvoiceIntent?: () => void;
	} = {},
) {
	render(
		<InvoicesSummaryBoard
			isLoading={false}
			error={null}
			normalizedQuery=""
			hasSearchResults
			searchQuery=""
			filteredInvoicesByStatus={{
				draft: [invoices[0]],
				sent: [invoices[1]],
				overdue: [],
				paid: [],
			}}
			filteredColumnTotals={{ sent: 300, overdue: 0 }}
			allInvoices={invoices}
			onUpdateInvoiceStatus={updateInvoiceStatusMock}
			onCreateInvoice={options.onCreateInvoice ?? vi.fn()}
			onCreateInvoiceIntent={options.onCreateInvoiceIntent}
			formatMoney={(amount) => `S/ ${amount.toFixed(2)}`}
		/>,
	);
}

describe("resolveInvoiceDragTransition", () => {
	it("allows configured invoice status transitions", () => {
		expect(resolveInvoiceDragTransition(invoices, "inv-1", "sent")).toEqual({
			kind: "move",
			invoiceId: "inv-1",
			nextStatus: "sent",
		});
	});

	it("blocks invalid fiscal workflow transitions", () => {
		expect(resolveInvoiceDragTransition(invoices, "inv-1", "paid")).toEqual({
			kind: "blocked",
			currentStatus: "draft",
			nextStatus: "paid",
		});
	});

	it("ignores missing or non-status drop targets", () => {
		expect(resolveInvoiceDragTransition(invoices, "inv-1", null)).toEqual({
			kind: "no-target",
		});
		expect(resolveInvoiceDragTransition(invoices, "inv-1", "unknown")).toEqual({
			kind: "invalid-target",
			target: "unknown",
		});
	});
});

describe("InvoicesSummaryBoard DnD wiring", () => {
	beforeEach(() => {
		dndContextProps.length = 0;
		vi.clearAllMocks();
	});

	it("preloads create dialog on create-card intent and supports keyboard open", async () => {
		const user = userEvent.setup();
		const onCreateInvoice = vi.fn();
		const onCreateInvoiceIntent = vi.fn();

		renderSummaryBoard({ onCreateInvoice, onCreateInvoiceIntent });

		const createCard = screen.getByRole("button", { name: /Nueva factura/i });

		fireEvent.pointerEnter(createCard);
		createCard.focus();
		expect(onCreateInvoiceIntent).toHaveBeenCalledTimes(2);
		expect(onCreateInvoice).not.toHaveBeenCalled();

		await user.keyboard("{Enter}");
		await user.keyboard(" ");
		expect(onCreateInvoice).toHaveBeenCalledTimes(2);
	});

	it("wires DndContext and updates invoice status for allowed drops", () => {
		renderSummaryBoard();

		expect(screen.getByTestId("dnd-context-mock")).toBeInTheDocument();
		act(() => {
			dndContextProps[0]?.onDragStart?.({ active: { id: "inv-1" } });
			dndContextProps[0]?.onDragEnd?.({
				active: { id: "inv-1" },
				over: { id: "sent" },
			});
		});

		expect(updateInvoiceStatusMock).toHaveBeenCalledWith("inv-1", "sent");
		expect(toastSuccessMock).toHaveBeenCalledWith("Factura movida a SENT");
	});

	it("blocks disallowed fiscal workflow drops", () => {
		renderSummaryBoard();

		act(() => {
			dndContextProps[0]?.onDragEnd?.({
				active: { id: "inv-1" },
				over: { id: "paid" },
			});
		});

		expect(updateInvoiceStatusMock).not.toHaveBeenCalled();
		expect(toastErrorMock).toHaveBeenCalledWith(
			"No se puede mover de DRAFT a PAID",
		);
	});

	it("does not update invoices when dropped outside a column", () => {
		renderSummaryBoard();

		act(() => {
			dndContextProps[0]?.onDragEnd?.({
				active: { id: "inv-1" },
				over: null,
			});
		});

		expect(updateInvoiceStatusMock).not.toHaveBeenCalled();
		expect(toastErrorMock).not.toHaveBeenCalled();
		expect(toastSuccessMock).not.toHaveBeenCalled();
	});
});
