import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "../SegmentedControl";

const OPTIONS = [
	{ id: "board", label: "Tablero" },
	{ id: "aging", label: "Antigüedad" },
] as const;

describe("SegmentedControl", () => {
	it("exposes a named tablist with the selected tab and reports changes", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(
			<SegmentedControl
				label="Vistas"
				options={OPTIONS}
				value="board"
				onChange={onChange}
			/>,
		);

		expect(screen.getByRole("tablist", { name: "Vistas" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Tablero" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Antigüedad" })).toHaveAttribute(
			"aria-selected",
			"false",
		);

		await user.click(screen.getByRole("tab", { name: "Antigüedad" }));
		expect(onChange).toHaveBeenCalledWith("aging");
	});
});
