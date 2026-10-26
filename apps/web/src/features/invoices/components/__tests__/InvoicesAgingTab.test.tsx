import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvoicesAgingTab } from "../tabs/InvoicesAgingTab";

const inv = (
	id: string,
	name: string,
	dueDate: string,
	amount: number,
	status: "draft" | "sent" | "overdue" | "paid" = "overdue",
) => ({
	id,
	customer: { name, initials: "X" },
	dueDate,
	amount,
	status,
	currency: "PEN" as const,
	invoiceNumber: id,
});

const money = (value: number) => `S/ ${value}`;
const TODAY = new Date("2026-10-26T12:00:00.000Z");

describe("InvoicesAgingTab", () => {
	it("explains an empty receivable book instead of inventing numbers", () => {
		render(
			<InvoicesAgingTab invoices={[]} formatMoney={money} today={TODAY} />,
		);

		expect(
			screen.getByText(/no tienes saldos por cobrar/i),
		).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		expect(screen.queryByText(/acme|digits|tech solutions/i)).toBeNull();
	});

	it("shows real balances per customer and bucket, with a total row", () => {
		render(
			<InvoicesAgingTab
				invoices={[
					inv("a", "Andina S.A.C.", "2026-08-01T00:00:00.000Z", 500),
					inv("b", "Andina S.A.C.", "2026-10-20T00:00:00.000Z", 100),
				]}
				formatMoney={money}
				today={TODAY}
			/>,
		);

		const table = screen.getByRole("table", { name: /antigüedad de saldos/i });
		const row = within(table).getByRole("row", { name: /andina s\.a\.c\./i });
		expect(row).toHaveTextContent("S/ 500");
		expect(row).toHaveTextContent("S/ 100");
		expect(row).toHaveTextContent("S/ 600");
		expect(
			within(table).getByRole("row", { name: /total/i }),
		).toHaveTextContent("S/ 600");
	});

	it("flags debt older than 60 days in words, not by color alone", () => {
		render(
			<InvoicesAgingTab
				invoices={[inv("a", "Andina", "2026-06-01T00:00:00.000Z", 500)]}
				formatMoney={money}
				today={TODAY}
			/>,
		);
		expect(screen.getByText(/más de 60 días vencido/i)).toBeInTheDocument();
	});

	it("says when foreign-currency invoices were left out", () => {
		render(
			<InvoicesAgingTab
				invoices={[
					inv("a", "Andina", "2026-10-01T00:00:00.000Z", 100),
					{
						...inv("b", "Andina", "2026-10-01T00:00:00.000Z", 50),
						currency: "USD" as const,
					},
				]}
				formatMoney={money}
				today={TODAY}
			/>,
		);
		expect(screen.getByText(/1 factura en otra moneda/i)).toBeInTheDocument();
	});
});
