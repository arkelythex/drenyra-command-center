import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingWizard } from "../components/OnboardingWizard";

const mocks = vi.hoisted(() => ({ useOnboarding: vi.fn(), nextStep: vi.fn(), prevStep: vi.fn() }));
vi.mock("../hooks/useOnboarding", () => ({ useOnboarding: mocks.useOnboarding }));
vi.mock("../components/steps/CompanyStep", () => ({ CompanyStep: ({ onNext }: { onNext: () => void }) => <button type="button" onClick={onNext}>Continuar empresa</button> }));
vi.mock("../components/steps/CertificateStep", () => ({ CertificateStep: ({ onBack, onSkip }: { onBack: () => void; onSkip: () => void }) => <><button type="button" onClick={onBack}>Volver certificado</button><button type="button" onClick={onSkip}>Omitir certificado</button></> }));
vi.mock("../components/steps/BrandingStep", () => ({ BrandingStep: ({ onSubmit }: { onSubmit: () => void }) => <button type="button" onClick={onSubmit}>Finalizar marca</button> }));

function renderWizard(currentStep: "COMPANY" | "CERTIFICATE" | "BRANDING") {
	mocks.useOnboarding.mockReturnValue({ currentStep, formData: { taxRegime: "RMT" }, isSubmitting: false, updateData: vi.fn(), nextStep: mocks.nextStep, prevStep: mocks.prevStep, fetchRuc: vi.fn() });
	return render(<OnboardingWizard />);
}

describe("OnboardingWizard", () => {
	it("renders the onboarding heading and company step", () => {
		renderWizard("COMPANY");
		expect(screen.getByRole("heading", { name: "Activa Tu Entorno" })).toBeInTheDocument();
		expect(screen.getByText("Continuar empresa")).toBeInTheDocument();
	});
	it("advances from the company step", () => {
		renderWizard("COMPANY"); fireEvent.click(screen.getByText("Continuar empresa")); expect(mocks.nextStep).toHaveBeenCalledOnce();
	});
	it("supports navigating back from the certificate step", () => {
		renderWizard("CERTIFICATE"); fireEvent.click(screen.getByText("Volver certificado")); expect(mocks.prevStep).toHaveBeenCalledOnce();
	});
});
