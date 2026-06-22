// @vitest-environment happy-dom

import { createElement, type ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const mockUseReducedMotion = vi.fn(() => false);

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: { children: ReactNode }) =>
			createElement("div", props, children),
	},
	useReducedMotion: () => mockUseReducedMotion(),
}));

describe("ScrollReveal", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders children when motion is enabled", () => {
		render(<ScrollReveal className="extra">Visible content</ScrollReveal>);

		expect(screen.getByText("Visible content")).toBeTruthy();
		expect(mockUseReducedMotion).toHaveBeenCalled();
	});

	it("keeps content visible when reduced motion is enabled", () => {
		mockUseReducedMotion.mockReturnValue(true);

		render(<ScrollReveal className="extra">Reduced content</ScrollReveal>);

		expect(screen.getByText("Reduced content")).toBeTruthy();
		expect(mockUseReducedMotion).toHaveBeenCalled();
	});
});
