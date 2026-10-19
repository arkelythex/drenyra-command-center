import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileTabNavigation } from "../MobileTabNavigation";

const TABS = [
	{ id: "summary", label: "Tablero" },
	{ id: "aging", label: "Antigüedad" },
] as const;

describe("MobileTabNavigation", () => {
	it("marks only the active tab as selected", () => {
		render(
			<MobileTabNavigation
				tabs={TABS}
				activeTab="aging"
				onTabChange={vi.fn()}
			/>,
		);
		expect(screen.getByRole("tab", { name: "Antigüedad" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Tablero" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	it("reports the id of the clicked tab", () => {
		const onTabChange = vi.fn();
		render(
			<MobileTabNavigation
				tabs={TABS}
				activeTab="summary"
				onTabChange={onTabChange}
			/>,
		);
		fireEvent.click(screen.getByRole("tab", { name: "Antigüedad" }));
		expect(onTabChange).toHaveBeenCalledWith("aging");
	});
});
