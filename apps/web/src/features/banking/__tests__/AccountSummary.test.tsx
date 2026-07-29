import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountSummary } from "../components/accounts/AccountSummary";

describe("AccountSummary", () => {
	it("renders account totals and singular account count", () => {
		render(<AccountSummary totalBalancePEN="1250" totalBalanceUSD="50" unreconciledCount={0} totalAccounts={1} />);
		expect(screen.getByText("Resumen de Cuentas")).toBeInTheDocument();
		expect(screen.getByText("1 cuenta")).toBeInTheDocument();
		expect(screen.getByText("Soles (PEN)")).toBeInTheDocument();
	});

	it("uses plural account copy for multiple accounts", () => {
		render(<AccountSummary totalBalancePEN="0" totalBalanceUSD="0" unreconciledCount={0} totalAccounts={2} />);
		expect(screen.getByText("2 cuentas")).toBeInTheDocument();
	});

	it("shows unreconciled transaction count when work is pending", () => {
		render(<AccountSummary totalBalancePEN="0" totalBalanceUSD="0" unreconciledCount={4} totalAccounts={1} />);
		expect(screen.getByText("Transacciones pendientes")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
	});
});
