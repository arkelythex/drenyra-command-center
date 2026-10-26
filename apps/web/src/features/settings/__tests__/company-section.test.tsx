import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompanySettingsSection } from "../components/settings-view/company-section";

function setup(initial = { name: "", ruc: "" }) {
	const onCompanyNameChange = vi.fn();
	const onCompanyRucChange = vi.fn();
	render(
		<CompanySettingsSection
			companyName={initial.name}
			companyRuc={initial.ruc}
			onCompanyNameChange={onCompanyNameChange}
			onCompanyRucChange={onCompanyRucChange}
		/>,
	);
	return { onCompanyNameChange, onCompanyRucChange, user: userEvent.setup() };
}

describe("CompanySettingsSection", () => {
	it("saves the legal name once, when the field loses focus", async () => {
		const { onCompanyNameChange, user } = setup();

		await user.type(screen.getByLabelText("Razón social"), "Andina S.A.C.");
		expect(onCompanyNameChange).not.toHaveBeenCalled();

		await user.tab();
		expect(onCompanyNameChange).toHaveBeenCalledOnce();
		expect(onCompanyNameChange).toHaveBeenCalledWith("Andina S.A.C.");
	});

	it("only saves a RUC with 11 digits and explains why otherwise", async () => {
		const { onCompanyRucChange, user } = setup();
		const ruc = screen.getByLabelText("RUC");

		await user.type(ruc, "2012");
		await user.tab();
		expect(onCompanyRucChange).not.toHaveBeenCalled();
		expect(ruc).toHaveAttribute("aria-invalid", "true");
		expect(screen.getByText(/debe tener 11 dígitos/i)).toBeInTheDocument();

		await user.clear(ruc);
		await user.type(ruc, "20123456789");
		await user.tab();
		expect(onCompanyRucChange).toHaveBeenCalledWith("20123456789");
		expect(ruc).not.toHaveAttribute("aria-invalid");
	});

	it("does not save when the value did not change", async () => {
		const { onCompanyNameChange, user } = setup({
			name: "Andina S.A.C.",
			ruc: "",
		});

		await user.click(screen.getByLabelText("Razón social"));
		await user.tab();
		expect(onCompanyNameChange).not.toHaveBeenCalled();
	});
});
