import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { editInvoice } = vi.hoisted(() => ({ editInvoice: vi.fn() }));
vi.mock("../../hooks/useEditInvoice", () => ({
	useEditInvoice: () => ({ editInvoice, isEditing: false }),
}));

import type { Invoice } from "../../hooks/useInvoices";
import { EditInvoiceModal } from "../EditInvoiceModal";

const invoice: Invoice = {
	id: "inv-1",
	invoiceNumber: "F001-000123",
	customer: { id: "c1", name: "Andina S.A.C." },
	amount: 118,
	series: "F001",
	issueDate: "2026-09-01T12:00:00.000Z",
	dueDate: "2026-09-30T12:00:00.000Z",
	status: "draft",
	currency: "PEN",
	items: [
		{
			description: "Servicio de contabilidad",
			quantity: "1",
			unitPrice: "118",
			taxType: "GRAVADO",
		},
	],
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("EditInvoiceModal", () => {
	it("names the invoice in sentence case and binds every field to a label", () => {
		render(<EditInvoiceModal open onOpenChange={vi.fn()} invoice={invoice} />);

		expect(
			screen.getByRole("dialog", { name: "Editar factura F001-000123" }),
		).toBeInTheDocument();
		for (const label of [
			"Serie",
			"Fecha de emisión",
			"Fecha de vencimiento",
			"Moneda",
			"Notas",
		]) {
			expect(screen.getByLabelText(label)).toBeInTheDocument();
		}
		expect(screen.getByLabelText("Descripción del concepto 1")).toHaveValue(
			"Servicio de contabilidad",
		);
		expect(screen.getByText("IGV (18%)")).toBeInTheDocument();
	});

	it("reports a missing description inline instead of a browser alert", () => {
		const alertSpy = vi.fn();
		vi.stubGlobal("alert", alertSpy);
		render(<EditInvoiceModal open onOpenChange={vi.fn()} invoice={invoice} />);

		fireEvent.change(screen.getByLabelText("Descripción del concepto 1"), {
			target: { value: "" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Completa la descripción de todos los conceptos",
		);
		expect(alertSpy).not.toHaveBeenCalled();
		expect(editInvoice).not.toHaveBeenCalled();
	});

	it("saves the edited invoice", () => {
		render(<EditInvoiceModal open onOpenChange={vi.fn()} invoice={invoice} />);
		fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
		expect(editInvoice).toHaveBeenCalledWith(
			expect.objectContaining({ id: "inv-1" }),
			expect.any(Object),
		);
	});
});
