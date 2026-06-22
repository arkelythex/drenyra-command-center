import { afterEach, describe, expect, it } from "vitest";
import { CpeNumber } from "../domain/value-objects/cpe-number.vo";
import { Ruc } from "../domain/value-objects/ruc.vo";
import { SunatCpeClient } from "../infrastructure/sunat-cpe-client";

const request = {
	ruc: Ruc.create("20100070970"),
	cpeNumber: CpeNumber.create("F001-00001234"),
	issueDate: "2026-02-20",
	totalAmount: 1000,
};

describe("SunatCpeClient", () => {
	afterEach(() => {
		delete process.env.SUNAT_CPE_VALIDATION_MODE;
		delete process.env.SUNAT_CPE_API_TOKEN;
	});

	it("keeps simulation as a sandbox alias", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "simulation";

		const client = new SunatCpeClient();
		const response = await client.validate(request);

		expect(response.estado).toBe("ACEPTADO");
		expect(response.mode).toBe("sandbox");
	});

	it("loads observed responses from replay fixtures", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "replay";

		const client = new SunatCpeClient();
		const response = await client.validate({
			...request,
			cpeNumber: CpeNumber.create("F001-00007777"),
		});

		expect(response.estado).toBe("OBSERVADO");
		expect(response.mode).toBe("replay");
		expect(response.observaciones?.length).toBeGreaterThan(0);
	});

	it("returns missing responses in sandbox mode for deterministic demos", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "simulation";

		const client = new SunatCpeClient();
		const response = await client.validate({
			...request,
			cpeNumber: CpeNumber.create("F001-00006666"),
		});

		expect(response.estado).toBe("NO_EXISTE");
		expect(response.mode).toBe("sandbox");
		expect(response.codigoRespuesta).toBe("4040");
	});

	it("loads missing responses from replay fixtures", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "replay";

		const client = new SunatCpeClient();
		const response = await client.validate({
			...request,
			cpeNumber: CpeNumber.create("F001-00006666"),
		});

		expect(response.estado).toBe("NO_EXISTE");
		expect(response.mode).toBe("replay");
		expect(response.codigoRespuesta).toBe("4040");
	});

	it("maps non-accepted SUNAT states to explicit validation errors", () => {
		const client = new SunatCpeClient();

		expect(
			client.mapToErrors({
				success: true,
				estado: "OBSERVADO",
				mensaje: "Comprobante con observaciones",
				codigoRespuesta: "0101",
				observaciones: ["Revisar tributos"],
			}),
		).toEqual([
			{ code: "0101", message: "Comprobante con observaciones" },
			{ code: "SUNAT_OBSERVATION", message: "Revisar tributos" },
		]);

		expect(
			client.mapToErrors({
				success: false,
				estado: "NO_EXISTE",
				mensaje: "No encontrado",
				codigoRespuesta: "4040",
			}),
		).toEqual([{ code: "4040", message: "No encontrado" }]);

		expect(
			client.mapToErrors({
				success: true,
				estado: "ANULADO",
				mensaje: "Anulado",
				codigoRespuesta: "0",
			}),
		).toEqual([{ code: "0", message: "Anulado" }]);
	});

	it("falls back to the catalog default message when SUNAT omits one", () => {
		const client = new SunatCpeClient();

		expect(
			client.mapToErrors({
				success: false,
				estado: "RECHAZADO",
				codigoRespuesta: "2320",
			}),
		).toEqual([{ code: "2320", message: "RUC no valido" }]);
	});

	it("requires a token when real mode is selected", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "real";

		const client = new SunatCpeClient();

		await expect(client.validate(request)).rejects.toThrow(
			"SUNAT_CPE_API_TOKEN is required for real mode",
		);
	});
});
