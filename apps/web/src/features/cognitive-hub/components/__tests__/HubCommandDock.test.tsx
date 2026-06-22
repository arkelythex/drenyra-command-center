import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";

const useAccountingJobRunsMock = vi.hoisted(() => vi.fn());
const preloadHubEvidenceDrawerMock = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useAccountingJobRuns", () => ({
	useAccountingJobRuns: useAccountingJobRunsMock,
}));

vi.mock("../input/UnifiedInput", () => ({
	UnifiedInput: () => <div data-testid="unified-input-mock" />,
}));

vi.mock("../ToolExecutionTimeline", () => ({
	ToolExecutionTimeline: () => <div data-testid="timeline-mock" />,
}));

vi.mock("../ToolApprovalCard", () => ({
	ToolApprovalCard: () => <div data-testid="approval-card-mock" />,
}));

vi.mock("../layout/hub-evidence-drawer-loader", () => ({
	preloadHubEvidenceDrawer: preloadHubEvidenceDrawerMock,
	loadHubEvidenceDrawerModule: async () => ({
		HubEvidenceDrawer: ({ onToggle }: { onToggle: () => void }) => (
			<div data-testid="evidence-drawer-mock">
				<button type="button" onClick={onToggle}>
					Ocultar detalle
				</button>
			</div>
		),
	}),
}));

import { HubCommandDock } from "../layout/hub-command-dock";

const activityEntry: CognitiveActivityEntry = {
	id: "entry-1",
	type: "run_started",
	label: "Preparar SIRE",
	detail: "Evidencia generada",
	status: "success",
	timestamp: "2026-05-04T12:00:00.000Z",
	runId: "run-1234567890abcdef",
};

function renderDock(entries: CognitiveActivityEntry[] = [activityEntry]) {
	return render(
		<HubCommandDock
			density="normal"
			pendingApproval={null}
			isCommandPaletteActive={false}
			activityTimeline={entries}
			activeRunId="run-1234567890abcdef"
			isSwarmActive={false}
			onApprovePendingTool={vi.fn(async () => undefined)}
			onDenyPendingTool={vi.fn(async () => undefined)}
			onClearTimeline={vi.fn()}
			onSend={vi.fn()}
			onCommandModeChange={vi.fn()}
		/>,
	);
}

describe("HubCommandDock evidence preload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAccountingJobRunsMock.mockReturnValue({ runs: [] });
	});

	it("shows a lightweight evidence trigger and preloads on intent", () => {
		renderDock();

		const trigger = screen.getByRole("button", { name: /L3 Evidencia/i });

		expect(screen.getByTestId("timeline-mock")).toBeInTheDocument();
		expect(
			screen.queryByTestId("evidence-drawer-mock"),
		).not.toBeInTheDocument();

		fireEvent.pointerEnter(trigger);
		fireEvent.focus(trigger);

		expect(preloadHubEvidenceDrawerMock).toHaveBeenCalledTimes(2);
	});

	it("loads the full evidence drawer only after expansion", async () => {
		renderDock();

		fireEvent.click(screen.getByRole("button", { name: /Ver detalle/i }));

		expect(
			await screen.findByTestId("evidence-drawer-mock"),
		).toBeInTheDocument();
	});
});
