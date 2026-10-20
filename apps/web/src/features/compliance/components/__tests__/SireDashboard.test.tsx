import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/useSireReconciliation", () => ({
	useSireReconciliation: () => ({
		processFile: vi.fn(),
		isProcessing: false,
		discrepancies: [],
		stats: {
			totalSunat: 1180,
			totalLocal: 1180,
			matchCount: 0,
			discrepancyCount: 1,
			igvGap: 10,
		},
		sunatRecords: [{ serie: "F001" }],
		error: null,
	}),
}));

import { SireDashboard } from "../SireDashboard";

describe("SireDashboard", () => {
	it("shows each total with a single currency symbol", () => {
		render(<SireDashboard />);

		const box = screen.getByText("Total SUNAT").parentElement;
		expect(box?.textContent?.replace(/\s+/g, " ")).toMatch(
			/^Total SUNATS\/ ?1,180\.00$/,
		);
	});
});
