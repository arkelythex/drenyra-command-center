import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreditNoteRow } from "../components/CreditNoteRow";

const creditNote = {
	id: "cn-1",
	fullNumber: "FC01-0001",
	creditNoteType: "DESCUENTO",
	reason: "Descuento comercial",
	status: "DRAFT",
	totalAmount: "120.50",
	issueDate: "2026-03-01",
} as never;

const renderRow = (props = {}) => render(<table><tbody><CreditNoteRow creditNote={creditNote} n={(value) => `S/ ${value}`} {...props} /></tbody></table>);

describe("CreditNoteRow", () => {
	it("renders credit note details and draft status", () => {
		renderRow();
		expect(screen.getByText("FC01-0001")).toBeInTheDocument();
		expect(screen.getByText("Descuento comercial")).toBeInTheDocument();
		expect(screen.getByText("Borrador")).toBeInTheDocument();
	});

	it("shows draft workflow actions", async () => {
		const user = userEvent.setup();
		renderRow();
		await user.click(screen.getByRole("button", { name: "Más opciones" }));
		expect(screen.getByText("Enviar a SUNAT")).toBeInTheDocument();
		expect(screen.getByText("Eliminar")).toBeInTheDocument();
	});

	it("sends the selected note id to the view callback", async () => {
		const user = userEvent.setup();
		const onView = vi.fn();
		renderRow({ onView });
		await user.click(screen.getByRole("button", { name: "Más opciones" }));
		await user.click(screen.getByText("Ver Detalle"));
		expect(onView).toHaveBeenCalledWith("cn-1");
	});
});
