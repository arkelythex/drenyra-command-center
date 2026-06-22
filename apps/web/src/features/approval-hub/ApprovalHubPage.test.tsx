import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApprovalHubPage } from "./ApprovalHubPage";
import type { DrenyraApproval } from "@/features/drenyra-workspace";

const { useDrenyraApprovalsMock, getAuthStateMock, approveMock, rejectMock } =
	vi.hoisted(() => ({
		useDrenyraApprovalsMock: vi.fn(),
		getAuthStateMock: vi.fn(),
		approveMock: vi.fn(),
		rejectMock: vi.fn(),
	}));

vi.mock("@/features/drenyra-workspace", async () => {
	const actual = await vi.importActual("@/features/drenyra-workspace");
	return {
		...actual,
		useDrenyraApprovals: useDrenyraApprovalsMock,
	};
});

vi.mock("@/features/auth/hooks/useAuth", () => ({
	useAuthStore: {
		getState: getAuthStateMock,
	},
}));

const PENDING_APPROVAL: DrenyraApproval = {
	id: "approval-1",
	toolName: "fiscal-guard",
	summary: "Validar detracción proveedor",
	module: "compliance",
	approvalLevel: "fiscal_gate",
	state: "proposed",
	proposedAt: "2026-05-01T10:00:00.000Z",
	companyId: "ACME SAC",
	ruc: "20123456789",
};

function mockApprovalsState(partial?: {
	approvals?: DrenyraApproval[];
	isLoading?: boolean;
}) {
	useDrenyraApprovalsMock.mockReturnValue({
		approvals: partial?.approvals ?? [PENDING_APPROVAL],
		isLoading: partial?.isLoading ?? false,
		approve: approveMock,
		reject: rejectMock,
	});
}

describe("ApprovalHubPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		approveMock.mockResolvedValue(undefined);
		rejectMock.mockResolvedValue(undefined);
		getAuthStateMock.mockReturnValue({ user: { id: "reviewer-42" } });
		mockApprovalsState();
	});

	it("renders pending approval cards with actions", () => {
		render(<ApprovalHubPage />);

		expect(screen.getByText("Centro de Aprobaciones")).toBeInTheDocument();
		expect(
			screen.getByText("Validar detracción proveedor"),
		).toBeInTheDocument();
		expect(screen.getByText(/RUC 20123456789/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Rechazar" }),
		).toBeInTheDocument();
	});

	it("triggers approve with approval id, authenticated user and reviewer role", async () => {
		const user = userEvent.setup();
		render(<ApprovalHubPage />);

		await user.click(screen.getByRole("button", { name: "Aprobar" }));

		expect(approveMock).toHaveBeenCalledTimes(1);
		expect(approveMock).toHaveBeenCalledWith(
			"approval-1",
			"reviewer-42",
			"reviewer",
		);
	});

	it("triggers reject with approval id, authenticated user and default rationale", async () => {
		const user = userEvent.setup();
		render(<ApprovalHubPage />);

		await user.click(screen.getByRole("button", { name: "Rechazar" }));

		expect(rejectMock).toHaveBeenCalledTimes(1);
		expect(rejectMock).toHaveBeenCalledWith(
			"approval-1",
			"reviewer-42",
			"Rechazado por usuario",
		);
	});

	it("shows loading UI while fetching approvals", () => {
		mockApprovalsState({ approvals: [], isLoading: true });
		render(<ApprovalHubPage />);

		expect(screen.getByText("Cargando aprobaciones...")).toBeInTheDocument();
	});

	it("handles failed approve call without breaking the page", async () => {
		const user = userEvent.setup();
		approveMock.mockRejectedValueOnce(new Error("approve failed"));
		render(<ApprovalHubPage />);

		await user.click(screen.getByRole("button", { name: "Aprobar" }));

		expect(approveMock).toHaveBeenCalledWith(
			"approval-1",
			"reviewer-42",
			"reviewer",
		);
		expect(
			screen.getByText("Validar detracción proveedor"),
		).toBeInTheDocument();
	});

	it("handles failed reject call without breaking the page", async () => {
		const user = userEvent.setup();
		rejectMock.mockRejectedValueOnce(new Error("reject failed"));
		render(<ApprovalHubPage />);

		await user.click(screen.getByRole("button", { name: "Rechazar" }));

		expect(rejectMock).toHaveBeenCalledWith(
			"approval-1",
			"reviewer-42",
			"Rechazado por usuario",
		);
		expect(
			screen.getByText("Validar detracción proveedor"),
		).toBeInTheDocument();
	});

	it("renders empty state when no approvals are pending", () => {
		mockApprovalsState({ approvals: [] });
		render(<ApprovalHubPage />);

		expect(screen.getByText("Sin aprobaciones pendientes")).toBeInTheDocument();
		expect(
			screen.getByText("Todas las acciones han sido revisadas."),
		).toBeInTheDocument();
	});

	it("falls back to current-user when auth state has no user", async () => {
		const user = userEvent.setup();
		getAuthStateMock.mockReturnValue({ user: null });
		render(<ApprovalHubPage />);

		await user.click(screen.getByRole("button", { name: "Aprobar" }));

		expect(approveMock).toHaveBeenCalledWith(
			"approval-1",
			"current-user",
			"reviewer",
		);
	});
});
