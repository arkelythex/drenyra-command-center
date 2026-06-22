import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Input } from "../input";
import { Label } from "../label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipRoot,
	TooltipTrigger,
} from "../tooltip";

const triggerHaptics = vi.fn();

vi.mock("@/hooks/useHaptics", () => ({
	useHaptics: () => ({
		trigger: triggerHaptics,
	}),
}));

describe("design system adapters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("keeps input focus haptics while delegating to the shared input", async () => {
		const user = userEvent.setup();
		const onFocus = vi.fn();

		render(<Input aria-label="Empresa" onFocus={onFocus} />);

		await user.click(screen.getByRole("textbox", { name: "Empresa" }));

		expect(triggerHaptics).toHaveBeenCalledWith("light");
		expect(onFocus).toHaveBeenCalledTimes(1);
	});

	it("keeps label accessible through the local façade", () => {
		render(
			<>
				<Label htmlFor="ruc">RUC</Label>
				<Input id="ruc" />
			</>,
		);

		expect(screen.getByLabelText("RUC")).toBeInTheDocument();
	});

	it("renders accessible tooltip content through the local façade", async () => {
		const user = userEvent.setup();

		render(
			<TooltipProvider delayDuration={0}>
				<TooltipRoot>
					<TooltipTrigger asChild>
						<button type="button">Ayuda</button>
					</TooltipTrigger>
					<TooltipContent>Texto de ayuda</TooltipContent>
				</TooltipRoot>
			</TooltipProvider>,
		);

		await user.hover(screen.getByRole("button", { name: "Ayuda" }));

		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Texto de ayuda",
		);
	});

	it("preserves the legacy tooltip content prop through the local façade", async () => {
		const user = userEvent.setup();

		render(
			<TooltipProvider delayDuration={0}>
				<Tooltip content="Ayuda heredada">
					<button type="button">Info</button>
				</Tooltip>
			</TooltipProvider>,
		);

		await user.hover(screen.getByRole("button", { name: "Info" }));

		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Ayuda heredada",
		);
	});
});
