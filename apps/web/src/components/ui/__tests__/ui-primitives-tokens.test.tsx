import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "../badge";
import { Button } from "../button";
import { Card } from "../card";
import { Input } from "../input";
import { Checkbox } from "../checkbox";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "../select";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from "../dialog";
import { componentTokenVars } from "@/lib/design-tokens/component-tokens";

vi.mock("@/hooks/useHaptics", () => ({
	useHaptics: () => ({ trigger: vi.fn() }),
}));

vi.mock("framer-motion", () => ({
	motion: {
		button: ({
			children,
			className,
			transition: _transition,
			whileHover: _whileHover,
			whileTap: _whileTap,
			...props
		}: ComponentProps<"button"> & {
			transition?: unknown;
			whileHover?: unknown;
			whileTap?: unknown;
		}) => (
			<button type="button" className={className} {...props}>
				{children}
			</button>
		),
		div: ({ children, className, ...props }: ComponentProps<"div">) => (
			<div className={className} {...props}>
				{children}
			</div>
		),
	},
	useReducedMotion: () => true,
}));

describe("UI primitives component tokens", () => {
	it("maps primary button styles to akx component tokens", () => {
		render(<Button>Guardar</Button>);

		const button = screen.getByRole("button", { name: "Guardar" });
		expect(button.className).toContain(
			`var(${componentTokenVars.button.background})`,
		);
		expect(button.className).toContain(
			`var(${componentTokenVars.button.text})`,
		);
	});

	it("maps default badge styles to akx neutral tokens", () => {
		render(<Badge>Neutral</Badge>);

		const badge = screen.getByText("Neutral");
		expect(badge.className).toContain(
			`var(${componentTokenVars.badge.neutralBg})`,
		);
		expect(badge.className).toContain(
			`var(${componentTokenVars.badge.neutralBorder})`,
		);
	});

	it("maps secondary badge styles to akx secondary tokens", () => {
		render(<Badge variant="secondary">Secondary</Badge>);

		const badge = screen.getByText("Secondary");
		expect(badge.className).toContain(
			`var(${componentTokenVars.badge.secondaryBg})`,
		);
	});

	it("maps card surface styles to akx card tokens", () => {
		const { container } = render(
			<Card animateOnHover={false} data-testid="token-card">
				Content
			</Card>,
		);

		const card = container.querySelector('[data-testid="token-card"]');
		expect(card?.className).toContain(`var(${componentTokenVars.card.bg})`);
		expect(card?.className).toContain(`var(${componentTokenVars.card.border})`);
	});

	it("layers akx input tokens on the web input façade", () => {
		render(<Input aria-label="RUC" />);

		const input = screen.getByRole("textbox", { name: "RUC" });
		expect(input.className).toContain(`var(${componentTokenVars.input.bg})`);
		expect(input.className).toContain(
			`var(${componentTokenVars.input.border})`,
		);
		expect(input.className).toContain(
			`var(${componentTokenVars.input.placeholder})`,
		);
	});

	it("maps checkbox styles to akx checkbox tokens", () => {
		render(
			<label>
				<Checkbox /> Aceptar términos
			</label>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.className).toContain("var(--akx-checkbox-border)");
		expect(checkbox.className).toContain("var(--akx-checkbox-checked-bg)");
	});

	it("maps select trigger styles to akx select tokens", () => {
		const { container } = render(
			<Select>
				<SelectTrigger aria-label="Seleccionar mes">
					<SelectValue placeholder="Seleccionar" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ene">Enero</SelectItem>
				</SelectContent>
			</Select>,
		);

		// The trigger is rendered — confirm it carries token classes
		const trigger = container.querySelector('[aria-label="Seleccionar mes"]');
		expect(trigger).toBeTruthy();
		expect(trigger!.className).toContain("var(--akx-select-trigger-bg)");
		expect(trigger!.className).toContain("var(--akx-select-trigger-border)");
	});

	it("maps dialog content styles to akx dialog tokens", () => {
		render(
			<Dialog open>
				<DialogContent aria-describedby={undefined}>
					<DialogTitle>Confirmar</DialogTitle>
					<DialogDescription>¿Está seguro?</DialogDescription>
				</DialogContent>
			</Dialog>,
		);

		const content = screen.getByRole("dialog");
		expect(content.className).toContain("var(--akx-dialog-content-bg)");
		expect(content.className).toContain("var(--akx-dialog-content-border)");
	});
});

describe("UI primitives rendering behavior", () => {
	it("checkbox renders as checkbox role and toggles on click", async () => {
		const user = userEvent.setup();
		render(
			<label>
				<Checkbox /> Aceptar términos
			</label>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeInTheDocument();
		expect(checkbox).not.toBeChecked();

		await user.click(checkbox);
		expect(checkbox).toBeChecked();

		await user.click(checkbox);
		expect(checkbox).not.toBeChecked();
	});

	it("checkbox renders checked when defaultChecked is true", () => {
		render(
			<label>
				<Checkbox defaultChecked /> Opción activa
			</label>,
		);

		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("select renders trigger with placeholder text", () => {
		render(
			<Select>
				<SelectTrigger aria-label="Seleccionar mes">
					<SelectValue placeholder="Elegir mes..." />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ene">Enero</SelectItem>
				</SelectContent>
			</Select>,
		);

		const trigger = screen.getByRole("combobox", { name: "Seleccionar mes" });
		expect(trigger).toBeInTheDocument();
		expect(screen.getByText("Elegir mes...")).toBeInTheDocument();
	});

	it("dialog renders title and description when open", () => {
		render(
			<Dialog open>
				<DialogContent aria-describedby={undefined}>
					<DialogTitle>Confirmar acción</DialogTitle>
					<DialogDescription>¿Desea proceder con la operación?</DialogDescription>
				</DialogContent>
			</Dialog>,
		);

		expect(
			screen.getByRole("heading", { name: "Confirmar acción" }),
		).toBeInTheDocument();
		expect(screen.getByText("¿Desea proceder con la operación?")).toBeInTheDocument();
	});

	it("dialog does not render content when closed (open=false)", () => {
		render(
			<Dialog open={false}>
				<DialogContent aria-describedby={undefined}>
					<DialogTitle>No visible</DialogTitle>
					<DialogDescription>No debería mostrarse</DialogDescription>
				</DialogContent>
			</Dialog>,
		);

		expect(screen.queryByRole("heading", { name: "No visible" })).not.toBeInTheDocument();
	});
});
