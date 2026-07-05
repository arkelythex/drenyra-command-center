/**
 * Tests for unified Text component (atoms/text.tsx)
 *
 * @phase 2.3 — Unified Text component
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "../text";

describe("Text (unified)", () => {
	// ── Defaults ───────────────────────────────────────────────────────

	it("renders with default props (body variant, <p> tag)", () => {
		const { container } = render(<Text>Hello</Text>);
		const el = container.querySelector("p");
		expect(el).toBeInTheDocument();
		expect(el).toHaveTextContent("Hello");
	});

	it("renders children correctly", () => {
		render(
			<Text>
				<span data-testid="child">nested</span>
			</Text>,
		);
		expect(screen.getByTestId("child")).toBeInTheDocument();
	});

	// ── Variants ───────────────────────────────────────────────────────

	it.each([
		{
			variant: "hero" as const,
			expected: ["text-4xl", "sm:text-5xl", "font-bold"],
		},
		{ variant: "display" as const, expected: ["text-3xl", "font-bold"] },
		{ variant: "h1" as const, expected: ["text-2xl", "font-bold"] },
		{ variant: "h2" as const, expected: ["text-xl", "font-semibold"] },
		{ variant: "h3" as const, expected: ["text-lg", "font-semibold"] },
		{ variant: "h4" as const, expected: ["text-base", "font-semibold"] },
		{ variant: "body" as const, expected: ["text-base"] },
		{ variant: "bodySm" as const, expected: ["text-sm"] },
		{ variant: "caption" as const, expected: ["text-xs"] },
		{
			variant: "overline" as const,
			expected: ["text-2xs", "font-semibold", "uppercase", "tracking-widest"],
		},
		{ variant: "label" as const, expected: ["text-sm", "font-medium"] },
		{ variant: "meta" as const, expected: ["text-xs"] },
	])("renders $variant variant with expected classes", ({
		variant,
		expected,
	}) => {
		const { container } = render(<Text variant={variant}>{variant}</Text>);
		const el = container.querySelector("p")!;
		for (const cls of expected) {
			expect(el.className).toContain(cls);
		}
	});

	it("renders data variant with font-mono and tabular-nums", () => {
		const { container } = render(<Text variant="data">$1,234</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("font-mono");
		expect(el.className).toContain("tabular-nums");
	});

	// ── Polymorphic as ─────────────────────────────────────────────────

	it.each([
		{ as: "h1" as const, tag: "h1" },
		{ as: "h2" as const, tag: "h2" },
		{ as: "h3" as const, tag: "h3" },
		{ as: "span" as const, tag: "span" },
		{ as: "div" as const, tag: "div" },
		{ as: "label" as const, tag: "label" },
		{ as: "small" as const, tag: "small" },
	])('renders as <$tag> when as="$as"', ({ as, tag }) => {
		const { container } = render(<Text as={as}>content</Text>);
		const el = container.querySelector(tag);
		expect(el).toBeInTheDocument();
	});

	// ── Weight override ────────────────────────────────────────────────

	it("applies weight override", () => {
		const { container } = render(
			<Text variant="body" weight="bold">
				bold body
			</Text>,
		);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("font-bold");
	});

	it("does not apply weight class when weight is not provided", () => {
		const { container } = render(<Text variant="body">normal</Text>);
		const el = container.querySelector("p")!;
		// body variant doesn't include a font-weight class by itself
		expect(el.className).not.toMatch(/font-/);
	});

	// ── Muted ──────────────────────────────────────────────────────────

	it("applies muted styling", () => {
		const { container } = render(<Text muted>muted text</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("text-[var(--text-tertiary)]");
	});

	it("uses primary color when not muted", () => {
		const { container } = render(<Text>primary text</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("text-[var(--text-primary)]");
	});

	// ── Truncate ───────────────────────────────────────────────────────

	it("applies truncate class", () => {
		const { container } = render(<Text truncate>long text</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("truncate");
	});

	// ── Scrim ──────────────────────────────────────────────────────────

	it("applies medium scrim when scrim={true}", () => {
		const { container } = render(<Text scrim>scrimmed text</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]");
	});

	it("applies custom scrim level when passed as string key", () => {
		const { container } = render(<Text scrim="light">light scrim</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]");
	});

	it("applies heavy scrim level when passed as string key", () => {
		const { container } = render(<Text scrim="heavy">heavy scrim</Text>);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]");
	});

	// ── className merge ────────────────────────────────────────────────

	it("merges custom className", () => {
		const { container } = render(
			<Text className="my-custom-class">custom</Text>,
		);
		const el = container.querySelector("p")!;
		expect(el.className).toContain("my-custom-class");
		// Preserves variant classes
		expect(el.className).toContain("text-base");
	});

	// ── id and style pass-through ──────────────────────────────────────

	it("passes id and style attributes", () => {
		const { container } = render(
			<Text id="greeting" style={{ color: "red" }}>
				hello
			</Text>,
		);
		const el = container.querySelector("p")!;
		expect(el.id).toBe("greeting");
		expect(el.style.color).toBe("red");
	});

	// ── ref (React 19) ─────────────────────────────────────────────────

	it("forwards ref to the DOM element", () => {
		const ref = { current: null as HTMLElement | null };
		render(<Text ref={ref}>ref test</Text>);
		expect(ref.current).toBeInstanceOf(HTMLElement);
		expect(ref.current?.tagName).toBe("P");
	});
});
