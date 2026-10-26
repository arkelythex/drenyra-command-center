import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteInvoice, sendMutate } = vi.hoisted(() => ({
	deleteInvoice: vi.fn(),
	sendMutate: vi.fn(),
}));

vi.mock("../../hooks/useDeleteInvoice", () => ({
	useDeleteInvoice: () => ({ deleteInvoice, isDeleting: false }),
}));
vi.mock("../../hooks/useEmailActions", () => ({
	useSendInvoiceEmail: () => ({ mutate: sendMutate, isPending: false }),
}));

import { DeleteInvoiceDialog } from "../DeleteInvoiceDialog";
import { SendEmailModal } from "../SendEmailModal";

const invoice = (status: "draft" | "sent") => ({
	id: "inv-1",
	invoiceNumber: "F001-000123",
	status,
	customer: { name: "Andina S.A.C." },
});

beforeEach(() => vi.clearAllMocks());

describe("DeleteInvoiceDialog", () => {
	it("confirms deleting a draft and says it cannot be undone", () => {
		render(
			<DeleteInvoiceDialog
				open
				onOpenChange={vi.fn()}
				invoice={invoice("draft")}
			/>,
		);

		expect(
			screen.getByRole("alertdialog", { name: "¿Eliminar factura?" }),
		).toBeInTheDocument();
		expect(screen.getByText(/no se puede deshacer/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
		expect(deleteInvoice).toHaveBeenCalledWith("inv-1", expect.any(Object));
	});

	it("refuses to delete an issued invoice and names its state in Spanish", () => {
		render(
			<DeleteInvoiceDialog
				open
				onOpenChange={vi.fn()}
				invoice={invoice("sent")}
			/>,
		);

		expect(
			screen.getByRole("alertdialog", { name: "No se puede eliminar" }),
		).toBeInTheDocument();
		expect(screen.getByText(/estado enviada/i)).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Eliminar" }),
		).not.toBeInTheDocument();
		expect(screen.getByText(/nota de crédito/i)).toBeInTheDocument();
	});

	it("uses no emoji as UI", () => {
		const { baseElement } = render(
			<DeleteInvoiceDialog
				open
				onOpenChange={vi.fn()}
				invoice={invoice("draft")}
			/>,
		);
		expect(baseElement.textContent).not.toMatch(/[🗑⚠⏳]/u);
	});
});

describe("SendEmailModal", () => {
	it("is a real dialog with the recipient and sends with the optional message", () => {
		const onClose = vi.fn();
		render(
			<SendEmailModal
				invoiceId="inv-1"
				invoiceNumber="F001-000123"
				customerEmail="ventas@andina.pe"
				onClose={onClose}
			/>,
		);

		expect(
			screen.getByRole("dialog", { name: "Enviar factura" }),
		).toBeInTheDocument();
		expect(screen.getByText("ventas@andina.pe")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText(/mensaje personalizado/i), {
			target: { value: "Gracias por su compra" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Enviar correo" }));
		expect(sendMutate).toHaveBeenCalledWith(
			{ invoiceId: "inv-1", customMessage: "Gracias por su compra" },
			expect.any(Object),
		);
	});

	it("closes with Cancelar", () => {
		const onClose = vi.fn();
		render(
			<SendEmailModal
				invoiceId="inv-1"
				invoiceNumber="F001-000123"
				customerEmail="ventas@andina.pe"
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
		expect(onClose).toHaveBeenCalled();
	});
});
