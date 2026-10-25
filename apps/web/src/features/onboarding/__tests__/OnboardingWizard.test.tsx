import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	setSession: vi.fn(),
	registerCompany: vi.fn(),
	lookupRuc: vi.fn(),
	readAuthSessionSnapshot: vi.fn(),
	syncActiveCompanyContextFromUser: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mocks.navigate,
}));
vi.mock("@/features/auth/hooks/useAuth", () => ({
	useAuthStore: () => ({
		user: { ruc: "20100000017" },
		setSession: mocks.setSession,
	}),
}));
vi.mock("@/features/auth/lib/auth-session-snapshot", () => ({
	readAuthSessionSnapshot: mocks.readAuthSessionSnapshot,
}));
vi.mock("@/lib/company-context", () => ({
	syncActiveCompanyContextFromUser: mocks.syncActiveCompanyContextFromUser,
}));
vi.mock("../services/company-onboarding", async (importOriginal) => ({
	...(await importOriginal<object>()),
	registerCompany: mocks.registerCompany,
	lookupRuc: mocks.lookupRuc,
}));

import { OnboardingWizard } from "../components/OnboardingWizard";
import { CompanyOnboardingError } from "../services/company-onboarding";

const SESSION = {
	session: { id: "s-1" },
	user: { id: "u-1", activeCompanyId: "cmp-1" },
};

describe("OnboardingWizard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.lookupRuc.mockResolvedValue({
			legalName: "ANDINA S.A.C.",
			address: "AV. LIMA 1",
		});
		mocks.readAuthSessionSnapshot.mockResolvedValue(SESSION);
	});

	it("starts from the RUC given at signup and fills SUNAT's data", async () => {
		render(<OnboardingWizard />);

		const ruc = screen.getByLabelText("RUC");
		expect(ruc).toHaveValue("20100000017");
		fireEvent.blur(ruc);

		await waitFor(() =>
			expect(screen.getByLabelText("Razón social")).toHaveValue(
				"ANDINA S.A.C.",
			),
		);
		expect(screen.getByLabelText("Dirección fiscal (opcional)")).toHaveValue(
			"AV. LIMA 1",
		);
	});

	it("registers the company, reloads the session and enters the app", async () => {
		mocks.registerCompany.mockResolvedValue({
			companyId: "cmp-1",
			companyName: "ANDINA S.A.C.",
		});
		render(<OnboardingWizard />);
		fireEvent.change(screen.getByLabelText("Razón social"), {
			target: { value: "ANDINA S.A.C." },
		});

		fireEvent.click(screen.getByRole("button", { name: "Registrar empresa" }));

		await waitFor(() =>
			expect(mocks.navigate).toHaveBeenCalledWith({ to: "/cierre-mensual" }),
		);
		expect(mocks.registerCompany).toHaveBeenCalledWith({
			ruc: "20100000017",
			businessName: "ANDINA S.A.C.",
			address: undefined,
		});
		expect(mocks.setSession).toHaveBeenCalledWith(SESSION);
		expect(mocks.syncActiveCompanyContextFromUser).toHaveBeenCalledWith(
			SESSION.user,
		);
	});

	it("shows why a taken RUC was refused and stays", async () => {
		mocks.registerCompany.mockRejectedValue(
			new CompanyOnboardingError(
				"Esta empresa ya está registrada. Pide a su administrador que te invite.",
				"RUC_TAKEN",
			),
		);
		render(<OnboardingWizard />);
		fireEvent.change(screen.getByLabelText("Razón social"), {
			target: { value: "OTRA" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Registrar empresa" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Pide a su administrador que te invite",
		);
		expect(mocks.navigate).not.toHaveBeenCalled();
	});

	it("does not submit without a business name", () => {
		render(<OnboardingWizard />);

		expect(
			screen.getByRole("button", { name: "Registrar empresa" }),
		).toBeDisabled();
	});
});
