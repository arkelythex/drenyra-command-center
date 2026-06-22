import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompanyCard } from "./CompanyCard";

const company = {
	id: "company-1",
	ruc: "20608451231",
	businessName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
	tradeName: "Nebula",
	isPrimary: true,
	isActive: true,
};

describe("CompanyCard", () => {
	it("renders selectable cards as native buttons", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		render(<CompanyCard company={company} onClick={onClick} />);

		const button = screen.getByRole("button", {
			name: /seleccionar nebula operaciones logisticas s\.a\.c\. ruc 20608451231/i,
		});

		await user.click(button);
		button.focus();
		await user.keyboard("{Enter}");
		await user.keyboard(" ");

		expect(onClick).toHaveBeenCalledTimes(3);
	});

	it("keeps non-selectable cards non-interactive", () => {
		render(<CompanyCard company={company} />);

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(
			screen.getByText("NEBULA OPERACIONES LOGISTICAS S.A.C."),
		).toBeInTheDocument();
	});
});
