import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OseReadinessCard } from "../OseReadinessCard";

describe("OseReadinessCard", () => {
	it("renders the ready state for a live provider", () => {
		render(
			<OseReadinessCard
				isLoading={false}
				isError={false}
				readiness={{
					status: "ready",
					provider: "nubefact",
					environment: "production",
					simulationMode: false,
					online: true,
					message: "NubeFact online",
					configuration: {
						valid: true,
						missing: [],
						errors: [],
						hasApiUrl: true,
						hasApiToken: true,
						hasCompanyRuc: true,
						hasUsername: true,
						hasWebhookSecret: true,
					},
				}}
			/>,
		);

		expect(
			screen.getByText("Proveedor OSE listo para producción"),
		).toBeInTheDocument();
		expect(screen.getByText("Operativo")).toBeInTheDocument();
		expect(screen.getByText("Nubefact")).toBeInTheDocument();
	});

	it("renders the simulation state explicitly for demo environments", () => {
		render(
			<OseReadinessCard
				isLoading={false}
				isError={false}
				readiness={{
					status: "simulation",
					provider: "simulation",
					environment: "sandbox",
					simulationMode: true,
					online: true,
					message: "Simulation mode active",
					configuration: {
						valid: true,
						missing: [],
						errors: [],
						hasApiUrl: false,
						hasApiToken: false,
						hasCompanyRuc: false,
						hasUsername: false,
						hasWebhookSecret: false,
					},
				}}
			/>,
		);

		expect(
			screen.getByText("Proveedor OSE en modo simulación"),
		).toBeInTheDocument();
		expect(screen.getByText("Demo")).toBeInTheDocument();
	});
});
