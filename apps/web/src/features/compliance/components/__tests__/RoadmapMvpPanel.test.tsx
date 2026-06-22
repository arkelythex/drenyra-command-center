import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoadmapMvpPanel } from "../RoadmapMvpPanel";

const runActionMock = vi.fn(async () => undefined);
const decideMock = vi.fn(async () => undefined);
const openTimelineMock = vi.fn(() => undefined);

vi.mock("../../hooks/useRoadmapMvp", () => ({
	useRoadmapMvp: () => ({
		snapshot: {
			companyId: "cmp-1",
			period: "2026-03",
			generatedAt: "2026-03-20T10:00:00.000Z",
			phase1: {
				objective: "Most reliable accounting operation in Peru",
				reliabilityScore: 92.4,
				sunatStatus: "COMPLIANT",
				blockingIssues: 1,
				openIssues: 3,
				ledgerReproducible: true,
				reproducibilityCoverage: "COMPLETE_DATA",
				differences: {
					recordCount: 0,
					totalAmount: 0,
					totalIGV: 0,
				},
				nextFocus: ["Close critical and high-severity compliance findings."],
			},
			phase2: {
				objective: "Accounting copilot with actionable automation",
				insightScore: 85,
				periodIncome: 21000,
				periodExpense: 18000,
				cashflowGap: 3000,
				overdueInvoices: 2,
				pendingSunatInvoices: 4,
				recommendedActions: [
					{
						id: "prepare-sire",
						traceId: "trace-0001",
						recommendedAt: "2026-03-20T10:00:00.000Z",
						title: "Prepare SIRE package with approval gate",
						description: "4 SUNAT-pending documents detected.",
						impact: "Reduces filing risk.",
						confidence: 0.91,
						automationLevel: "one-click",
					},
					{
						id: "collect-overdue-invoices",
						traceId: "trace-0002",
						recommendedAt: "2026-03-20T10:00:00.000Z",
						title: "Collect overdue invoices",
						description: "2 invoices overdue for 30+ days.",
						impact: "Improves cashflow.",
						confidence: 0.78,
						automationLevel: "review-required",
					},
				],
			},
		},
		isLoading: false,
		isError: false,
		runAction: runActionMock,
		lastRunResult: null,
		runningActionId: null,
		isRunning: false,
		period: "2026-03",
	}),
}));

vi.mock("../../hooks/useHitlDecision", () => ({
	useHitlDecision: () => ({
		decide: decideMock,
		lastResult: null,
		isDeciding: false,
		error: null,
		decidingActionId: null,
	}),
}));

vi.mock("../../hooks/useTimeline", () => ({
	useTimeline: () => ({
		timeline: null,
		isLoading: false,
		isError: false,
		selectedTraceId: null,
		openTimeline: openTimelineMock,
		closeTimeline: vi.fn(),
	}),
}));

describe("RoadmapMvpPanel", () => {
	it("renders both phase metrics and recommended actions", () => {
		render(<RoadmapMvpPanel />);

		expect(screen.getByText("Roadmap MVP en ejecución")).toBeInTheDocument();
		expect(screen.getByText("92.4%")).toBeInTheDocument();
		expect(screen.getByText("85.0%")).toBeInTheDocument();
		expect(
			screen.getByText("Prepare SIRE package with approval gate"),
		).toBeInTheDocument();
	});

	it("shows Ejecutar button for one-click actions", () => {
		render(<RoadmapMvpPanel />);
		expect(
			screen.getByRole("button", { name: /ejecutar/i }),
		).toBeInTheDocument();
	});

	it("shows HITL buttons for review-required actions", () => {
		render(<RoadmapMvpPanel />);
		expect(
			screen.getByRole("button", { name: /aprobar/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /rechazar/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /escalar/i }),
		).toBeInTheDocument();
	});

	it("runs one-click action when Ejecutar button is pressed", () => {
		render(<RoadmapMvpPanel />);
		fireEvent.click(screen.getByRole("button", { name: /ejecutar/i }));
		expect(runActionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "prepare-sire",
				traceId: "trace-0001",
			}),
		);
	});
});
