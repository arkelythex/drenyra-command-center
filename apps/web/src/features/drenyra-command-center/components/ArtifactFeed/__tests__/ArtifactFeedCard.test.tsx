import type { HubArtifact } from "@drenyra/shared/artifacts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtifactFeedCard } from "../ArtifactFeedCard";

describe("ArtifactFeedCard", () => {
	it("renders artifact title", () => {
		const artifact: HubArtifact = {
			id: "a1",
			title: "Invoice #001-23456",
			type: "explanation",
			content: "This invoice was processed successfully",
		};
		render(<ArtifactFeedCard artifact={artifact} />);
		expect(screen.getByText("Invoice #001-23456")).toBeTruthy();
	});

	it("renders type badge for accounting_diff", () => {
		const artifact: HubArtifact = {
			id: "a2",
			title: "Diff de conciliación",
			type: "accounting_diff",
			payload: { command: "reconcile", scope: "banking", diffs: [] },
		};
		render(<ArtifactFeedCard artifact={artifact} />);
		expect(screen.getByText(/accounting_diff/)).toBeTruthy();
	});

	it("shows summary for sheet_diff artifacts", () => {
		const artifact: HubArtifact = {
			id: "a3",
			title: "Sheet Diff",
			type: "sheet_diff",
			payload: {
				command: "diff",
				sourceName: "ledger.xlsx",
				acceptShortcut: "Ctrl+Enter",
				rows: [],
				summary: { total: 150, updated: 12, flagged: 3 },
			},
		};
		render(<ArtifactFeedCard artifact={artifact} />);
		expect(screen.getByText(/150/)).toBeTruthy();
		expect(screen.getByText(/12 actualizados/)).toBeTruthy();
	});

	it("renders nothing when artifact has no title and no content", () => {
		const artifact: HubArtifact = {
			id: "a4",
			title: "",
			type: "explanation",
			content: "",
		};
		const { container } = render(<ArtifactFeedCard artifact={artifact} />);
		expect(container.innerHTML).toBe("");
	});
});
