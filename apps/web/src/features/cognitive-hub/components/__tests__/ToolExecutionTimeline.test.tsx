import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAccountingJobRunsMock = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useAccountingJobRuns", () => ({
	useAccountingJobRuns: useAccountingJobRunsMock,
}));

import { ToolExecutionTimeline } from "../ToolExecutionTimeline";

describe("ToolExecutionTimeline", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAccountingJobRunsMock.mockReturnValue({
			runs: [
				{
					id: "run-1",
					jobTitle: "Preparar SIRE",
					status: "COMPLETED",
					summary: "SIRE listo",
					prompt: "Preparar SIRE del periodo actual",
					createdAt: "2026-04-01T00:00:00.000Z",
					controlPlane: {
						traceId: "trace-1234",
						surfaceId: "prepare-sire",
						surface: { title: "Preparar SIRE" },
						approvalState: "approved",
						retrievalMode: "hybrid-documentary",
						evaluationSummary: {
							state: "green",
							metrics: [],
							generatedAt: "2026-04-01T00:05:00.000Z",
						},
						trace: [
							{
								traceId: "trace-1234",
								eventType: "evaluation-recorded",
								occurredAt: "2026-04-01T00:05:00.000Z",
								summary: "Evaluation recorded",
								piiRedacted: true,
								attributes: {
									traceId: "trace-1234",
									runId: "run-1",
									surfaceId: "prepare-sire",
									tenantId: "cmp-1",
								},
							},
						],
						documentarySources: [{ source: "sunat" }],
						representativePath: true,
					},
				},
			],
		});
	});

	it("renders representative control-plane trace details", () => {
		render(<ToolExecutionTimeline entries={[]} activeRunId="run-1" />);

		expect(useAccountingJobRunsMock).toHaveBeenCalledWith(6, {
			includeControlPlane: true,
		});
		expect(screen.getByText("Preparar SIRE")).toBeInTheDocument();
		expect(screen.getByText(/hybrid-documentary/i)).toBeInTheDocument();
		expect(screen.getByText(/Evaluation recorded/i)).toBeInTheDocument();
		expect(screen.getByText(/fuentes documentales 1/i)).toBeInTheDocument();
	});

	it("defers control-plane hydration while the timeline is collapsed", () => {
		render(
			<ToolExecutionTimeline
				activeRunId={null}
				entries={[
					{
						id: "entry-1",
						type: "run_started",
						label: "Ejecución local",
						detail: "Sin traza todavía",
						status: "success",
						timestamp: "2026-04-01T00:00:00.000Z",
					},
				]}
			/>,
		);

		expect(useAccountingJobRunsMock).toHaveBeenCalledWith(6, {
			includeControlPlane: false,
		});
	});
});
