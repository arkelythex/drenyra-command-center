import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";
import {
	ArtifactCollapsible,
	type DensityMode,
} from "@/features/drenyra-command-center/components/ArtifactCollapsible";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("framer-motion", () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require("react");
	const MotionDiv = (props: Record<string, unknown>) => {
		const { children, ...rest } = props;
		return React.createElement("div", rest, children);
	};
	return {
		motion: { div: MotionDiv },
		AnimatePresence: (props: { children: React.ReactNode }) =>
			React.createElement(React.Fragment, null, props.children),
	};
});

vi.mock(
	"@/features/cognitive-hub/components/artifacts/ArtifactRenderer",
	() => ({
		ArtifactRenderer: ({ artifact }: { artifact: HubArtifact }) => (
			<div data-testid="artifact-renderer">{artifact.title} rendered</div>
		),
	}),
);

// ── Factory helpers ───────────────────────────────────────────────────────────

function createExplanationArtifact(
	overrides?: Partial<HubArtifact>,
): HubArtifact {
	return {
		id: "artifact-explanation-1",
		title: "Explicación de resultados",
		type: "explanation",
		content:
			"Se identificaron 3 discrepancias en el libro mayor correspondiente al período 2026-05.",
		...overrides,
	} as HubArtifact;
}

function createSheetDiffArtifact(
	overrides?: Partial<HubArtifact>,
): HubArtifact {
	return {
		id: "artifact-sheet-1",
		title: "Comparación de planillas",
		type: "sheet_diff",
		payload: {
			command: "diff",
			sourceName: "Libro Mayor",
			acceptShortcut: "a",
			rows: [
				{
					id: "1",
					record: "R1",
					original: "100",
					corrected: "150",
					status: "updated",
					reason: "Ajuste por diferencia cambiaria",
				},
			],
			summary: { total: 15, updated: 8, flagged: 3 },
		},
		...overrides,
	} as HubArtifact;
}

function _createDashboardArtifact(): HubArtifact {
	return {
		id: "artifact-dashboard-1",
		title: "Dashboard Financiero",
		type: "dashboard",
		payload: {
			primaryMetric: { value: "S/ 2,450,000", trend: "+12%" },
			statusScore: 87,
		},
	};
}

function _createChartArtifact(): HubArtifact {
	return {
		id: "artifact-chart-1",
		title: "Evolución de ingresos",
		type: "chart",
		payload: {
			data: [1200, 3400, 2800, 4100, 3900, 5200],
			labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
		},
	};
}

// ── Shared renders ────────────────────────────────────────────────────────────

const defaultHandlers = {
	onPin: vi.fn(),
	onFocus: vi.fn(),
	onCreateCase: vi.fn(),
};

function renderCollapsible(
	artifact: HubArtifact,
	density: DensityMode = "compact",
	overrides?: Partial<typeof defaultHandlers>,
) {
	const handlers = { ...defaultHandlers, ...overrides };
	return {
		handlers,
		...render(
			<ArtifactCollapsible
				artifact={artifact}
				density={density}
				isPinned={false}
				onPin={handlers.onPin}
				onFocus={handlers.onFocus}
				onCreateCase={handlers.onCreateCase}
			/>,
		),
	};
}

