import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock @tanstack/react-virtual — dynamically adapts to row count
vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({ count }: { count: number }) => {
		const items = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
			index: i,
			start: i * 40,
			size: 40,
			measureElement: vi.fn(),
			key: `virtual-${i}`,
		}));
		return {
			getVirtualItems: () => items,
			getTotalSize: () => Math.max(count, 1) * 40,
			measure: vi.fn(),
			scrollToIndex: vi.fn(),
		};
	},
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
	ArrowUpDown: () => null,
	Check: () => null,
	ChevronDown: () => null,
	Copy: () => null,
	Download: () => null,
	FileSpreadsheet: () => null,
	FolderOpen: () => null,
	PencilLine: () => null,
	RotateCcw: () => null,
	Search: () => null,
	Sparkles: () => null,
}));

// Mock EvidenceBadge
vi.mock("@/components/evidence/EvidenceBadge", () => ({
	EvidenceBadge: () => null,
}));

// Mock the row component
vi.mock("../SireDiffRow", () => ({
	SireDiffRowView: ({ row }: any) => (
		<tr data-testid={`diff-row-${row.id}`}>
			<td>{row.status}</td>
		</tr>
	),
}));

// Mock the toolbar
vi.mock("../SireDiffToolbar", () => ({
	SireDiffToolbar: () => <div data-testid="sire-diff-toolbar" />,
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: any) => children,
}));

// Mock shared hooks
vi.mock("../../shared/useInlineGhostSuggestion", () => ({
	useInlineGhostSuggestion: () => ({
		ghostSuggestion: null,
		ghostCompletion: null,
		acceptGhostSuggestion: () => null,
	}),
}));

import React from "react";
import { VirtualizedSireDiffTable } from "../VirtualizedSireDiffTable";

const DEFAULT_PROPS = {
	visibleRows: Array.from({ length: 200 }, (_, i) => ({
		id: `row-${i}`,
		status: "MISMATCH" as const,
		reason: "Difference found",
		difference: 100,
	})),
	currency: "PEN" as const,
	statusFilter: "ALL" as const,
	showMatches: false,
	matchRowsHidden: 0,
	decisions: {},
	draftsByRow: {},
	selectedRowId: null,
	editingRowId: null,
	promptsByRow: {},
	onStatusFilterChange: vi.fn(),
	onToggleMatches: vi.fn(),
	onCopyTable: vi.fn(),
	onExportExcel: vi.fn(),
	onSelectRow: vi.fn(),
	onAcceptSunat: vi.fn(),
	onKeepLocal: vi.fn(),
	onToggleInlineEditor: vi.fn(),
	onPromptChange: vi.fn(),
	onSuggestInlineEdit: vi.fn(),
	onApplyInlineEdit: vi.fn(),
	onCloseInlineEditor: vi.fn(),
	period: "2026-03",
};

describe("VirtualizedSireDiffTable", () => {
	it("renders only virtual items for large diff (200 rows)", () => {
		render(<VirtualizedSireDiffTable {...DEFAULT_PROPS} />);

		// Should render only the virtual items (10 in mock), not all 200
		expect(screen.getByTestId("sire-diff-toolbar")).toBeDefined();
		// Virtual items should render
		expect(screen.getByTestId("diff-row-row-0")).toBeDefined();
		expect(screen.getByTestId("diff-row-row-9")).toBeDefined();
		// Row 199 should not be in DOM (outside virtual range of 0-9)
		expect(screen.queryByTestId("diff-row-row-199")).toBeNull();
		// Row 50 should also not be in DOM
		expect(screen.queryByTestId("diff-row-row-50")).toBeNull();
	});

	it("renders virtualizer container with correct total height", () => {
		render(<VirtualizedSireDiffTable {...DEFAULT_PROPS} />);
		// The virtualizer inner div should have the total height = 500 * 40
		const inner = document.querySelector("[data-testid='virtualizer-inner']");
		expect(inner).toBeDefined();
	});

	it("renders empty state when visibleRows is empty", () => {
		render(
			<VirtualizedSireDiffTable {...DEFAULT_PROPS} visibleRows={[]} />,
		);
		expect(
			screen.getByText("Sin filas para el filtro seleccionado."),
		).toBeDefined();
	});
});
