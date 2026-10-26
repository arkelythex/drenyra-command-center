import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
	it("renders a brand action with theme utilities, not var() classes", () => {
		render(
			<Button variant="brand" size="touch">
				Emitir
			</Button>,
		);
		const button = screen.getByRole("button", { name: "Emitir" });
		for (const token of [
			"bg-brand",
			"text-brand-foreground",
			"hover:bg-brand/90",
			"h-11",
		]) {
			expect(button.className).toContain(token);
		}
		expect(button.className).not.toMatch(/\bbg-\[var\(--/);
		expect(button.className).not.toContain("ring-[var(--");
	});

	it("keeps the existing variants and lets className win", () => {
		render(
			<Button variant="outline" className="w-full">
				Cancelar
			</Button>,
		);
		const button = screen.getByRole("button", { name: "Cancelar" });
		expect(button.className).toContain("border");
		expect(button.className).toContain("w-full");
	});

	it("is disabled and not a submit by default", () => {
		render(<Button disabled>Guardar</Button>);
		expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
	});
});

describe("Button asChild", () => {
	it("styles a link instead of nesting it inside a button", () => {
		render(
			<Button variant="outline" asChild>
				<a href="/login">Volver</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: "Volver" });
		expect(link.className).toContain("border");
		expect(screen.queryByRole("button")).toBeNull();
	});
});