afterEach(() => {
	vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ArtifactCollapsible", () => {
	describe("collapsed state", () => {
		it("renders collapsed by default with title and type badge", () => {
			const artifact = createExplanationArtifact();
			renderCollapsible(artifact, "compact", { onCreateCase: undefined });

			// Shows title
			expect(screen.getByText(artifact.title)).toBeInTheDocument();

			// Shows type badge (explanation)
			expect(screen.getByText("explanation")).toBeInTheDocument();

			// ChevronRight icon means collapsed — the toggle button has aria-expanded="false"
			expect(
				screen.getByRole("button", { expanded: false }),
			).toBeInTheDocument();

			// ArtifactRenderer should NOT be rendered when collapsed
			expect(screen.queryByTestId("artifact-renderer")).not.toBeInTheDocument();
		});
	});

	describe("expansion", () => {
		it("clicking the toggle button expands the artifact and renders the renderer", async () => {
			const user = userEvent.setup();
			const artifact = createExplanationArtifact();
			const onFocus = vi.fn();
			renderCollapsible(artifact, "compact", {
				onFocus,
				onCreateCase: undefined,
			});

			// Click collapsed toggle
			const toggle = screen.getByRole("button", { expanded: false });
			await user.click(toggle);

			// Now expanded
			expect(
				screen.getByRole("button", { expanded: true }),
			).toBeInTheDocument();

			// ArtifactRenderer visible
			const renderer = screen.getByTestId("artifact-renderer");
			expect(renderer).toBeInTheDocument();
			expect(renderer).toHaveTextContent(`${artifact.title} rendered`);

			// onFocus was called with the artifact
			expect(onFocus).toHaveBeenCalledTimes(1);
			expect(onFocus).toHaveBeenCalledWith(artifact);
		});
	});

	describe("pin button", () => {
		it("toggles pin state when clicked and calls onPin with artifact id", async () => {
			const user = userEvent.setup();
			const artifact = createExplanationArtifact();
			const onPin = vi.fn();
			renderCollapsible(artifact, "compact", {
				onPin,
				onCreateCase: undefined,
			});

			// Find pin button via aria-label
			const pinBtn = screen.getByRole("button", { name: /pin artifact/i });
			expect(pinBtn).toBeInTheDocument();

			// Click to pin
			await user.click(pinBtn);
			expect(onPin).toHaveBeenCalledTimes(1);
			expect(onPin).toHaveBeenCalledWith(artifact.id);

			// Re-render with isPinned=true to verify label changes
			const { unmount } = renderCollapsible(artifact, "compact", {
				onPin,
				onCreateCase: undefined,
			});
			unmount();

			render(
				<ArtifactCollapsible
					artifact={artifact}
					density="compact"
					isPinned={true}
					onPin={onPin}
					onFocus={vi.fn()}
				/>,
			);

			expect(
				screen.getByRole("button", { name: /unpin artifact/i }),
			).toBeInTheDocument();
		});
	});

	describe("create case button", () => {
		it("shows create case button for sheet_diff artifact", () => {
			const artifact = createSheetDiffArtifact();
			renderCollapsible(artifact);

			expect(
				screen.getByRole("button", { name: /crear caso fiscal/i }),
			).toBeInTheDocument();
		});

		it("does NOT show create case button for explanation artifact (non-creable type)", () => {
			const artifact = createExplanationArtifact();
			renderCollapsible(artifact);

			expect(
				screen.queryByRole("button", { name: /crear caso fiscal/i }),
			).not.toBeInTheDocument();
		});

		it("does NOT show create case button when onCreateCase is not provided", () => {
			const artifact = createSheetDiffArtifact();
			renderCollapsible(artifact, "compact", { onCreateCase: undefined });

			expect(
				screen.queryByRole("button", { name: /crear caso fiscal/i }),
			).not.toBeInTheDocument();
		});

		it("calls onCreateCase with the artifact when clicked", async () => {
			const user = userEvent.setup();
			const artifact = createSheetDiffArtifact();
			const onCreateCase = vi.fn();
			renderCollapsible(artifact, "compact", { onCreateCase });

			await user.click(
				screen.getByRole("button", { name: /crear caso fiscal/i }),
			);

			expect(onCreateCase).toHaveBeenCalledTimes(1);
			expect(onCreateCase).toHaveBeenCalledWith(artifact);
		});
	});

	describe("density modes", () => {
		it("compact mode shows only title and type badge — no summary, no KPI", () => {
			const artifact = createSheetDiffArtifact();
			renderCollapsible(artifact, "compact", { onCreateCase: undefined });

			// Title and badge present
			expect(screen.getByText(artifact.title)).toBeInTheDocument();
			expect(screen.getByText("sheet diff")).toBeInTheDocument();

			// The summary text for sheet_diff in detail mode is "15 filas | 8 actualizadas | 3 flagged"
			expect(
				screen.queryByText(/filas.*actualizadas.*flagged/i),
			).not.toBeInTheDocument();

			// The KPI for sheet_diff in numbers-only mode is "8/15"
			expect(screen.queryByText("8/15")).not.toBeInTheDocument();
		});

		it("detail mode shows summary info below the title and badge", () => {
			const artifact = createSheetDiffArtifact();
			renderCollapsible(artifact, "detail", { onCreateCase: undefined });

			// Summary text: `${total} filas | ${updated} actualizadas | ${flagged} flagged`
			expect(
				screen.getByText(/15 filas \| 8 actualizadas \| 3 flagged/i),
			).toBeInTheDocument();
		});

		it("numbers-only mode shows numeric KPI instead of summary", () => {
			const artifact = createSheetDiffArtifact();
			renderCollapsible(artifact, "numbers-only", { onCreateCase: undefined });

			// KPI: `${updated}/${total}` = "8/15"
			expect(screen.getByText("8/15")).toBeInTheDocument();
		});
	});

	describe("callbacks", () => {
		it("onPin fires with artifact id when pin button is clicked", async () => {
			const user = userEvent.setup();
			const artifact = createExplanationArtifact();
			const onPin = vi.fn();
			renderCollapsible(artifact, "compact", {
				onPin,
				onCreateCase: undefined,
			});

			await user.click(screen.getByRole("button", { name: /pin artifact/i }));

			expect(onPin).toHaveBeenCalledExactlyOnceWith(artifact.id);
		});

		it("onCreateCase fires with the full artifact when create-case button is clicked", async () => {
			const user = userEvent.setup();
			const artifact = createSheetDiffArtifact();
			const onCreateCase = vi.fn();
			renderCollapsible(artifact, "compact", { onCreateCase });

			await user.click(
				screen.getByRole("button", { name: /crear caso fiscal/i }),
			);

			expect(onCreateCase).toHaveBeenCalledExactlyOnceWith(artifact);
		});

		it("onFocus fires with the artifact when expanding", async () => {
			const user = userEvent.setup();
			const artifact = createExplanationArtifact();
			const onFocus = vi.fn();
			renderCollapsible(artifact, "compact", {
				onFocus,
				onCreateCase: undefined,
			});

			await user.click(screen.getByRole("button", { expanded: false }));

			expect(onFocus).toHaveBeenCalledExactlyOnceWith(artifact);
		});
	});
});
