import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolApprovalCard } from "../ToolApprovalCard";

describe("ToolApprovalCard", () => {
	it("shows representative supervised metadata when available", () => {
		render(
			<ToolApprovalCard
				approval={{
					runId: "run-ai-1",
					toolCallId: "tool-1",
					name: "crear_asiento",
					args: {},
				}}
				supervisedRun={{
					id: "job-run-1",
					companyId: "cmp-1",
					countryCode: "pe",
					jobId: "prepare-sire",
					jobTitle: "Preparar SIRE",
					jobCategory: "compliance",
					status: "AWAITING_APPROVAL",
					approvalRequired: true,
					requestedBy: "user-1",
					approvedBy: null,
					prompt: "Preparar SIRE",
					summary: null,
					inputPayload: {},
					resultPayload: null,
					evidencePayload: null,
					startedAt: "2026-04-01T00:00:00.000Z",
					completedAt: null,
					createdAt: "2026-04-01T00:00:00.000Z",
					updatedAt: "2026-04-01T00:00:00.000Z",
					controlPlane: {
						traceId: "trace-1234",
						surfaceId: "prepare-sire",
						surface: {
							title: "Preparar SIRE",
						},
						approvalState: "pending",
						retrievalMode: "hybrid-documentary",
						evaluationSummary: null,
						trace: [],
						documentarySources: [{ source: "sunat-manual" }],
						representativePath: true,
					},
				}}
				onApprove={vi.fn().mockResolvedValue(undefined)}
				onDeny={vi.fn().mockResolvedValue(undefined)}
			/>,
		);

		expect(screen.getByText("Preparar SIRE")).toBeInTheDocument();
		expect(screen.getByText(/hybrid-documentary/i)).toBeInTheDocument();
		expect(
			screen.getByText(/Evidencia documental visible: 1 fuente/i),
		).toBeInTheDocument();
	});
});
