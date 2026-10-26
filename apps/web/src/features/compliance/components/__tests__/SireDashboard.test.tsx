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

	it("does not claim a certification when no differences were found", () => {
		render(<SireDashboard />);

		expect(screen.queryByText(/certificad/i)).not.toBeInTheDocument();
		expect(
			screen.getByText(/no se encontraron diferencias/i),
		).toBeInTheDocument();
	});

	it("offers no actions that do nothing", () => {
		render(<SireDashboard />);

		expect(
			screen.queryByRole("button", { name: /exportar acta/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /analizar/i }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /importar propuesta sire/i }),
		).toBeEnabled();
	});
});
