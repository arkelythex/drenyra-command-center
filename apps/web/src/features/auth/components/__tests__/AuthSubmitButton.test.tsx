import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthSubmitButton } from "../AuthSubmitButton";

describe("AuthSubmitButton", () => {
	it("is a visible brand button, not the ink-on-ink primary", () => {
		render(<AuthSubmitButton isLoading={false}>Crear cuenta</AuthSubmitButton>);
		const button = screen.getByRole("button", { name: "Crear cuenta" });
		expect(button).toHaveAttribute("type", "submit");
		expect(button.className).toContain("bg-brand");
		expect(button.className).not.toMatch(/uppercase|bg-primary\b/);
	});

	it("disables itself and announces the wait while loading", () => {
		render(<AuthSubmitButton isLoading>Crear cuenta</AuthSubmitButton>);
		const button = screen.getByRole("button", { name: /crear cuenta/i });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
	});
});
