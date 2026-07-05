import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "../DashboardView";

const {
	dashboardActionsState,
	setShowScannerMock,
	setIsInviteModalOpenMock,
	handleActionMock,
} = vi.hoisted(() => ({
	dashboardActionsState: {
		showScanner: false,
		isInviteModalOpen: false,
	},
	setShowScannerMock: vi.fn(),
	setIsInviteModalOpenMock: vi.fn(),
	handleActionMock: vi.fn(),
}));

vi.mock("../layout/DashboardHeader", () => ({
	DashboardHeader: () => <header data-testid="dashboard-header-mock" />,
}));

vi.mock("../sections/SummaryTabContent", () => ({
	SummaryTabContent: () => <section data-testid="summary-tab-content-mock" />,
}));

vi.mock("../InviteMemberModal", () => ({
	InviteMemberModal: () => <div data-testid="invite-member-modal-mock" />,
}));

vi.mock("../MobileFinancialSummary", () => ({
	MobileFinancialSummary: () => (
		<div data-testid="mobile-financial-summary-mock" />
	),
}));

vi.mock("../../../invoices/components/MobileInvoiceScanner", () => ({
	MobileInvoiceScanner: () => <div data-testid="mobile-invoice-scanner-mock" />,
}));

vi.mock("@/components/ui/floating-action-button", () => ({
	FloatingActionButton: () => <button type="button">FAB mock</button>,
}));

vi.mock("../../hooks/useDashboardNavigation", () => ({
	useDashboardNavigation: () => ({
		selectedDate: new Date("2026-05-01T00:00:00.000Z"),
		handlePreviousMonth: vi.fn(),
		handleNextMonth: vi.fn(),
		handleMonthSelect: vi.fn(),
		availableMonths: [],
		isNextMonthDisabled: false,
	}),
}));

vi.mock("../../hooks/useDashboardActions", () => ({
	useDashboardActions: () => ({
		showScanner: dashboardActionsState.showScanner,
		setShowScanner: setShowScannerMock,
		isInviteModalOpen: dashboardActionsState.isInviteModalOpen,
		setIsInviteModalOpen: setIsInviteModalOpenMock,
		handleAction: handleActionMock,
	}),
}));

vi.mock("../../hooks/useDashboardData", () => ({
	useDashboardData: () => ({
		financials: {
			outstanding: "1200",
			growth: 8,
		},
		health: {
			complianceScore: 92,
		},
	}),
}));

function mockDashboardViewport(isMobile: boolean) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: isMobile,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

function mockLegacyDashboardViewport(isMobile: boolean) {
	const addListener = vi.fn();
	const removeListener = vi.fn();

	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: isMobile,
		media: query,
		onchange: null,
		addListener,
		removeListener,
		dispatchEvent: vi.fn(),
	}));

	return { addListener, removeListener };
}

describe("DashboardView", () => {
	beforeEach(() => {
		dashboardActionsState.showScanner = false;
		dashboardActionsState.isInviteModalOpen = false;
		vi.clearAllMocks();
		mockDashboardViewport(false);
	});

	it("keeps mobile-only dashboard code out of the desktop render path", () => {
		render(<DashboardView />);

		expect(screen.getByTestId("dashboard-header-mock")).toBeInTheDocument();
		expect(screen.getByTestId("summary-tab-content-mock")).toBeInTheDocument();
		expect(
			screen.queryByTestId("mobile-financial-summary-mock"),
		).not.toBeInTheDocument();
	});

	it("falls back to the desktop path when matchMedia is unavailable", () => {
		Object.defineProperty(window, "matchMedia", {
			configurable: true,
			value: undefined,
			writable: true,
		});

		render(<DashboardView />);

		expect(screen.getByTestId("dashboard-header-mock")).toBeInTheDocument();
		expect(
			screen.queryByTestId("mobile-financial-summary-mock"),
		).not.toBeInTheDocument();
	});

	it("renders the mobile summary path only for mobile viewports", async () => {
		mockDashboardViewport(true);

		render(<DashboardView />);

		expect(
			await screen.findByTestId("mobile-financial-summary-mock"),
		).toBeInTheDocument();
		expect(
			screen.queryByTestId("dashboard-header-mock"),
		).not.toBeInTheDocument();
	});

	it("supports legacy matchMedia listener APIs", () => {
		const listeners = mockLegacyDashboardViewport(false);

		const { unmount } = render(<DashboardView />);

		expect(screen.getByTestId("dashboard-header-mock")).toBeInTheDocument();
		expect(listeners.addListener).toHaveBeenCalledTimes(1);

		unmount();

		expect(listeners.removeListener).toHaveBeenCalledTimes(1);
	});

	it("loads optional scanner and invite surfaces only when opened", async () => {
		dashboardActionsState.showScanner = true;
		dashboardActionsState.isInviteModalOpen = true;

		render(<DashboardView />);

		expect(
			await screen.findByTestId("invite-member-modal-mock"),
		).toBeInTheDocument();
		expect(
			await screen.findByTestId("mobile-invoice-scanner-mock"),
		).toBeInTheDocument();
	});
});
