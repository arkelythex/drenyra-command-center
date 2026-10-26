import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type CompanyOption, CompanySwitcher } from "../CompanySwitcher";

const companies: CompanyOption[] = [
	{ id: "c1", name: "Andina S.A.C.", ruc: "20123456789" },
	{ id: "c2", name: "Pacífico E.I.R.L.", ruc: "20987654321" },
];

function openMenu() {
	fireEvent.keyDown(screen.getByRole("button", { name: /andina/i }), {
		key: "ArrowDown",
	});
}

describe("CompanySwitcher", () => {
	it("shows the active company and its RUC on the trigger", () => {
		render(
			<CompanySwitcher
				companies={companies}
				activeCompany={companies[0] ?? null}
				onSelect={vi.fn()}
			/>,
		);
		const trigger = screen.getByRole("button", { name: /andina/i });
		expect(trigger).toHaveTextContent("RUC 20123456789");
		expect(trigger).toHaveAttribute("aria-haspopup", "menu");
	});

	it("lists every company with its RUC and marks the active one", async () => {
		render(
			<CompanySwitcher
				companies={companies}
				activeCompany={companies[0] ?? null}
				onSelect={vi.fn()}
			/>,
		);
		openMenu();

		const active = await screen.findByRole("menuitemradio", {
			name: /andina/i,
		});
		expect(active).toHaveAttribute("aria-checked", "true");
		expect(
			screen.getByRole("menuitemradio", { name: /pacífico/i }),
		).toHaveTextContent("RUC 20987654321");
	});

	it("selects another company", async () => {
		const onSelect = vi.fn();
		render(
			<CompanySwitcher
				companies={companies}
				activeCompany={companies[0] ?? null}
				onSelect={onSelect}
			/>,
		);
		openMenu();
		fireEvent.click(
			await screen.findByRole("menuitemradio", { name: /pacífico/i }),
		);
		expect(onSelect).toHaveBeenCalledWith(companies[1]);
	});

	it("asks to pick a company when none is active", () => {
		render(
			<CompanySwitcher
				companies={companies}
				activeCompany={null}
				onSelect={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /seleccionar empresa/i }),
		).toBeInTheDocument();
	});
});
