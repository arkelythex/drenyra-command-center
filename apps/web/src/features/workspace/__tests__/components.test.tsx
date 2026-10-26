import { AccountingMissionStatus } from "@drenyra/mission-domain";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MissionActions } from "../components/mission/MissionActions";
import { MissionApprovalGate } from "../components/mission/MissionApprovalGate";
import { MissionBlockedState } from "../components/mission/MissionBlockedState";
import { MissionEvidenceBundle } from "../components/mission/MissionEvidenceBundle";
import { MissionHeader } from "../components/mission/MissionHeader";
import { MissionProgress } from "../components/mission/MissionProgress";
import { MissionReceipt } from "../components/mission/MissionReceipt";
import { MissionStateView } from "../components/mission/MissionStateView";
import { MissionUnknownState } from "../components/mission/MissionUnknownState";

describe("MissionHeader", () => {
	it("renders status label for RUNNING", () => {
		render(
			<MissionHeader
				status={AccountingMissionStatus.RUNNING}
				isMockMode={false}
				elapsedMs={5000}
			/>,
		);
		expect(screen.getByText("Ejecutando misión…")).toBeDefined();
	});

	it("renders status label for DRAFT", () => {
		render(
			<MissionHeader
				status={AccountingMissionStatus.DRAFT}
				isMockMode={false}
				elapsedMs={0}
			/>,
		);
		expect(screen.getByText("Borrador")).toBeDefined();
	});

	it("shows simulation badge when isMockMode is true", () => {
		render(
			<MissionHeader
				status={AccountingMissionStatus.RUNNING}
				isMockMode={true}
				elapsedMs={0}
			/>,
		);
		expect(screen.getByText("SIMULACIÓN")).toBeDefined();
	});

	it("does not show simulation badge when isMockMode is false", () => {
		render(
			<MissionHeader
				status={AccountingMissionStatus.RUNNING}
				isMockMode={false}
				elapsedMs={0}
			/>,
		);
		expect(screen.queryByText("SIMULACIÓN")).toBeNull();
	});

	it("shows spinner for RUNNING status", () => {
		const { container } = render(
			<MissionHeader
				status={AccountingMissionStatus.RUNNING}
				isMockMode={false}
				elapsedMs={0}
			/>,
		);
		expect(container.querySelector(".animate-spin")).toBeDefined();
	});
});

describe("MissionProgress", () => {
	it("renders progress bar with correct width", () => {
		render(<MissionProgress progress={5000} steps={[]} currentStep="" />);
		const bar = document.querySelector(".bg-\\[var\\(--accent\\)\\]");
		expect(bar).toBeDefined();
	});

	it("renders active step with spinner", () => {
		render(
			<MissionProgress
				progress={3000}
				steps={[{ id: "s1", name: "Analyze", status: "IN_PROGRESS" }]}
				currentStep="s1"
			/>,
		);
		expect(screen.getByText("Analyze")).toBeDefined();
	});

	it("renders completed step with check icon", () => {
		render(
			<MissionProgress
				progress={7000}
				steps={[{ id: "s1", name: "Done", status: "COMPLETED" }]}
				currentStep=""
			/>,
		);
		expect(screen.getByText("Done")).toBeDefined();
	});
});

describe("MissionBlockedState", () => {
	it("renders blocker with reason", () => {
		render(
			<MissionBlockedState
				blockers={[
					{
						id: "b1",
						reason: "Missing data",
						severity: "ERROR",
						occurredAt: "2026-01-01T00:00:00Z",
					},
				]}
				onRetry={vi.fn()}
			/>,
		);
		expect(screen.getByText("Missing data")).toBeDefined();
	});

	it("renders multiple blockers", () => {
		render(
			<MissionBlockedState
				blockers={[
					{ id: "b1", reason: "Error 1", severity: "ERROR", occurredAt: "t1" },
					{
						id: "b2",
						reason: "Error 2",
						severity: "WARNING",
						occurredAt: "t2",
					},
				]}
				onRetry={vi.fn()}
			/>,
		);
		expect(screen.getByText("Error 1")).toBeDefined();
		expect(screen.getByText("Error 2")).toBeDefined();
	});

	it("calls onRetry when retry button clicked", () => {
		const onRetry = vi.fn();
		render(
			<MissionBlockedState
				blockers={[
					{ id: "b1", reason: "Error", severity: "ERROR", occurredAt: "t" },
				]}
				onRetry={onRetry}
			/>,
		);
		fireEvent.click(screen.getByText("Reintentar"));
		expect(onRetry).toHaveBeenCalledOnce();
	});
});

