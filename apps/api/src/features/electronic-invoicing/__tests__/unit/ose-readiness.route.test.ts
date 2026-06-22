import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OSEService } from "../../../../services/ose.service";
import { electronicInvoicingModule } from "../../index";

describe("electronicInvoicing OSE readiness route", () => {
	const app = new Elysia().use(electronicInvoicingModule);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("reports a ready provider when config is valid and provider is online", async () => {
		vi.spyOn(OSEService, "getConfig").mockReturnValue({
			provider: "nubefact",
			apiUrl: "https://api.nubefact.com/api/v1",
			apiToken: "token-ok",
			ruc: "20100070970",
			username: "SOLUSER",
			environment: "production",
			simulationMode: false,
			webhookSecret: "whsec",
		});
		vi.spyOn(OSEService, "checkStatus").mockResolvedValue({
			online: true,
			provider: "nubefact",
			message: "NubeFact online",
		});

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/ose/readiness"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				status: "ready",
				provider: "nubefact",
				environment: "production",
				online: true,
				configuration: {
					valid: true,
					missing: [],
					errors: [],
					hasApiToken: true,
					hasCompanyRuc: true,
				},
			},
		});
	});

	it("reports config_invalid when credentials are missing", async () => {
		vi.spyOn(OSEService, "getConfig").mockReturnValue({
			provider: "nubefact",
			apiUrl: "https://api.nubefact.com/api/v1",
			apiToken: "",
			ruc: "",
			username: "",
			environment: "sandbox",
			simulationMode: false,
			webhookSecret: "",
		});
		vi.spyOn(OSEService, "checkStatus").mockResolvedValue({
			online: false,
			provider: "nubefact",
			message: "Error: OSE not configured",
		});

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/ose/readiness"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				status: "config_invalid",
				online: false,
				configuration: {
					valid: false,
					missing: expect.arrayContaining([
						"OSE_API_TOKEN",
						"COMPANY_RUC",
						"OSE_USERNAME",
					]),
					hasApiToken: false,
					hasCompanyRuc: false,
				},
			},
		});
	});

	it("reports simulation explicitly when simulation mode is enabled", async () => {
		vi.spyOn(OSEService, "getConfig").mockReturnValue({
			provider: "nubefact",
			apiUrl: "",
			apiToken: "",
			ruc: "",
			username: "",
			environment: "sandbox",
			simulationMode: true,
			webhookSecret: "",
		});
		vi.spyOn(OSEService, "checkStatus").mockResolvedValue({
			online: true,
			provider: "simulation",
			message: "Simulation mode active",
		});

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/ose/readiness"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				status: "simulation",
				provider: "simulation",
				simulationMode: true,
				configuration: {
					valid: true,
				},
			},
		});
	});
});
