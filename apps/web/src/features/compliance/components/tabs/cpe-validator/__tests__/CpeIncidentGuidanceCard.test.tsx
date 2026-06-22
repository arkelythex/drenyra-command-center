import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CpeIncidentGuidanceCard } from "../CpeIncidentGuidanceCard";
import type { CpeErrorCatalogItem } from "../../../../hooks/useCpeErrorCatalog";
import type { CpeValidationOutcome } from "../../../../hooks/useCpeValidation";

const baseRow = {
	id: "c3",
	document: "B002-000087",
	provider: "SERVICIOS LOGISTICOS",
	amount: 850,
	date: "2025-08-12",
	status: "RECHAZADO" as const,
	hasCDR: true,
	detraction: false,
	sunatCode: "2320",
};

const baseGuidance: CpeErrorCatalogItem = {
	state: "RECHAZADO",
	code: "2320",
	incidentCategory: "SUNAT_REJECTED",
	severity: "high",
	summary: "SUNAT rechazo el comprobante.",
	defaultErrorMessage: "RUC no valido",
	supportMessage: "Corrige el RUC emisor.",
	recommendedActions: ["Verifica el RUC", "Actualiza la configuracion tributaria"],
};

function buildValidation(
	category: string,
	overrides?: Partial<CpeValidationOutcome>,
): CpeValidationOutcome {
	return {
		success: false,
		statusCode: 400,
		error: "Validation failed",
		code: "2320",
		supportMessage: "Mensaje de soporte validado",
		data: {
			isValid: false,
			status: "REJECTED_SUNAT",
			durationMs: 123,
			validationSource: "sunat_sandbox",
			incident: {
				isIncident: true,
				category,
				severity: "high",
				summary: `Resumen ${category}`,
				supportMessage: "Mensaje de soporte validado",
			},
		},
		...overrides,
	};
}

describe("CpeIncidentGuidanceCard", () => {
	it("shows the observed tone badge for observed incidents", () => {
		render(
			<CpeIncidentGuidanceCard
				selectedRow={baseRow}
				guidance={{ ...baseGuidance, state: "OBSERVADO", code: "0101", incidentCategory: "SUNAT_OBSERVED" }}
				validation={buildValidation("SUNAT_OBSERVED", { code: "0101" })}
				isLoading={false}
				isError={false}
				onRetry={vi.fn()}
				onValidate={vi.fn()}
				isValidating={false}
			/>,
		);

		const badge = screen.getByText("Observado");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("text-warning");
		expect(screen.getByText("Resumen SUNAT_OBSERVED")).toBeInTheDocument();
	});

	it("shows the not-found tone badge for missing CPE incidents", () => {
		render(
			<CpeIncidentGuidanceCard
				selectedRow={{ ...baseRow, sunatCode: "4040" }}
				guidance={{ ...baseGuidance, state: "NO_EXISTE", code: "4040", incidentCategory: "SUNAT_NOT_FOUND" }}
				validation={buildValidation("SUNAT_NOT_FOUND", { code: "4040" })}
				isLoading={false}
				isError={false}
				onRetry={vi.fn()}
				onValidate={vi.fn()}
				isValidating={false}
			/>,
		);

		const badge = screen.getByText("No Existe");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("text-warning");
	});

	it("shows the success tone and no-actions message when validation succeeds", () => {
		render(
			<CpeIncidentGuidanceCard
				selectedRow={baseRow}
				guidance={undefined}
				validation={{
					success: true,
					statusCode: 200,
					data: {
						isValid: true,
						status: "VALID",
						durationMs: 42,
						validationSource: "sunat_sandbox",
						incident: {
							isIncident: false,
							category: "NONE",
							severity: "low",
							summary: "Sin incidentes",
						},
					},
				}}
				isLoading={false}
				isError={false}
				onRetry={vi.fn()}
				onValidate={vi.fn()}
				isValidating={false}
			/>,
		);

		const badge = screen.getByText("Sin Incidente");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("text-success");
		expect(
			screen.getByText(
				"Comprobante validado sin incidentes operativos. No se requieren acciones guiadas.",
			),
		).toBeInTheDocument();
	});
});