describe("MissionUnknownState", () => {
	it("renders reconciliation buttons", () => {
		render(<MissionUnknownState onReconcile={vi.fn()} isSubmitting={false} />);
		expect(screen.getByText("Reanudar (RUNNING)")).toBeDefined();
		expect(screen.getByText("Marcar completado (COMPLETED)")).toBeDefined();
		expect(screen.getByText("Marcar fallido (FAILED)")).toBeDefined();
	});

	it("calls onReconcile with RUNNING when button clicked", () => {
		const onReconcile = vi.fn();
		render(
			<MissionUnknownState onReconcile={onReconcile} isSubmitting={false} />,
		);
		fireEvent.click(screen.getByText("Reanudar (RUNNING)"));
		expect(onReconcile).toHaveBeenCalledWith("RUNNING", "");
	});

	it("disables buttons when isSubmitting", () => {
		render(<MissionUnknownState onReconcile={vi.fn()} isSubmitting={true} />);
		const buttons = screen.getAllByRole("button");
		buttons.forEach((btn) => {
			expect((btn as HTMLButtonElement).disabled).toBe(true);
		});
	});
});

describe("MissionApprovalGate", () => {
	const mockProposal = {
		id: "p1",
		missionId: "m1",
		version: 2,
		evidence: [{ id: "e1", label: "Report", type: "report" }],
		evidenceHash: "abc123",
		summary: "Test proposal summary",
		riskLevel: "MEDIUM" as const,
		generatedAt: "2026-01-01T00:00:00Z",
	};

	it("renders proposal summary and version", () => {
		render(
			<MissionApprovalGate
				proposal={mockProposal}
				onApprove={vi.fn()}
				onReject={vi.fn()}
				isSubmitting={false}
			/>,
		);
		expect(screen.getByText("Test proposal summary")).toBeDefined();
		expect(screen.getAllByText("v2").length).toBeGreaterThan(0);
	});

	it("calls onApprove when approve button clicked", () => {
		const onApprove = vi.fn();
		render(
			<MissionApprovalGate
				proposal={mockProposal}
				onApprove={onApprove}
				onReject={vi.fn()}
				isSubmitting={false}
			/>,
		);
		fireEvent.click(screen.getByText("Aprobar"));
		expect(onApprove).toHaveBeenCalledOnce();
	});

	it("calls onReject with reason when reject button clicked", () => {
		const onReject = vi.fn();
		render(
			<MissionApprovalGate
				proposal={mockProposal}
				onApprove={vi.fn()}
				onReject={onReject}
				isSubmitting={false}
			/>,
		);
		const textarea = screen.getByPlaceholderText(
			"Motivo de rechazo (requerido)",
		);
		fireEvent.change(textarea, { target: { value: "Needs more work" } });
		fireEvent.click(screen.getByText("Rechazar"));
		expect(onReject).toHaveBeenCalledWith("Needs more work");
	});

	it("does not reject until a reason is written", () => {
		const onReject = vi.fn();
		render(
			<MissionApprovalGate
				proposal={mockProposal}
				onApprove={vi.fn()}
				onReject={onReject}
				isSubmitting={false}
			/>,
		);
		const reject = screen.getByRole("button", { name: /Rechazar/ });
		expect(reject).toBeDisabled();

		fireEvent.change(screen.getByLabelText("Motivo de rechazo"), {
			target: { value: "   " },
		});
		expect(reject).toBeDisabled();

		fireEvent.change(screen.getByLabelText("Motivo de rechazo"), {
			target: { value: "  Falta la depreciación de octubre  " },
		});
		fireEvent.click(reject);
		expect(onReject).toHaveBeenCalledWith("Falta la depreciación de octubre");
	});
});

describe("MissionEvidenceBundle", () => {
	it("renders evidence items with version", () => {
		render(
			<MissionEvidenceBundle
				evidence={[
					{ id: "e1", label: "Report A", type: "report" },
					{ id: "e2", label: "Calculation B", type: "calc" },
				]}
				version={3}
				evidenceHash="hash123"
			/>,
		);
		expect(screen.getByText("Report A")).toBeDefined();
		expect(screen.getByText("Calculation B")).toBeDefined();
		expect(screen.getByText("v3")).toBeDefined();
	});
});

