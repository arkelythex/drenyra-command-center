import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileFinancialSummary } from "../MobileFinancialSummary";

describe("MobileFinancialSummary", () => {
	it("notifies tab changes and keeps the mobile action available", () => {
		const onTabChange = vi.fn();
		const onViewDetails = vi.fn();

		render(
			<MobileFinancialSummary
				onTabChange={onTabChange}
				onViewDetails={onViewDetails}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /gastos/i }));
		fireEvent.click(screen.getByRole("button", { name: /nuevo movimiento/i }));

		expect(onTabChange).toHaveBeenCalledWith("gastos");
		expect(onViewDetails).toHaveBeenCalledWith("new-transaction");
	});
});
