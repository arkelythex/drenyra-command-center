import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, type BadgeVariant } from "../Badge";

const VARIANT_TOKENS: Record<BadgeVariant, string[]> = {
	default: ["bg-muted", "text-foreground"],
	secondary: ["bg-muted", "text-muted-foreground"],
	outline: ["border-border", "text-muted-foreground"],
	soft: ["border-transparent", "text-muted-foreground"],
	success: ["bg-success/10", "text-success"],
	info: ["bg-info/10", "text-info"],
	warning: ["bg-warning/10", "text-warning"],
	danger: ["bg-danger/10", "text-danger"],
	accent: ["bg-brand/10", "text-brand"],
};

describe("Badge", () => {
	it.each(Object.entries(VARIANT_TOKENS))(
		"styles the %s variant with semantic tokens only",
		(variant, expected) => {
			render(<Badge variant={variant as BadgeVariant}>Estado</Badge>);

			const badge = screen.getByText("Estado");
			for (const token of expected) expect(badge).toHaveClass(token);
			expect(badge.className).not.toMatch(/var\(--|rgba\(|#[0-9a-f]{3,6}/i);
		},
	);

	it("keeps the label as written: no forced uppercase, no wrapping, readable size", () => {
		render(<Badge>Emitida · vence 5 nov</Badge>);

		const badge = screen.getByText("Emitida · vence 5 nov");
		expect(badge).not.toHaveClass("uppercase");
		expect(badge).toHaveClass("whitespace-nowrap", "text-xs");
		expect(badge.className).not.toMatch(/text-\[\d+px\]/);
	});

	it("defaults to the neutral variant and merges a custom class", () => {
		render(<Badge className="gap-3">Borrador</Badge>);

		const badge = screen.getByText("Borrador");
		expect(badge).toHaveClass("bg-muted", "gap-3");
	});

	it("forwards native attributes", () => {
		render(
			<Badge data-testid="b" title="Detalle">
				x
			</Badge>,
		);
		expect(screen.getByTestId("b")).toHaveAttribute("title", "Detalle");
	});
});