describe("MissionReceipt", () => {
	it("shows the receipt id and its SHA-256 hash", () => {
		render(
			<MissionReceipt
				receiptId="rcpt-123-abc"
				receiptHash={"a".repeat(64)}
				onCopy={vi.fn()}
			/>,
		);
		expect(screen.getByTestId("receipt-id")).toHaveTextContent("rcpt-123-abc");
		expect(screen.getByTestId("receipt-hash")).toHaveTextContent(
			"a".repeat(64),
		);
	});

	it("copies the id and the hash separately", () => {
		const onCopy = vi.fn();
		render(
			<MissionReceipt
				receiptId="rcpt-123"
				receiptHash="sha256-hash"
				onCopy={onCopy}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Copiar ID del recibo" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Copiar hash del recibo" }),
		);
		expect(onCopy).toHaveBeenNthCalledWith(1, "rcpt-123");
		expect(onCopy).toHaveBeenNthCalledWith(2, "sha256-hash");
	});

	it("omits the hash row when the server sent none", () => {
		render(
			<MissionReceipt receiptId="rcpt-123" receiptHash="" onCopy={vi.fn()} />,
		);
		expect(screen.queryByTestId("receipt-hash")).not.toBeInTheDocument();
	});
});

describe("MissionActions", () => {
	it("shows Iniciar button when isReady and not started", () => {
		const onStart = vi.fn();
		render(
			<MissionActions
				status={AccountingMissionStatus.DRAFT}
				isReady={true}
				isAwaiting={false}
				isFinished={false}
				onStart={onStart}
				onReset={vi.fn()}
				onRequestRevision={vi.fn()}
			/>,
		);
		expect(screen.getByText("Iniciar misión")).toBeDefined();
	});

	it("shows Nueva misión when finished", () => {
		render(
			<MissionActions
				status={AccountingMissionStatus.COMPLETED}
				isReady={false}
				isAwaiting={false}
				isFinished={true}
				onStart={vi.fn()}
				onReset={vi.fn()}
				onRequestRevision={vi.fn()}
			/>,
		);
		expect(screen.getByText("Nueva misión")).toBeDefined();
	});

	it("shows Solicitar revisión when rejected", () => {
		render(
			<MissionActions
				status={AccountingMissionStatus.REJECTED}
				isReady={false}
				isAwaiting={false}
				isFinished={false}
				onStart={vi.fn()}
				onReset={vi.fn()}
				onRequestRevision={vi.fn()}
			/>,
		);
		expect(screen.getByText("Solicitar revisión")).toBeDefined();
	});

	it("calls onStart when Iniciar clicked", () => {
		const onStart = vi.fn();
		render(
			<MissionActions
				status={AccountingMissionStatus.DRAFT}
				isReady={true}
				isAwaiting={false}
				isFinished={false}
				onStart={onStart}
				onReset={vi.fn()}
				onRequestRevision={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Iniciar misión"));
		expect(onStart).toHaveBeenCalledOnce();
	});
});

describe("MissionStateView", () => {
	it("renders DRAFT state message", () => {
		render(
			<MissionStateView
				status={AccountingMissionStatus.DRAFT}
				progress={0}
				steps={[]}
				currentStep=""
				blockers={[]}
				proposal={null}
				rejection={null}
				receiptId={null}
				receiptHash={null}
				isSubmitting={false}
				onApprove={vi.fn()}
				onReject={vi.fn()}
				onReconcile={vi.fn()}
				onRetry={vi.fn()}
			/>,
		);
		expect(screen.getByText(/Listo para iniciar/)).toBeDefined();
	});

	it("renders COMPLETED state message", () => {
		render(
			<MissionStateView
				status={AccountingMissionStatus.COMPLETED}
				progress={10000}
				steps={[]}
				currentStep=""
				blockers={[]}
				proposal={null}
				rejection={null}
				receiptId="rcpt-1"
				receiptHash="h1"
				isSubmitting={false}
				onApprove={vi.fn()}
				onReject={vi.fn()}
				onReconcile={vi.fn()}
				onRetry={vi.fn()}
			/>,
		);
		expect(screen.getByText(/Misión completada/)).toBeDefined();
	});

	it("renders FAILED state message", () => {
		render(
			<MissionStateView
				status={AccountingMissionStatus.FAILED}
				progress={0}
				steps={[]}
				currentStep=""
				blockers={[]}
				proposal={null}
				rejection={null}
				receiptId={null}
				receiptHash={null}
				isSubmitting={false}
				onApprove={vi.fn()}
				onReject={vi.fn()}
				onReconcile={vi.fn()}
				onRetry={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: /la misión no pudo completarse/i }),
		).toBeDefined();
		expect(screen.getByRole("button", { name: "Reintentar" })).toBeDefined();
	});
});
