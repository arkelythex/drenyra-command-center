import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentPulse } from "../AgentPulse";

describe("AgentPulse", () => {
	it("renders idle status with default size", () => {
		const { container } = render(<AgentPulse status="idle" />);
		// Should render the inner dot (div)
		const dots = container.querySelectorAll("div.rounded-full");
		expect(dots.length).toBeGreaterThan(0);
	});

	it("renders active status with glow animation", () => {
		const { container } = render(<AgentPulse status="active" size="md" />);
		// Active status renders both the animated ring and the dot
		const dots = container.querySelectorAll("div.rounded-full");
		expect(dots.length).toBeGreaterThan(0);
	});

	it("renders success status", () => {
		const { container } = render(<AgentPulse status="success" size="lg" />);
		const dots = container.querySelectorAll("div.rounded-full");
		expect(dots.length).toBeGreaterThan(0);
	});

	it("renders error status", () => {
		const { container } = render(<AgentPulse status="error" size="sm" />);
		const dots = container.querySelectorAll("div.rounded-full");
		expect(dots.length).toBeGreaterThan(0);
	});

	it("applies custom className", () => {
		const { container } = render(
			<AgentPulse status="idle" className="my-custom-class" />,
		);
		const outer = container.firstChild as HTMLElement;
		expect(outer.className).toContain("my-custom-class");
	});
});
