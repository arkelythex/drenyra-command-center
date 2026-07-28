/**
 * CAP-SIRE-01 Phase C.4 — EvidenceBadge component tests
 *
 * Strict TDD: RED → GREEN → TRIANGULATE → REFACTOR
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceBadge } from "../EvidenceBadge";

describe("EvidenceBadge (Phase C.4)", () => {
	// C.4.1: renders source label for all 3 sources
	it("renders source label for SUNAT", () => {
		render(
			<EvidenceBadge source="SUNAT" status="pending" confidence="medium" />,
		);
		expect(screen.getByText("SUNAT")).toBeDefined();
	});

	it("renders source label for ledger", () => {
		render(
			<EvidenceBadge source="ledger" status="verified" confidence="high" />,
		);
		expect(screen.getByText("Ledger")).toBeDefined();
	});

	it("renders source label for CPE", () => {
		render(
			<EvidenceBadge source="CPE" status="conflict" confidence="low" />,
		);
		expect(screen.getByText("CPE")).toBeDefined();
	});

	// C.4.3: all 27 state combinations render without error
	it("renders all 3×3×3 = 27 state combinations without crashing", () => {
		const sources = ["SUNAT", "ledger", "CPE"] as const;
		const statuses = ["verified", "pending", "conflict"] as const;
		const confidences = ["high", "medium", "low"] as const;

		for (const source of sources) {
			for (const status of statuses) {
				for (const confidence of confidences) {
					const { container } = render(
						<EvidenceBadge
							source={source}
							status={status}
							confidence={confidence}
						/>,
					);
					expect(container.firstChild).toBeDefined();
				}
			}
		}
	});

	// C.4.5: accessibility
	it("has an aria-label describing source, status, and confidence", () => {
		render(
			<EvidenceBadge source="SUNAT" status="verified" confidence="high" />,
		);
		const badge = screen.getByRole("status");
		expect(badge).toBeDefined();
		expect(badge.getAttribute("aria-label")).toContain("SUNAT");
		expect(badge.getAttribute("aria-label")).toContain("verified");
		expect(badge.getAttribute("aria-label")).toContain("high");
	});

	it("renders verified status with appropriate styling", () => {
		render(
			<EvidenceBadge source="ledger" status="verified" confidence="high" />,
		);
		const badge = screen.getByRole("status");
		expect(badge.className).toContain("verified");
	});

	it("renders conflict status with appropriate styling", () => {
		render(
			<EvidenceBadge source="SUNAT" status="conflict" confidence="low" />,
		);
		const badge = screen.getByRole("status");
		expect(badge.className).toContain("conflict");
	});

	it("renders pending status with appropriate styling", () => {
		render(
			<EvidenceBadge source="CPE" status="pending" confidence="medium" />,
		);
		const badge = screen.getByRole("status");
		expect(badge.className).toContain("pending");
	});
});
