import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		companyId: "company-1",
		year: "2026",
		month: "09",
		intent: "monthly-close",
	}),
}));
vi.mock("@/context/InspectorContext", () => ({
	useInspector: () => ({ open: vi.fn() }),
}));
vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: {
			companyId: "company-1",
			companyName: "Arkelythex SAC",
			ruc: "20123456789",
			countryCode: "PE",
		},
	}),
}));

import { CierreMensualPage } from "../CierreMensualPage";

const mission = {
	missionId: null,
	status: "DRAFT",
	progress: 0,
	steps: [],
	currentStep: "",
	blockers: [],
	proposal: null,
	version: 0,
	rejection: null,
	receiptId: null,
	receiptHash: null,
	error: null,
	isMockMode: false,
	lastEventSequence: 0,
	isReady: true,
	isAwaiting: false,
	isFinished: false,
	approve: vi.fn(),
} as unknown as Parameters<typeof CierreMensualPage>[0]["mission"];

describe("CierreMensualPage", () => {
	it("shows the active company's real name and RUC", () => {
		render(<CierreMensualPage mission={mission} />);

		expect(screen.getAllByText(/Arkelythex SAC/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/20123456789/).length).toBeGreaterThan(0);
		expect(screen.queryByText(/Empresa company-1/)).toBeNull();
	});

	it("does not show invented evidence counts or verified tax checks", () => {
		const { container } = render(<CierreMensualPage mission={mission} />);

		expect(container.textContent).not.toMatch(/\d+ ev\./);
		expect(screen.queryByText("Verificado")).toBeNull();
	});
});
