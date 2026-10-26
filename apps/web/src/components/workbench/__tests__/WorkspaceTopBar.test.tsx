import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigate, setActiveCompanyById, setActiveFiscalPeriod } = vi.hoisted(
	() => ({
		navigate: vi.fn(),
		setActiveCompanyById: vi.fn().mockReturnValue(true),
		setActiveFiscalPeriod: vi.fn(),
	}),
);

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
	useParams: () => ({
		companyId: "c1",
		year: "2026",
		month: "09",
		intent: "monthly-close",
	}),
}));
vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: {
			companyId: "c1",
			companyName: "Andina S.A.C.",
			ruc: "20123456789",
			countryCode: "PE",
		},
		availableCompanies: [
			{
				companyId: "c1",
				companyName: "Andina S.A.C.",
				ruc: "20123456789",
				countryCode: "PE",
			},
			{
				companyId: "c2",
				companyName: "Pacífico E.I.R.L.",
				ruc: "20987654321",
				countryCode: "PE",
			},
		],
		fiscalPeriod: "2026-09",
		availablePeriods: ["2026-09", "2026-08"],
		formatFiscalPeriodLabel: (p: string) => `Período ${p}`,
		setActiveCompanyById,
		setActiveFiscalPeriod,
	}),
}));

import { WorkspaceTopBar } from "../WorkspaceTopBar";

beforeEach(() => vi.clearAllMocks());

describe("WorkspaceTopBar", () => {
	it("offers only the companies the session granted", async () => {
		const { container } = render(<WorkspaceTopBar />);
		fireEvent.keyDown(screen.getByRole("button", { name: /andina/i }), {
			key: "ArrowDown",
		});

		expect(
			await screen.findByRole("menuitemradio", { name: /pacífico/i }),
		).toBeInTheDocument();
		expect(container.ownerDocument.body.textContent).not.toMatch(
			/arkelythex|otra empresa/i,
		);
	});

	it("switching company activates it and reopens the same period there", async () => {
		render(<WorkspaceTopBar />);
		fireEvent.keyDown(screen.getByRole("button", { name: /andina/i }), {
			key: "ArrowDown",
		});
		fireEvent.click(
			await screen.findByRole("menuitemradio", { name: /pacífico/i }),
		);

		expect(setActiveCompanyById).toHaveBeenCalledWith("c2");
		expect(navigate).toHaveBeenCalledWith({
			to: "/workspace/$companyId/$year/$month/$intent",
			params: {
				companyId: "c2",
				year: "2026",
				month: "09",
				intent: "monthly-close",
			},
		});
	});

	it("switching period keeps the company and navigates to that month", () => {
		render(<WorkspaceTopBar />);
		fireEvent.change(screen.getByLabelText("Período fiscal"), {
			target: { value: "2026-08" },
		});

		expect(setActiveFiscalPeriod).toHaveBeenCalledWith("2026-08");
		expect(navigate).toHaveBeenCalledWith({
			to: "/workspace/$companyId/$year/$month/$intent",
			params: {
				companyId: "c1",
				year: "2026",
				month: "08",
				intent: "monthly-close",
			},
		});
	});

	it("does not offer intents that have no screen", () => {
		render(<WorkspaceTopBar />);
		expect(screen.queryByText("Investigar")).toBeNull();
		expect(screen.queryByText("Reportes")).toBeNull();
	});
});
