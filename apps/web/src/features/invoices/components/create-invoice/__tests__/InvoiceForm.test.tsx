import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	setSelectedCustomerMock,
	setSeriesMock,
	setIssueDateMock,
	setDueDateMock,
	setCurrencyMock,
	setNotesMock,
	addItemMock,
	removeItemMock,
	updateItemMock,
	handleSubmitMock,
	onCancelMock,
	useInvoiceFormMock,
	useInvoiceCalculationsMock,
	customerSelectorPropsMock,
	invoiceDateFieldsPropsMock,
	invoiceLineItemsPropsMock,
	invoiceTotalsPropsMock,
} = vi.hoisted(() => ({
	setSelectedCustomerMock: vi.fn(),
	setSeriesMock: vi.fn(),
	setIssueDateMock: vi.fn(),
	setDueDateMock: vi.fn(),
	setCurrencyMock: vi.fn(),
	setNotesMock: vi.fn(),
	addItemMock: vi.fn(),
	removeItemMock: vi.fn(),
	updateItemMock: vi.fn(),
	handleSubmitMock: vi.fn(),
	onCancelMock: vi.fn(),
	useInvoiceFormMock: vi.fn(),
	useInvoiceCalculationsMock: vi.fn(),
	customerSelectorPropsMock: vi.fn(),
	invoiceDateFieldsPropsMock: vi.fn(),
	invoiceLineItemsPropsMock: vi.fn(),
	invoiceTotalsPropsMock: vi.fn(),
}));

vi.mock("../hooks/useInvoiceForm", () => ({
	useInvoiceForm: useInvoiceFormMock,
}));

vi.mock("../hooks/useInvoiceCalculations", () => ({
	useInvoiceCalculations: useInvoiceCalculationsMock,
}));

vi.mock("../CustomerSelector", () => ({
	CustomerSelector: (props: unknown) => {
		customerSelectorPropsMock(props);
		return <div data-testid="customer-selector-mock" />;
	},
}));

vi.mock("../InvoiceDateFields", () => ({
	InvoiceDateFields: (props: unknown) => {
		invoiceDateFieldsPropsMock(props);
		return <div data-testid="invoice-date-fields-mock" />;
	},
}));

vi.mock("../InvoiceLineItems", () => ({
	InvoiceLineItems: (props: unknown) => {
		invoiceLineItemsPropsMock(props);
		return <div data-testid="line-items-mock" />;
	},
}));

vi.mock("../InvoiceTotals", () => ({
	InvoiceTotals: (props: unknown) => {
		invoiceTotalsPropsMock(props);
		return <div data-testid="invoice-totals-mock" />;
	},
}));

import { InvoiceForm } from "../InvoiceForm";

describe("InvoiceForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		useInvoiceFormMock.mockReturnValue({
			formState: {
				selectedCustomer: null,
				series: "F001",
				issueDate: "2026-02-01",
				dueDate: "2026-03-02",
				currency: "PEN",
				notes: "nota inicial",
				items: [
					{
						id: "item-1",
						description: "Servicio",
						quantity: 1,
						unitPrice: 100,
						taxType: "GRAVADO",
					},
				],
				isPending: false,
			},
			actions: {
				setSelectedCustomer: setSelectedCustomerMock,
				setSeries: setSeriesMock,
				setIssueDate: setIssueDateMock,
				setDueDate: setDueDateMock,
				setCurrency: setCurrencyMock,
				setNotes: setNotesMock,
				addItem: addItemMock,
				removeItem: removeItemMock,
				updateItem: updateItemMock,
				handleSubmit: handleSubmitMock,
			},
		});

		useInvoiceCalculationsMock.mockReturnValue({
			subtotal: 100,
			igvAmount: 18,
			totalAmount: 118,
		});
	});

	it("renders form sections and delegates to child components", async () => {
		render(
			<InvoiceForm
				onSubmit={vi.fn().mockResolvedValue(undefined)}
				onCancel={onCancelMock}
				companyId="company-abc"
			/>,
		);

		expect(
			await screen.findByTestId("customer-selector-mock"),
		).toBeInTheDocument();
		expect(
			await screen.findByTestId("invoice-date-fields-mock"),
		).toBeInTheDocument();
		expect(await screen.findByTestId("line-items-mock")).toBeInTheDocument();
		expect(
			await screen.findByTestId("invoice-totals-mock"),
		).toBeInTheDocument();

		expect(customerSelectorPropsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "company-abc",
			}),
		);
		expect(invoiceDateFieldsPropsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				dueDate: "2026-03-02",
				issueDate: "2026-02-01",
				onDueDateChange: setDueDateMock,
				onIssueDateChange: setIssueDateMock,
			}),
		);
		expect(invoiceLineItemsPropsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				currency: "PEN",
			}),
		);
		expect(invoiceTotalsPropsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				currency: "PEN",
				totals: {
					subtotal: 100,
					igvAmount: 18,
					totalAmount: 118,
				},
			}),
		);
	});

	it("updates series and currency through comboboxes", () => {
		render(
			<InvoiceForm
				onSubmit={vi.fn().mockResolvedValue(undefined)}
				onCancel={onCancelMock}
				companyId="company-abc"
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		fireEvent.change(selects[0], { target: { value: "B001" } });
		fireEvent.change(selects[1], { target: { value: "USD" } });

		expect(setSeriesMock).toHaveBeenCalledWith("B001");
		expect(setCurrencyMock).toHaveBeenCalledWith("USD");
	});

	it("updates notes, supports cancel and triggers submit action", () => {
		render(
			<InvoiceForm
				onSubmit={vi.fn().mockResolvedValue(undefined)}
				onCancel={onCancelMock}
				companyId="company-abc"
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText(/auditoría cognitiva/i), {
			target: { value: "nota editada" },
		});
		expect(setNotesMock).toHaveBeenCalledWith("nota editada");

		fireEvent.click(screen.getByRole("button", { name: /abortar operación/i }));
		expect(onCancelMock).toHaveBeenCalledTimes(1);

		fireEvent.click(
			screen.getByRole("button", { name: /confirmar y emitir/i }),
		);
		expect(handleSubmitMock).toHaveBeenCalledTimes(1);
	});
});
