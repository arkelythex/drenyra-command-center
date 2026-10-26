import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvoiceCardStatusBadge } from "../InvoiceCardStatusBadge";

afterEach(() => vi.unstubAllEnvs());

describe("InvoiceCardStatusBadge", () => {
	it("names a draft in plain words", () => {
		render(<InvoiceCardStatusBadge dueDate="2026-10-15" />);
		expect(screen.getByText("Borrador")).toBeInTheDocument();
	});

	it("shows when an issued invoice falls due, the date a collector acts on", () => {
		render(<InvoiceCardStatusBadge isSent dueDate="2026-10-15" />);
		expect(screen.getByText(/Emitida · vence 15 oct/)).toBeInTheDocument();
	});

	it("shows since when an invoice is overdue", () => {
		render(<InvoiceCardStatusBadge isOverdue dueDate="2026-10-15" />);
		expect(screen.getByText(/Vencida el 15 oct/)).toBeInTheDocument();
	});

	it("shows a paid invoice without a due date", () => {
		render(<InvoiceCardStatusBadge isPaid dueDate="2026-10-15" />);
		expect(screen.getByText("Cobrada")).toBeInTheDocument();
		expect(screen.queryByText(/15 oct/)).not.toBeInTheDocument();
	});

	it("does not shift the date by a day in Peru's timezone", () => {
		// A date-only string must be read as that calendar day, not as UTC midnight.
		vi.stubEnv("TZ", "America/Lima");
		render(<InvoiceCardStatusBadge isSent dueDate="2026-03-01" />);
		expect(screen.getByText(/vence 1 mar/)).toBeInTheDocument();
	});

	it("does not crash when the API delivers the due date as a Date", () => {
		vi.stubEnv("TZ", "America/Lima");
		const dueDate = new Date("2026-10-15T00:00:00Z") as unknown as string;
		render(<InvoiceCardStatusBadge isOverdue dueDate={dueDate} />);
		expect(screen.getByText(/Vencida el 15 oct/)).toBeInTheDocument();
	});

	it("shows a placeholder instead of 'Invalid Date' when the due date is missing", () => {
		render(
			<InvoiceCardStatusBadge
				isSent
				dueDate={undefined as unknown as string}
			/>,
		);
		expect(screen.getByText(/Emitida · sin vencimiento/)).toBeInTheDocument();
		expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
	});
});
