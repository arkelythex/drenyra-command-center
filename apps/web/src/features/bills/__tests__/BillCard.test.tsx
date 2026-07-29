import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BillCard } from "../components/widgets/BillCard";

const bill = {
	id: "bill-1",
	vendor: { name: "Proveedor Uno", initials: "PU" },
	amount: 1200,
	invoiceNumber: "F001-101",
	dueDate: "2026-03-15",
	status: "review" as const,
	currency: "PEN" as const,
};

describe("BillCard", () => {
	it("renders vendor and invoice details", () => {
		render(<BillCard bill={bill} />);
		expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
		expect(screen.getByText("F001-101")).toBeInTheDocument();
		expect(screen.getByText("Vencimiento")).toBeInTheDocument();
	});

	it("shows the paid status", () => {
		render(<BillCard bill={bill} isPaid />);
		expect(screen.getByText("Pagada")).toBeInTheDocument();
	});

	it("invokes the approval action from the options menu", async () => {
		const user = userEvent.setup();
		const onSendToApproval = vi.fn();
		render(<BillCard bill={bill} onSendToApproval={onSendToApproval} />);
		await user.click(screen.getByRole("button", { name: "Más opciones" }));
		await user.click(screen.getByText("Enviar a aprobación"));
		expect(onSendToApproval).toHaveBeenCalledOnce();
	});
});
