import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceBadge } from "../ConfidenceBadge";

describe("ConfidenceBadge", () => {
	it("renders high confidence score (>= 0.9)", () => {
		render(<ConfidenceBadge score={0.95} />);
		expect(screen.getByText("95%")).toBeInTheDocument();
		expect(screen.getByText(/Robot Match/i)).toBeInTheDocument();
	});

	it("renders medium confidence score (0.7 to 0.9)", () => {
		render(<ConfidenceBadge score={0.8} />);
		expect(screen.getByText("80%")).toBeInTheDocument();
		expect(screen.getByText(/Robot Match/i)).toBeInTheDocument();
	});

	it("renders low confidence score (< 0.7)", () => {
		render(<ConfidenceBadge score={0.4} />);
		expect(screen.getByText("40%")).toBeInTheDocument();
		expect(screen.getByText(/Robot Match/i)).toBeInTheDocument();
	});

	it("renders edge case score of 0", () => {
		render(<ConfidenceBadge score={0} />);
		expect(screen.getByText("0%")).toBeInTheDocument();
	});

	it("renders edge case score of 1", () => {
		render(<ConfidenceBadge score={1} />);
		expect(screen.getByText("100%")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<ConfidenceBadge score={0.9} className="my-custom-class" />,
		);
		const badge = container.firstChild as HTMLElement;
		expect(badge.className).toContain("my-custom-class");
	});
});
