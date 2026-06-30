import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiffViewerV3 } from "@/components/agentic/DiffViewerV3";
import { FiscalEditorialShell } from "@/components/layout/FiscalEditorialShell";
import { SurfacePanel } from "../SurfacePanel";

describe("Fiscal Editorial components", () => {
	it("SurfacePanel renders with editorial data attribute surface", () => {
		render(<SurfacePanel>Content</SurfacePanel>);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("FiscalEditorialShell sets mode attribute", () => {
		render(
			<FiscalEditorialShell mode="operational">
				<span>Workspace</span>
			</FiscalEditorialShell>,
		);
		const shell = screen.getByText("Workspace").closest("[data-shell-mode]");
		expect(shell).toHaveAttribute("data-shell-mode", "operational");
	});

	it("DiffViewerV3 renders diff lines", () => {
		render(
			<DiffViewerV3
				title="Test diff"
				lines={[{ type: "add", content: "line added" }]}
			/>,
		);
		expect(screen.getByText("Test diff")).toBeInTheDocument();
		expect(screen.getByText("line added")).toBeInTheDocument();
	});
});
